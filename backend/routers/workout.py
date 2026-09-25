from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from collections import defaultdict
import json, os
from database import get_db, engine
import models, schemas
from engine.burn_calc import calculate_burn

router = APIRouter()

WORKOUTS_PATH = os.path.join(os.path.dirname(__file__), "../data/workouts.json")

# In-memory storage for logged workouts per patient session (Zero DB insertions)
SESSION_WORKOUT_LOGS = defaultdict(list)
_workout_counter = 1


def load_workouts():
    with open(WORKOUTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/workouts/list")
def get_workouts():
    return load_workouts()


@router.post("/workout/log", response_model=schemas.WorkoutLogOut)
def log_workout(entry: schemas.WorkoutLogIn, db: Session = Depends(get_db)):
    global _workout_counter
    workouts = load_workouts()
    workout = next((w for w in workouts if w["id"] == entry.workout_id), None)
    if not workout:
        raise HTTPException(status_code=404, detail=f"Workout '{entry.workout_id}' not found")

    # Read-only fetch of patient weight from database for MET calculation
    weight_kg = 70.0
    uid_str = str(entry.user_id)
    try:
        patient = None
        if "@" in uid_str:
            auth_u = db.query(models.AuthUser).filter(func.lower(models.AuthUser.email) == uid_str.strip().lower()).first()
            if auth_u:
                patient = db.query(models.Patient).filter(models.Patient.user_id == auth_u.id).first()
        if not patient and len(uid_str) >= 32:
            try:
                import uuid
                uuid.UUID(uid_str)
                patient = db.query(models.Patient).filter((models.Patient.id == uid_str) | (models.Patient.user_id == uid_str)).first()
            except Exception:
                pass
        if patient and patient.weight_kg:
            weight_kg = float(patient.weight_kg)
    except Exception:
        db.rollback()

    if weight_kg == 70.0 and uid_str.isdigit() and engine.dialect.name == "sqlite":
        try:
            local_u = db.query(models.LocalUserProfile).filter(models.LocalUserProfile.id == int(uid_str)).first()
            if local_u and local_u.weight_kg:
                weight_kg = float(local_u.weight_kg)
        except Exception:
            db.rollback()

    calories_burned = calculate_burn(workout, entry.input_type, entry.input_value, weight_kg)
    log_id = _workout_counter
    _workout_counter += 1

    log_entry = {
        "id": log_id,
        "user_id": uid_str,
        "workout_id": entry.workout_id,
        "workout_name": workout["name"],
        "input_type": entry.input_type,
        "input_value": entry.input_value,
        "calories_burned": calories_burned,
        "logged_at": datetime.now()
    }
    SESSION_WORKOUT_LOGS[uid_str].append(log_entry)
    return log_entry


@router.get("/workout/log/{user_id}/today")
def get_today_workout_log(user_id: str):
    today = date.today()
    uid = str(user_id)
    user_logs = SESSION_WORKOUT_LOGS.get(uid, [])
    logs = [l for l in user_logs if l["logged_at"].date() == today]

    entries = [{
        "id": log["id"],
        "workout_id": log["workout_id"],
        "workout_name": log["workout_name"],
        "input_type": log["input_type"],
        "input_value": log["input_value"],
        "calories_burned": log["calories_burned"],
    } for log in logs]

    total_burned = round(sum(e["calories_burned"] for e in entries), 2)
    return {"workouts": entries, "total_calories_burned": total_burned}


@router.delete("/workout/log/{log_id}")
def delete_workout_log(log_id: int):
    found = False
    for uid, logs in SESSION_WORKOUT_LOGS.items():
        before_len = len(logs)
        SESSION_WORKOUT_LOGS[uid] = [l for l in logs if l["id"] != log_id]
        if len(SESSION_WORKOUT_LOGS[uid]) < before_len:
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"detail": "Deleted"}
