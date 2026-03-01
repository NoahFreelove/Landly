from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Market, MarketBet, Payment, KlarnaDebt
from schemas import MarketResponse, MarketBetRequest, MarketBetResponse, LeaderboardEntry, AddTokensRequest, AddTokensResponse
from services.auth import get_current_user

router = APIRouter(prefix="/api/markets", tags=["markets"])

@router.get("", response_model=list[MarketResponse])
def list_markets(db: Session = Depends(get_db)):
    return db.query(Market).filter(Market.is_active == True).all()

@router.post("/{market_id}/bet", response_model=MarketBetResponse)
def place_bet(
    market_id: int,
    req: MarketBetRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    market = db.query(Market).filter(Market.id == market_id, Market.is_active == True).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found or inactive")

    if user.token_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient LDLY balance")

    user.token_balance -= req.amount

    bet = MarketBet(user_id=user.id, market_id=market_id, position=req.position, amount=req.amount)
    db.add(bet)

    # Adjust prices based on bet
    market.volume += int(req.amount)
    if req.position == "yes":
        market.yes_price = min(0.99, market.yes_price + 0.01 * req.amount / 100)
        market.no_price = max(0.01, 1.0 - market.yes_price)
    else:
        market.no_price = min(0.99, market.no_price + 0.01 * req.amount / 100)
        market.yes_price = max(0.01, 1.0 - market.no_price)

    db.commit()
    db.refresh(bet)
    return bet

@router.post("/wallet/add-tokens", response_model=AddTokensResponse)
def add_tokens(
    req: AddTokensRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    user.token_balance += req.amount

    if req.klarna_installments:
        apr = 0.35
        total_with_interest = req.amount * (1 + apr * req.klarna_installments / 12)
        debt = KlarnaDebt(
            user_id=user.id,
            item_name=f"LDLY Token Purchase — {req.amount:.0f} tokens",
            total_amount=round(total_with_interest, 2),
            installments=req.klarna_installments,
            installments_paid=0,
            status="active",
        )
        db.add(debt)

    db.commit()
    return AddTokensResponse(new_balance=user.token_balance)

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).all()
    entries = []
    for u in users:
        overdue = db.query(Payment).filter(Payment.user_id == u.id, Payment.status.in_(["overdue", "defaulted"])).all()
        missed = len(overdue)
        total_owed = sum(p.amount + p.accrued_interest for p in overdue)

        # Calculate eviction odds: higher missed payments + lower social credit = higher odds
        odds = min(95.0, max(5.0, missed * 15.0 + max(0, (500 - u.social_credit_score)) * 0.1 + total_owed * 0.01))

        entries.append(LeaderboardEntry(
            citizen_id=u.citizen_id,
            name=u.name,
            missed_payments=missed,
            social_credit_score=u.social_credit_score,
            eviction_odds=round(odds, 1),
            total_owed=round(total_owed, 2)
        ))

    return sorted(entries, key=lambda e: e.eviction_odds, reverse=True)
