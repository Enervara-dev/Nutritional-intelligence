from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date


# ── User ──────────────────────────────────────────────
class AllergyItem(BaseModel):
    name: str
    severity: str  # mild / moderate / severe

class SurgeryItem(BaseModel):
    type: str
    year: Optional[int] = None
    hospital: Optional[str] = None
    recovery_status: str  # recovering / fully_recovered

class UserProfileIn(BaseModel):
    # Basic
    name: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    # Lifestyle
    diet_type: Optional[str] = None
    exercise_habit: Optional[str] = None
    alcohol: Optional[str] = None
    smoking: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_cups: Optional[int] = None
    # Health
    conditions: Optional[List[str]] = []
    allergies: Optional[List[AllergyItem]] = []
    medications: Optional[List[str]] = []
    surgeries: Optional[List[SurgeryItem]] = []
    # Mental Wellbeing
    mood: Optional[int] = None
    stress: Optional[int] = None
    energy: Optional[int] = None
    work_pressure: Optional[int] = None
    relaxation: Optional[str] = None
    # Goal
    health_goal: Optional[str] = None

class UserProfileOut(UserProfileIn):
    id: int
    age: Optional[int] = None
    bmi: Optional[float] = None

    class Config:
        from_attributes = True


# ── Food Log ──────────────────────────────────────────
class FoodLogIn(BaseModel):
    user_id: int
    food_id: str
    meal_type: str          # breakfast / lunch / dinner / snacks / other
    quantity_type: str
    quantity_value: str

class FoodLogOut(BaseModel):
    id: int
    user_id: int
    food_id: str
    food_name: str
    meal_type: str
    quantity_type: str
    quantity_value: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float

    class Config:
        from_attributes = True


# ── Workout Log ───────────────────────────────────────
class WorkoutLogIn(BaseModel):
    user_id: int
    workout_id: str
    input_type: str     # duration / reps
    input_value: float

class WorkoutLogOut(BaseModel):
    id: int
    user_id: int
    workout_id: str
    workout_name: str
    input_type: str
    input_value: float
    calories_burned: float

    class Config:
        from_attributes = True
