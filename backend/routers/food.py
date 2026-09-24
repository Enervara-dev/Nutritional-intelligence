from fastapi import APIRouter, HTTPException
from datetime import date, datetime
from collections import defaultdict
import json, os
import schemas
from engine.nutrition_calc import calculate_nutrition

router = APIRouter()

FOODS_PATH = os.path.join(os.path.dirname(__file__), "../data/foods.json")

# In-memory storage for logged meals per patient session (Zero DB insertions)
SESSION_FOOD_LOGS = defaultdict(list)
_log_counter = 1


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
def log_food(entry: schemas.FoodLogIn):
    global _log_counter
    foods = load_foods()
    food = next((f for f in foods if f["id"] == entry.food_id), None)
    if not food:
        raise HTTPException(status_code=404, detail=f"Food '{entry.food_id}' not found")

    nutrition = calculate_nutrition(food, entry.quantity_type, entry.quantity_value)
    log_id = _log_counter
    _log_counter += 1

    log_entry = {
        "id": log_id,
        "user_id": str(entry.user_id),
        "food_id": entry.food_id,
        "food_name": food["name"],
        "meal_type": entry.meal_type,
        "quantity_type": entry.quantity_type,
        "quantity_value": entry.quantity_value,
        "calories": nutrition.get("calories", 0),
        "protein_g": nutrition.get("protein_g", 0),
        "carbs_g": nutrition.get("carbs_g", 0),
        "fat_g": nutrition.get("fat_g", 0),
        "logged_at": datetime.now()
    }
    SESSION_FOOD_LOGS[str(entry.user_id)].append(log_entry)
    return log_entry


@router.get("/food/log/{user_id}/today")
def get_today_food_log(user_id: str):
    today = date.today()
    uid = str(user_id)
    user_logs = SESSION_FOOD_LOGS.get(uid, [])
    logs = [l for l in user_logs if l["logged_at"].date() == today]

    # Group by meal slot
    slots = {"breakfast": [], "lunch": [], "dinner": [], "snacks": [], "other": []}
    for log in logs:
        slot = log["meal_type"] if log["meal_type"] in slots else "other"
        slots[slot].append({
            "id": log["id"], "food_id": log["food_id"], "food_name": log["food_name"],
            "quantity_type": log["quantity_type"], "quantity_value": log["quantity_value"],
            "calories": log["calories"], "protein_g": log["protein_g"],
            "carbs_g": log["carbs_g"], "fat_g": log["fat_g"],
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
def delete_food_log(log_id: int):
    found = False
    for uid, logs in SESSION_FOOD_LOGS.items():
        before_len = len(logs)
        SESSION_FOOD_LOGS[uid] = [l for l in logs if l["id"] != log_id]
        if len(SESSION_FOOD_LOGS[uid]) < before_len:
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"detail": "Deleted"}
