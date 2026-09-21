from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast
from datetime import date, datetime, timezone
import json, os
from database import get_db
import models, schemas
from engine.nutrition_calc import calculate_nutrition

router = APIRouter()

FOODS_PATH = os.path.join(os.path.dirname(__file__), "../data/foods.json")

def load_foods():
    with open(FOODS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/foods/list")
def get_foods(diet_type: str = None):
    foods = load_foods()
    if diet_type:
        foods = [f for f in foods if diet_type in f.get("diet_types", [])]
    return foods


@router.post("/food/log", response_model=schemas.FoodLogOut)
def log_food(entry: schemas.FoodLogIn, db: Session = Depends(get_db)):
    foods = load_foods()
    food = next((f for f in foods if f["id"] == entry.food_id), None)
    if not food:
        raise HTTPException(status_code=404, detail=f"Food '{entry.food_id}' not found")

    nutrition = calculate_nutrition(food, entry.quantity_type, entry.quantity_value)

    log = models.FoodLog(
        user_id=entry.user_id,
        food_id=entry.food_id,
        food_name=food["name"],
        meal_type=entry.meal_type,
        quantity_type=entry.quantity_type,
        quantity_value=entry.quantity_value,
        calories=nutrition.get("calories", 0),
        protein_g=nutrition.get("protein_g", 0),
        carbs_g=nutrition.get("carbs_g", 0),
        fat_g=nutrition.get("fat_g", 0),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/food/log/{user_id}/today")
def get_today_food_log(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    logs = db.query(models.FoodLog).filter(
        models.FoodLog.user_id == user_id,
        func.date(models.FoodLog.logged_at) == today
    ).all()

    # Group by meal slot
    slots = {"breakfast": [], "lunch": [], "dinner": [], "snacks": [], "other": []}
    for log in logs:
        slot = log.meal_type if log.meal_type in slots else "other"
        slots[slot].append({
            "id": log.id, "food_id": log.food_id, "food_name": log.food_name,
            "quantity_type": log.quantity_type, "quantity_value": log.quantity_value,
            "calories": log.calories, "protein_g": log.protein_g,
            "carbs_g": log.carbs_g, "fat_g": log.fat_g,
        })

    # Per-slot totals
    slot_totals = {}
    for slot, items in slots.items():
        slot_totals[slot] = {
            "calories": round(sum(i["calories"] for i in items), 2),
            "protein_g": round(sum(i["protein_g"] for i in items), 2),
            "carbs_g":   round(sum(i["carbs_g"]   for i in items), 2),
            "fat_g":     round(sum(i["fat_g"]      for i in items), 2),
        }

    # Daily totals
    all_items = [i for items in slots.values() for i in items]
    daily_totals = {
        "calories": round(sum(i["calories"] for i in all_items), 2),
        "protein_g": round(sum(i["protein_g"] for i in all_items), 2),
        "carbs_g":   round(sum(i["carbs_g"]   for i in all_items), 2),
        "fat_g":     round(sum(i["fat_g"]      for i in all_items), 2),
    }

    return {"slots": slots, "slot_totals": slot_totals, "daily_totals": daily_totals}


@router.delete("/food/log/{log_id}")
def delete_food_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.FoodLog).filter(models.FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()
    return {"detail": "Deleted"}
