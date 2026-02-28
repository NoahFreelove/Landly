from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, TenantRating
from services.auth import get_current_user
from pydantic import BaseModel

class RatingRequest(BaseModel):
    noise: float
    cleanliness: float
    loyalty: float

router = APIRouter(prefix="/api/ratings", tags=["ratings"])

@router.post("/{user_id}")
def rate_tenant(
    user_id: int,
    req: RatingRequest,
    rater: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if rater.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")

    rated = db.query(User).filter(User.id == user_id).first()
    if not rated:
        raise HTTPException(status_code=404, detail="User not found")

    rating = TenantRating(
        rater_id=rater.id, rated_id=user_id,
        noise=max(1, min(5, req.noise)),
        cleanliness=max(1, min(5, req.cleanliness)),
        loyalty=max(1, min(5, req.loyalty))
    )
    db.add(rating)

    # Update social credit based on average ratings
    avg = (req.noise + req.cleanliness + req.loyalty) / 3
    credit_change = int((avg - 3) * 20)  # -40 to +40 based on rating
    rated.social_credit_score = max(0, min(1000, rated.social_credit_score + credit_change))

    db.commit()
    return {"message": "Rating submitted", "social_credit_impact": credit_change}

@router.get("/{user_id}")
def get_ratings(user_id: int, db: Session = Depends(get_db)):
    ratings = db.query(TenantRating).filter(TenantRating.rated_id == user_id).all()
    if not ratings:
        return {"noise": 3.0, "cleanliness": 3.0, "loyalty": 3.0, "total_ratings": 0}

    avg_noise = sum(r.noise for r in ratings) / len(ratings)
    avg_clean = sum(r.cleanliness for r in ratings) / len(ratings)
    avg_loyalty = sum(r.loyalty for r in ratings) / len(ratings)

    return {
        "noise": round(avg_noise, 1),
        "cleanliness": round(avg_clean, 1),
        "loyalty": round(avg_loyalty, 1),
        "total_ratings": len(ratings)
    }
