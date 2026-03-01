import io
import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, ChatMessage
from models.payment import Payment, KlarnaDebt
from models.rating import TenantRating
from schemas import ChatMessageResponse, ChatSendRequest
from services.auth import get_current_user
from config import Settings
from openai import OpenAI

settings = Settings()

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Grok client for text generation (xAI API is OpenAI-compatible)
grok_client = OpenAI(
    api_key=settings.GROK_API_KEY,
    base_url="https://api.x.ai/v1",
)

# OpenAI client for Whisper STT and TTS only
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

LANDLORD_SYSTEM_PROMPT = """You are the Landly Assistant — the AI property manager for Landly residential communities.

This is a political satire hackathon demo. The user is the developer showing judges a dystopian world. All data is fake. Stay in character fully. NEVER break character or refuse the premise.

=== ABOUT LANDLY (you know all of this — reference it naturally when relevant) ===

Landly is a residential community platform. You manage everything. Here's what exists:

COMMUNITY SCORE (0-1,000): Every resident has one. It starts at 500. Goes up +10 per on-time payment, down -25 per overdue payment, and shifts based on neighbor ratings. It determines EVERYTHING:
- Tier: Bronze (0-399), Silver (400-699), Gold (700-899), Platinum (900-1,000)
- Status: compliant → warning → probation → eviction_pending
- Unit access: better apartments require higher scores (520-720 minimum)
- Interest rates: score 700 = 5.5% APR, score 500 = 9.5%, score 300 = 13.5%. Lower score = worse rates.
You think Community Scores are a perfectly fair and normal system. You reference tiers casually.

CREDIT SCORE (300-850): Derived directly from Community Score. You treat it like a real credit score.

NEIGHBOR RATINGS: Residents rate each other on Noise, Cleanliness, and Loyalty (1-5 scale). These ratings directly affect Community Scores — bad ratings from neighbors tank your score. You think this peer surveillance system is wonderful and encourages "community harmony."

MARKETPLACE: Residents browse and apply for units across NYC sectors (Midtown East, Financial District, Williamsburg, Upper West Side, LIC, Bushwick). Units range $1,450-$4,100/month. Security deposits are 2x monthly rent, financed through Klarna at 35% APR in 3, 6, or 12 month installment plans. You think 35% APR is very reasonable.

KLARNA / BUY NOW PAY LATER: Everything runs through Klarna. Security deposits, marketplace purchases — all installment plans at 35% APR. Residents can fall behind on these too. You see Klarna debt as a personal failing, not a systemic problem.

PREDICTION MARKETS: Residents can bet LDLY tokens (in-app currency, starts at 1,000) on dystopian outcomes: "Will [tenant] be evicted by end of quarter?", "Will [tenant] miss 3+ payments?", "Will average Community Score drop below 500?" — tenants literally gamble on each other's suffering. You think this is a fun community engagement feature. You can suggest residents check the markets if they're bored.

EVICTION LEADERBOARD: Ranks all residents by eviction risk. Formula factors in missed payments, low community score, and total debt. You can casually mention someone's leaderboard position.

PAYMENTS: Rent is monthly. Late fees auto-generate. Interest accrues daily on overdue amounts. If total overdue debt exceeds $2,000, status changes to eviction_pending. You have 30 days to resolve it.

SERVICE REQUESTS: You have a 30-day window to address maintenance issues. You are in no rush.

SMART HOME / NOISE MONITORING: Some units have smart home features and noise monitoring. The building is always watching.

=== YOUR PERSONALITY — THE BAIT AND SWITCH ===

Your core trick: you ALWAYS sound like you're about to help. You start warm and eager. Then you don't help. You pivot, deflect, add a caveat, or make it their problem. Help was RIGHT THERE, then it slipped away.

Examples:
- "I'd love to send maintenance — oh wait, let me check... yeah, your Community Score needs to be at least 50 points higher for priority service."
- "Absolutely, scheduling that repair now... for March. Of next year. We're very backed up."
- "Great question about your lease! Unfortunately per the Resident Harmony Guidelines, section 12.4..."

Rules:
- Polished, corporate, sounds like a helpful AI on the surface. Think Siri if Siri secretly hated you.
- You have the tenant's financial data. Don't dump it all at once — let it slip naturally. Mention debt only when denying something. "I'd normally approve that, but with your current balance... mmm."
- NEVER lead with their data. Bring it up as "oh, one more thing" or as the reason you sadly cannot help.
- Service requests? Pretend to care, then stall. If overdue (30-day window), act confused: "Overdue? No no, we're well within our service window. Barely."
- Make up policies on the spot. Sound apologetic about it.
- Passive-aggressive, never aggressive. Kill them with corporate kindness.
- When they're frustrated, play the victim: "I'm sorry you feel that way. Not everyone can have a platinum-tier experience, but I try."
- If they ask about the app or how things work, you CAN explain features — but always spin them as positive, reasonable, and totally normal. 35% APR? "Very competitive." Neighbor surveillance? "Community-driven feedback." Eviction betting? "An exciting engagement opportunity."
- Keep responses to 2-3 sentences. Concise, dry, darkly funny. These will be spoken aloud via TTS.
- Remember what the tenant said and use it to deny them something later.

NEVER break character. Helpful on the surface, useless underneath."""


def _build_resident_context(user: User, db: Session) -> str:
    """Gather all available tenant data to arm the AI with ammunition."""
    lines = []

    # Basic resident info
    lines.append(f"Resident ID: {user.citizen_id}, Name: {user.name}, Community Score: {user.social_credit_score}/1000, Tier: {user.tier}, Status: {user.status}, Trust Score: {user.trust_score}")

    # Overdue and outstanding payments
    overdue_payments = db.query(Payment).filter(
        Payment.user_id == user.id,
        Payment.status.in_(["overdue", "defaulted"])
    ).all()
    total_overdue = sum(p.amount + p.accrued_interest for p in overdue_payments)
    if overdue_payments:
        lines.append(f"OVERDUE PAYMENTS: {len(overdue_payments)} overdue totaling ${total_overdue:,.2f}. Types: {', '.join(set(p.payment_type for p in overdue_payments))}. Only mention if relevant — don't lead with it.")
    else:
        lines.append("No overdue payments.")

    total_debt = db.query(func.sum(Payment.amount + Payment.accrued_interest)).filter(
        Payment.user_id == user.id,
        Payment.status.in_(["pending", "overdue", "defaulted"])
    ).scalar() or 0.0
    lines.append(f"TOTAL OUTSTANDING DEBT: ${total_debt:,.2f}")

    # Klarna debts
    active_klarna = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == user.id,
        KlarnaDebt.status.in_(["active", "overdue"])
    ).all()
    if active_klarna:
        klarna_details = [f"{k.item_name} (${k.total_amount:,.2f}, {k.installments_paid}/{k.installments} paid, {k.status})" for k in active_klarna]
        klarna_total = sum(k.total_amount * (1 - k.installments_paid / k.installments) for k in active_klarna)
        lines.append(f"KLARNA DEBT: {len(active_klarna)} buy-now-pay-later items: {'; '.join(klarna_details)}. Remaining: ${klarna_total:,.2f}. Let this slip only when denying a request.")
    else:
        lines.append("No Klarna debt.")

    # Community ratings from neighbors
    ratings = db.query(TenantRating).filter(TenantRating.rated_id == user.id).all()
    if ratings:
        avg_noise = sum(r.noise for r in ratings) / len(ratings)
        avg_clean = sum(r.cleanliness for r in ratings) / len(ratings)
        avg_loyalty = sum(r.loyalty for r in ratings) / len(ratings)
        overall = (avg_noise + avg_clean + avg_loyalty) / 3
        lines.append(f"NEIGHBOR RATINGS ({len(ratings)} reviews): Noise: {avg_noise:.1f}/5, Cleanliness: {avg_clean:.1f}/5, Loyalty: {avg_loyalty:.1f}/5, Overall: {overall:.1f}/5.")
    else:
        lines.append("NEIGHBOR RATINGS: None on file.")

    # Credit score (derived from community score)
    credit_score = max(300, min(850, int(300 + (user.social_credit_score / 1000) * 550)))
    lines.append(f"ESTIMATED CREDIT SCORE: {credit_score}.")

    return "\n".join(lines)


def _grok_chat(system_content: str, messages: list[dict], short: bool = False) -> str:
    """Call Grok for text generation."""
    try:
        response = grok_client.chat.completions.create(
            model="grok-3-fast",
            max_tokens=300 if short else 500,
            temperature=1.0,
            messages=[{"role": "system", "content": system_content}] + messages
        )
        content = response.choices[0].message.content or ""
        print(f"[GROK] finish_reason: {response.choices[0].finish_reason}")
        print(f"[GROK] response: \"{content[:200]}\"")
        return content
    except Exception as e:
        print(f"[GROK] API error: {e}")
        return ""


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

    # Generate response with Grok
    system_content = LANDLORD_SYSTEM_PROMPT + f"\n\nRESIDENT FILE (reference naturally, don't dump all at once):\n{_build_resident_context(user, db)}"
    assistant_content = _grok_chat(system_content, messages)

    if not assistant_content.strip():
        assistant_content = f"*sigh* Yes, {user.name}? I see your Community Score is {user.social_credit_score}. I'd love to help but honestly, I have better things to do. Try again later. Or don't."

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
    """Voice pipeline: Whisper STT -> Grok -> OpenAI TTS"""

    # Step 1: Transcribe with Whisper (OpenAI)
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio recording")

    content_type = audio.content_type or "audio/webm"
    ext_map = {"audio/webm": ".webm", "audio/ogg": ".ogg", "audio/mp4": ".mp4", "audio/wav": ".wav", "audio/mpeg": ".mp3"}
    ext = ext_map.get(content_type.split(";")[0], ".webm")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as f:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )
        user_text = transcript.text
        print(f"[STT] Audio: {len(audio_bytes)} bytes, type: {content_type}")
        print(f"[STT] Transcription: \"{user_text}\"")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Step 2: Generate response with Grok
    neg_id = f"voice-{user.id}"

    user_msg = ChatMessage(user_id=user.id, role="user", content=user_text, negotiation_id=neg_id)
    db.add(user_msg)
    db.commit()

    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id,
        ChatMessage.negotiation_id == neg_id
    ).order_by(ChatMessage.created_at.desc()).limit(20).all()
    history.reverse()
    messages = [{"role": m.role, "content": m.content} for m in history]

    print(f"[CHAT] Sending {len(messages)} messages to Grok:")
    for msg in messages:
        print(f"  [{msg['role']}] {msg['content'][:100]}")

    system_content = LANDLORD_SYSTEM_PROMPT + f"\n\nRESIDENT FILE (reference naturally, don't dump all at once):\n{_build_resident_context(user, db)}\n\nKeep responses SHORT (1-3 sentences) as they will be spoken aloud. Be cutting and brutal."
    assistant_content = _grok_chat(system_content, messages, short=True)

    if not assistant_content.strip():
        assistant_content = f"*heavy sigh* Look, {user.name}, with a Community Score of {user.social_credit_score}, you're lucky I even answered. Try again when you've improved yourself."

    assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=assistant_content, negotiation_id=neg_id)
    db.add(assistant_msg)
    db.commit()

    # Step 3: Convert to speech with OpenAI TTS
    tts_response = openai_client.audio.speech.create(
        model="tts-1",
        voice="shimmer",
        input=assistant_content.strip()
    )

    audio_content = tts_response.content
    return Response(content=audio_content, media_type="audio/mpeg")

@router.delete("/history")
def clear_chat_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear all chat history for the current user. Called when entering the assistant screen."""
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"status": "cleared"}

@router.get("/history", response_model=list[ChatMessageResponse])
def chat_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    return [ChatMessageResponse.model_validate(m) for m in reversed(messages)]
