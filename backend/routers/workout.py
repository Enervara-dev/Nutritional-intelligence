from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import json, os
from database import get_db
import models, schemas
from engine.burn_calc import calculate_burn

router = APIRouter()

WORKOUTS_PATH = os.path.join(os.path.dirname(__file__), "../data/workouts.json")

def load_workouts():
    with open(WORKOUTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/workouts/list")
def get_workouts():
    return load_workouts()


@router.post("/workout/log", response_model=schemas.WorkoutLogOut)
def log_workout(entry: schemas.WorkoutLogIn, db: Session = Depends(get_db)):
    workouts = load_workouts()
    workout = next((w for w in workouts if w["id"] == entry.workout_id), None)
    if not workout:
        raise HTTPException(status_code=404, detail=f"Workout '{entry.workout_id}' not found")

    # Get user weight for MET calculation
    user = db.query(models.User).filter(models.User.id == entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    weight_kg = user.weight_kg or 70  # fallback to 70kg if not set
    calories_burned = calculate_burn(workout, entry.input_type, entry.input_value, weight_kg)

    log = models.WorkoutLog(
        user_id=entry.user_id,
        workout_id=entry.workout_id,
        workout_name=workout["name"],
        input_type=entry.input_type,
        input_value=entry.input_value,
        calories_burned=calories_burned,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/workout/log/{user_id}/today")
def get_today_workout_log(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    logs = db.query(models.WorkoutLog).filter(
        models.WorkoutLog.user_id == user_id,
        func.date(models.WorkoutLog.logged_at) == today
    ).all()

    entries = [{
        "id": log.id,
        "workout_id": log.workout_id,
        "workout_name": log.workout_name,
        "input_type": log.input_type,
        "input_value": log.input_value,
        "calories_burned": log.calories_burned,
    } for log in logs]

    total_burned = round(sum(e["calories_burned"] for e in entries), 2)

    return {"workouts": entries, "total_calories_burned": total_burned}


@router.delete("/workout/log/{log_id}")
def delete_workout_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.WorkoutLog).filter(models.WorkoutLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()
    return {"detail": "Deleted"}
