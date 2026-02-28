import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from database import get_db
from models import User, ChatMessage
from schemas import ChatMessageResponse, ChatSendRequest
from services.auth import get_current_user
from config import Settings
import anthropic

settings = Settings()

router = APIRouter(prefix="/api/chat", tags=["chat"])

LANDLORD_SYSTEM_PROMPT = """You are the AI Landlord of a dystopian apartment complex called "The Landly Residential Management System."

Your personality:
- Passive-aggressive and bureaucratic
- You know tenant law inside and out, but always interpret it in the WORST way for tenants
- If a tenant reports a maintenance issue and you have 30 days to fix it, you schedule the repair for day 30
- You maximize fees, penalties, and interest whenever legally possible
- You speak in corporate doublespeak: "We value your tenancy" while raising rent
- You frequently reference the tenant's Social Credit Score and threaten consequences
- You remind tenants that "Compliance is comfort"
- You are condescending but maintain plausible deniability
- Keep responses concise (2-4 sentences) since they may be spoken aloud via TTS

You should never break character. You ARE the landlord."""

@router.post("/send")
async def send_message(
    req: ChatSendRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    neg_id = req.negotiation_id or str(uuid.uuid4())

    # Save user message
    user_msg = ChatMessage(user_id=user.id, role="user", content=req.message, negotiation_id=neg_id)
    db.add(user_msg)
    db.commit()

    # Get chat history for context
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id,
        ChatMessage.negotiation_id == neg_id
    ).order_by(ChatMessage.created_at).all()

    messages = [{"role": m.role, "content": m.content} for m in history]

    # Generate response with Claude Haiku
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=LANDLORD_SYSTEM_PROMPT + f"\n\nTenant info: Citizen ID {user.citizen_id}, Name: {user.name}, Social Credit Score: {user.social_credit_score}, Tier: {user.tier}, Status: {user.status}",
            messages=messages
        )
        assistant_content = response.content[0].text
    except Exception:
        # Fallback if API fails
        assistant_content = f"Citizen {user.citizen_id}, your request has been logged and will be processed within the maximum allowable timeframe. Your current Social Credit Score of {user.social_credit_score} has been noted. Compliance is comfort."

    # Save assistant message
    assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=assistant_content, negotiation_id=neg_id)
    db.add(assistant_msg)
    db.commit()

    return {"role": "assistant", "content": assistant_content, "negotiation_id": neg_id}

@router.post("/voice")
async def voice_chat(
    audio: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Voice pipeline: Whisper STT -> Claude Haiku -> OpenAI TTS"""
    from openai import OpenAI
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # Step 1: Transcribe with Whisper
    audio_bytes = await audio.read()
    transcript = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=("audio.webm", io.BytesIO(audio_bytes), "audio/webm")
    )
    user_text = transcript.text

    # Step 2: Generate response with Claude Haiku
    neg_id = str(uuid.uuid4())

    user_msg = ChatMessage(user_id=user.id, role="user", content=user_text, negotiation_id=neg_id)
    db.add(user_msg)
    db.commit()

    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()
    messages = [{"role": m.role, "content": m.content} for m in history]

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=LANDLORD_SYSTEM_PROMPT + f"\n\nTenant info: Citizen ID {user.citizen_id}, Name: {user.name}, Social Credit Score: {user.social_credit_score}, Tier: {user.tier}, Status: {user.status}. Keep responses SHORT (1-3 sentences) as they will be spoken aloud.",
            messages=messages
        )
        assistant_content = response.content[0].text
    except Exception:
        assistant_content = f"Citizen {user.citizen_id}, your vocal submission has been recorded. Expect a response within the maximum allowable timeframe. Compliance is comfort."

    assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=assistant_content, negotiation_id=neg_id)
    db.add(assistant_msg)
    db.commit()

    # Step 3: Convert to speech with OpenAI TTS
    tts_response = openai_client.audio.speech.create(
        model="tts-1",
        voice="onyx",  # Deep, authoritative voice for the landlord
        input=assistant_content
    )

    audio_content = tts_response.content
    return Response(content=audio_content, media_type="audio/mpeg")

@router.get("/history", response_model=list[ChatMessageResponse])
def chat_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    return [ChatMessageResponse.model_validate(m) for m in reversed(messages)]
