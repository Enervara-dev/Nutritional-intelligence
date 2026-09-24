from sqlalchemy import Column, Integer, String, Float, Date, Text, TIMESTAMP, JSON, Numeric, Boolean
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID as PG_UUID
from sqlalchemy.sql import func
from database import Base

JSON_COMPAT = JSON().with_variant(JSONB, "postgresql")
ARRAY_TEXT_COMPAT = JSON().with_variant(ARRAY(Text), "postgresql")
UUID_COMPAT = String(64).with_variant(PG_UUID(as_uuid=False), "postgresql")


class AuthUser(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    role = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    user_id = Column(UUID_COMPAT, nullable=True)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    sex = Column(String(20), nullable=True)
    state = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    height_cm = Column(Numeric(5, 1), nullable=True)
    weight_kg = Column(Numeric(5, 1), nullable=True)
    blood_group = Column(String(10), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class PatientLifestyle(Base):
    __tablename__ = "patient_lifestyle"
    __table_args__ = {'extend_existing': True}

    patient_id = Column(UUID_COMPAT, primary_key=True)
    diet = Column(String(20), nullable=True)
    exercise = Column(String(20), nullable=True)
    alcohol = Column(String(20), nullable=True)
    smoking = Column(String(20), nullable=True)
    sleep_hours = Column(Numeric(3, 1), nullable=True)
    water_cups = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class PatientWellbeing(Base):
    __tablename__ = "patient_wellbeing"
    __table_args__ = {'extend_existing': True}

    patient_id = Column(UUID_COMPAT, primary_key=True)
    overall_mood = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)
    energy_level = Column(Integer, nullable=True)
    social_connectedness = Column(Integer, nullable=True)
    work_academic_pressure = Column(Integer, nullable=True)
    relaxation_practices = Column(String(30), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class PatientCondition(Base):
    __tablename__ = "patient_conditions"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    condition_code = Column(Text, nullable=True)
    since_bucket = Column(String(20), nullable=True)
    since_exact_date = Column(Date, nullable=True)
    currently_troubling = Column(String(20), nullable=True)
    on_medication = Column(Boolean, nullable=True)
    archived_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class PatientAllergy(Base):
    __tablename__ = "patient_allergies"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    allergen_name = Column(Text, nullable=False)
    severity = Column(String(20), nullable=True)
    archived_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class PatientMedication(Base):
    __tablename__ = "patient_medications"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    medication_name = Column(Text, nullable=False)
    course_type = Column(String(20), nullable=True)
    dose_amount = Column(Numeric(10, 3), nullable=True)
    dose_unit = Column(String(10), nullable=True)
    frequency_count = Column(Integer, nullable=True)
    frequency_period = Column(String(20), nullable=True)
    food_relation = Column(String(20), nullable=True)
    reason_or_condition = Column(Text, nullable=True)
    archived_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class PatientSurgery(Base):
    __tablename__ = "patient_surgeries"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    surgery_name = Column(Text, nullable=False)
    performed_year = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    hospital = Column(Text, nullable=True)
    current_status = Column(String(30), nullable=True)
    archived_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class Prescription(Base):
    __tablename__ = "prescriptions"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    document_id = Column(UUID_COMPAT, nullable=True)
    prescribed_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=True)
    prescriber_name = Column(Text, nullable=True)
    prescriber_registration = Column(Text, nullable=True)
    clinic_name = Column(Text, nullable=True)
    patient_name_on_document = Column(Text, nullable=True)
    indication_notes = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    suggested_speciality_slug = Column(Text, nullable=True)
    deleted_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class PrescriptionMedication(Base):
    __tablename__ = "prescription_medications"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID_COMPAT, primary_key=True)
    prescription_id = Column(UUID_COMPAT, nullable=False, index=True)
    patient_id = Column(UUID_COMPAT, nullable=False, index=True)
    name = Column(Text, nullable=False)
    generic_name = Column(Text, nullable=True)
    strength = Column(Text, nullable=True)
    form = Column(String(20), nullable=True)
    route = Column(String(20), nullable=True)
    dosage = Column(Text, nullable=True)
    frequency = Column(Text, nullable=True)
    timing = Column(Text, nullable=True)
    duration_text = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class ConditionCatalog(Base):
    __tablename__ = "condition_catalog"
    __table_args__ = {'extend_existing': True}

    code = Column(Text, primary_key=True)
    display_name = Column(Text, nullable=False)
    category = Column(String(30), nullable=True)


class FoodLog(Base):
    __tablename__ = "food_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), index=True)
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
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), index=True)
    workout_id = Column(String(50))
    workout_name = Column(String(100))
    input_type = Column(String(15))     # duration / reps
    input_value = Column(Float)         # minutes or rep count
    calories_burned = Column(Float)
    logged_at = Column(TIMESTAMP, server_default=func.now())


class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), index=True)
    dos = Column(JSON_COMPAT, nullable=True)
    donts = Column(JSON_COMPAT, nullable=True)
    cautions = Column(JSON_COMPAT, nullable=True)
    collisions = Column(JSON_COMPAT, nullable=True)
    ai_report = Column(Text, nullable=True)
    tips = Column(ARRAY_TEXT_COMPAT, nullable=True)
    assessed_at = Column(TIMESTAMP, server_default=func.now())


class LocalUserProfile(Base):
    __tablename__ = "local_user_profiles"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(10), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    state = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True)
    diet_type = Column(String(20), nullable=True)
    exercise_habit = Column(String(15), nullable=True)
    alcohol = Column(String(15), nullable=True)
    smoking = Column(String(15), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    water_cups = Column(Integer, nullable=True)
    conditions = Column(ARRAY_TEXT_COMPAT, nullable=True)
    allergies = Column(JSON_COMPAT, nullable=True)
    medications = Column(ARRAY_TEXT_COMPAT, nullable=True)
    surgeries = Column(JSON_COMPAT, nullable=True)
    mood = Column(Integer, nullable=True)
    stress = Column(Integer, nullable=True)
    energy = Column(Integer, nullable=True)
    work_pressure = Column(Integer, nullable=True)
    relaxation = Column(String(15), nullable=True)
    health_goal = Column(String(30), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


# Alias for backward compatibility
User = LocalUserProfile
