from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
import models, schemas

router = APIRouter()


def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _calc_bmi(weight_kg: float, height_cm: float) -> float:
    h = height_cm / 100
    return round(weight_kg / (h * h), 1)


@router.post("/profile", response_model=schemas.UserProfileOut)
def create_or_update_profile(profile: schemas.UserProfileIn, db: Session = Depends(get_db)):
    # Auto-calculate age and BMI
    age = _calc_age(profile.dob) if profile.dob else None
    bmi = _calc_bmi(profile.weight_kg, profile.height_cm) if (profile.weight_kg and profile.height_cm) else None

    allergies_data = [a.model_dump() for a in profile.allergies] if profile.allergies else []
    surgeries_data = [s.model_dump() for s in profile.surgeries] if profile.surgeries else []

    db_user = models.User(
        name=profile.name, dob=profile.dob, age=age, sex=profile.sex,
        height_cm=profile.height_cm, weight_kg=profile.weight_kg, bmi=bmi,
        state=profile.state, city=profile.city,
        diet_type=profile.diet_type, exercise_habit=profile.exercise_habit,
        alcohol=profile.alcohol, smoking=profile.smoking,
        sleep_hours=profile.sleep_hours, water_cups=profile.water_cups,
        conditions=profile.conditions, allergies=allergies_data,
        medications=profile.medications, surgeries=surgeries_data,
        mood=profile.mood, stress=profile.stress, energy=profile.energy,
        work_pressure=profile.work_pressure, relaxation=profile.relaxation,
        health_goal=profile.health_goal,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}/profile", response_model=schemas.UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
