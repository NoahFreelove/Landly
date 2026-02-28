from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, KlarnaDebt
from schemas import UnitResponse, UnitApplyRequest
from services.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/api/units", tags=["units"])

@router.get("", response_model=list[UnitResponse])
def list_units(
    sector: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Unit).filter(Unit.is_available == True)
    if sector:
        query = query.filter(Unit.sector == sector)
    if max_price:
        query = query.filter(Unit.monthly_rent_usd <= max_price)
    return query.all()

@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit

@router.post("/{unit_id}/apply")
def apply_for_unit(
    unit_id: int,
    req: UnitApplyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.is_available == True).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found or unavailable")

    # Create Klarna debt for the rental
    installment_amount = unit.monthly_rent_usd / req.klarna_installments
    debt = KlarnaDebt(
        user_id=user.id,
        item_name=f"Rent: {unit.name}",
        total_amount=unit.monthly_rent_usd * req.klarna_installments,
        installments=req.klarna_installments,
        installments_paid=0,
        status="active"
    )
    db.add(debt)

    # Assign user to unit
    user.unit_id = unit.id
    unit.is_available = False

    db.commit()
    return {"message": f"Application approved. Welcome to {unit.name}.", "monthly_payment": round(installment_amount, 2)}
