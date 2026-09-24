from pydantic import BaseModel, Field
from typing import Optional, List, Any, Union
from datetime import date


# ── User & Patient ────────────────────────────────────
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
    email: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    blood_group: Optional[str] = None
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
    id: Any
    age: Optional[int] = None
    bmi: Optional[float] = None
    prescriptions: Optional[List[Any]] = []

    class Config:
        from_attributes = True

class PatientSummary(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    prescription_count: int = 0
    conditions_count: int = 0
    email: Optional[str] = None


# ── Food Log ──────────────────────────────────────────
class FoodLogIn(BaseModel):
    user_id: Any
    food_id: str
    meal_type: str          # breakfast / lunch / dinner / snacks / other
    quantity_type: str
    quantity_value: str

class FoodLogOut(BaseModel):
    id: int
    user_id: Any
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
    user_id: Any
    workout_id: str
    input_type: str     # duration / reps
    input_value: float

class WorkoutLogOut(BaseModel):
    id: int
    user_id: Any
    workout_id: str
    workout_name: str
    input_type: str
    input_value: float
    calories_burned: float

    class Config:
        from_attributes = True


# ── Clinical Assessment Intelligence ──────────────────
class ClinicalAssessmentGuidance(BaseModel):
    is_good: bool = Field(
        ...,
        description="True if logged nutrition and lifestyle choices are beneficial; False if harmful or concerning"
    )
    food_assessment: str = Field(
        ...,
        description="Plain-English clinical evaluation with biochemical rationale and positive encouragement"
    )
    multi_day_pattern: Optional[str] = Field(
        None,
        description="Detection of multi-day recurring dietary patterns across past days (e.g. 4 consecutive days of oily foods)"
    )
    healthier_alternatives: List[str] = Field(
        default_factory=list,
        description="2 to 3 targeted whole-food alternatives respecting patient allergies and diet preferences"
    )
    daily_portion_limit: str = Field(
        ...,
        description="Explicit quantifiable daily threshold distinguishing safe amounts from adverse thresholds"
    )
    workout_impact: Optional[str] = Field(
        None,
        description="Clinical observation of exercise energy expenditure, fueling adequacy, and recovery"
    )

    def to_formatted_text(self) -> str:
        """Serializes the structured Pydantic model into the standard clean clinical text summary."""
        parts = [f"Food Assessment: {self.food_assessment}"]
        if self.multi_day_pattern:
            parts.append(f"Pattern Warning: {self.multi_day_pattern}")
        if self.workout_impact:
            parts.append(f"Exercise Impact: {self.workout_impact}")
        alts = ", ".join(self.healthier_alternatives) if self.healthier_alternatives else "None specified"
        parts.append(f"Healthier Alternatives: {alts}")
        parts.append(f"Daily Portion Limit: {self.daily_portion_limit}")
        return "\n".join(parts)


class AssessmentResponse(BaseModel):
    assessment_id: int
    user_id: Any
    assessed_at: Optional[str] = None
    guidance: ClinicalAssessmentGuidance
    ai_report: str
    dos: List[Any] = []
    donts: List[Any] = []
    cautions: List[Any] = []
    collisions: List[Any] = []
    tips: List[Any] = []
    profile_evaluated: Optional[dict] = None

    class Config:
        from_attributes = True
