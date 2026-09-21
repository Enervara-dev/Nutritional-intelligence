from sqlalchemy import Column, Integer, String, Float, Date, Text, TIMESTAMP, JSON
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.sql import func
from database import Base

JSON_COMPAT = JSON().with_variant(JSONB, "postgresql")
ARRAY_TEXT_COMPAT = JSON().with_variant(ARRAY(Text), "postgresql")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Info
    name = Column(String(100))
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(10), nullable=True)        # Male / Female / Other
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    state = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True)

    # Lifestyle
    diet_type = Column(String(20), nullable=True)   # vegetarian / vegan / eggetarian / non_veg
    exercise_habit = Column(String(15), nullable=True)  # yes / no / sometimes
    alcohol = Column(String(15), nullable=True)
    smoking = Column(String(15), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    water_cups = Column(Integer, nullable=True)

    # Health
    conditions = Column(ARRAY_TEXT_COMPAT, nullable=True)
    allergies = Column(JSON_COMPAT, nullable=True)        # [{name, severity}]
    medications = Column(ARRAY_TEXT_COMPAT, nullable=True)
    surgeries = Column(JSON_COMPAT, nullable=True)        # [{type, year, hospital, recovery_status}]

    # Mental Wellbeing
    mood = Column(Integer, nullable=True)           # 1-10
    stress = Column(Integer, nullable=True)
    energy = Column(Integer, nullable=True)
    work_pressure = Column(Integer, nullable=True)
    relaxation = Column(String(15), nullable=True)  # daily / weekly / occasionally / never

    # Goal
    health_goal = Column(String(30), nullable=True) # lose_weight / gain_weight / maintain / manage_condition

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    food_id = Column(String(50))
    food_name = Column(String(100))
    meal_type = Column(String(15))      # breakfast / lunch / dinner / snacks / other
    quantity_type = Column(String(15))  # count / bowl / cup / glass / handful / slice / spoon / piece / plate
    quantity_value = Column(String(30)) # "2" for count, "medium" for bowl, "1_tbsp" for spoon
    calories = Column(Float)
    protein_g = Column(Float)
    carbs_g = Column(Float)
    fat_g = Column(Float)
    logged_at = Column(TIMESTAMP, server_default=func.now())


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    workout_id = Column(String(50))
    workout_name = Column(String(100))
    input_type = Column(String(15))     # duration / reps
    input_value = Column(Float)         # minutes or rep count
    calories_burned = Column(Float)
    logged_at = Column(TIMESTAMP, server_default=func.now())


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    dos = Column(JSON_COMPAT, nullable=True)
    donts = Column(JSON_COMPAT, nullable=True)
    cautions = Column(JSON_COMPAT, nullable=True)
    collisions = Column(JSON_COMPAT, nullable=True)
    ai_report = Column(Text, nullable=True)
    tips = Column(ARRAY_TEXT_COMPAT, nullable=True)
    assessed_at = Column(TIMESTAMP, server_default=func.now())
