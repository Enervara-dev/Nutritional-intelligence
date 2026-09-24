from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Optional, Any
import uuid

from database import get_db, engine
import models, schemas

router = APIRouter()


def _calc_age(dob: Optional[date]) -> Optional[int]:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _calc_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    if not weight_kg or not height_cm:
        return None
    h = float(height_cm) / 100.0
    return round(float(weight_kg) / (h * h), 1)


def _build_patient_profile_out(patient: models.Patient, db: Session) -> schemas.UserProfileOut:
    pid = patient.id
    pid_str = str(pid)

    # Lifestyle
    ls = db.query(models.PatientLifestyle).filter(models.PatientLifestyle.patient_id == pid).first()
    diet_type = ls.diet if ls and ls.diet else "non_veg"
    exercise_habit = ls.exercise if ls and ls.exercise else "sometimes"
    alcohol = ls.alcohol if ls and ls.alcohol else "no"
    smoking = ls.smoking if ls and ls.smoking else "no"
    sleep_hours = float(ls.sleep_hours) if ls and ls.sleep_hours is not None else 7.5
    water_cups = ls.water_cups if ls and ls.water_cups is not None else 8

    # Wellbeing
    wb = db.query(models.PatientWellbeing).filter(models.PatientWellbeing.patient_id == pid).first()
    mood = wb.overall_mood if wb and wb.overall_mood else 8
    stress = wb.stress_level if wb and wb.stress_level else 4
    energy = wb.energy_level if wb and wb.energy_level else 8
    work_pressure = wb.work_academic_pressure if wb and wb.work_academic_pressure else 5
    relaxation = wb.relaxation_practices if wb and wb.relaxation_practices else "daily"

    # Conditions
    cond_rows = db.query(models.PatientCondition).filter(
        models.PatientCondition.patient_id == pid,
        models.PatientCondition.archived_at.is_(None)
    ).all()
    conditions = [c.condition_code for c in cond_rows if c.condition_code]

    # Prescriptions
    rx_rows = db.query(models.Prescription).filter(
        models.Prescription.patient_id == pid,
        models.Prescription.deleted_at.is_(None)
    ).order_by(models.Prescription.prescribed_date.desc().nullslast()).all()

    prescriptions = []
    rx_meds_list = []
    for rx in rx_rows:
        med_rows = db.query(models.PrescriptionMedication).filter(
            models.PrescriptionMedication.prescription_id == rx.id
        ).all()
        meds = []
        for m in med_rows:
            meds.append({
                "name": m.name,
                "generic_name": m.generic_name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "timing": m.timing,
                "duration_text": m.duration_text,
                "instructions": m.instructions
            })
            if m.name and m.name not in rx_meds_list:
                rx_meds_list.append(m.name)

        prescriptions.append({
            "id": str(rx.id),
            "date": str(rx.prescribed_date) if rx.prescribed_date else None,
            "doctor": rx.prescriber_name,
            "clinic": rx.clinic_name,
            "indication": rx.indication_notes,
            "notes": rx.notes,
            "medications": meds
        })

        notes_combined = f"{rx.indication_notes or ''} {rx.notes or ''}".lower()
        for cand, label in [
            ("bronchit", "Bronchitis"),
            ("gastroenterit", "Gastroenteritis"),
            ("malaria", "Malaria"),
            ("fever", "Fever"),
            ("gerd", "GERD"),
            ("reflux", "GERD"),
            ("urti", "Upper Respiratory Tract Infection (URTI)"),
            ("respiratory tract", "Upper Respiratory Tract Infection (URTI)"),
            ("diabet", "Type 2 Diabetes"),
            ("hyperten", "Hypertension"),
            ("cholesterol", "High Cholesterol")
        ]:
            if cand in notes_combined and label not in conditions:
                conditions.append(label)

    # Direct Medications
    direct_meds = db.query(models.PatientMedication).filter(
        models.PatientMedication.patient_id == pid,
        models.PatientMedication.archived_at.is_(None)
    ).all()
    for dm in direct_meds:
        if dm.medication_name and dm.medication_name not in rx_meds_list:
            rx_meds_list.append(dm.medication_name)

    # Allergies
    allergy_rows = db.query(models.PatientAllergy).filter(
        models.PatientAllergy.patient_id == pid,
        models.PatientAllergy.archived_at.is_(None)
    ).all()
    allergies = [schemas.AllergyItem(name=a.allergen_name, severity=a.severity or "mild") for a in allergy_rows]

    # Surgeries
    surgery_rows = db.query(models.PatientSurgery).filter(
        models.PatientSurgery.patient_id == pid,
        models.PatientSurgery.archived_at.is_(None)
    ).all()
    surgeries = [
        schemas.SurgeryItem(
            type=s.surgery_name,
            year=s.performed_year,
            hospital=s.hospital,
            recovery_status=s.current_status or "fully_recovered"
        )
        for s in surgery_rows
    ]

    h_cm = float(patient.height_cm) if patient.height_cm else None
    w_kg = float(patient.weight_kg) if patient.weight_kg else None
    age = _calc_age(patient.date_of_birth)
    bmi = _calc_bmi(w_kg, h_cm)
    full_name = f"{patient.first_name or ''} {patient.last_name or ''}".strip() or "Unnamed Patient"

    user_email = None
    if patient.user_id:
        try:
            auth_u = db.query(models.AuthUser).filter(models.AuthUser.id == patient.user_id).first()
            if auth_u:
                user_email = auth_u.email
        except Exception:
            db.rollback()

    return schemas.UserProfileOut(
        id=pid_str,
        name=full_name,
        email=user_email,
        dob=patient.date_of_birth,
        age=age,
        sex=(patient.sex or "Other").capitalize(),
        height_cm=h_cm,
        weight_kg=w_kg,
        bmi=bmi,
        state=patient.state or "",
        city=patient.city or "",
        blood_group=patient.blood_group,
        diet_type=diet_type,
        exercise_habit=exercise_habit,
        alcohol=alcohol,
        smoking=smoking,
        sleep_hours=sleep_hours,
        water_cups=water_cups,
        conditions=conditions,
        allergies=allergies,
        medications=rx_meds_list,
        surgeries=surgeries,
        mood=mood,
        stress=stress,
        energy=energy,
        work_pressure=work_pressure,
        relaxation=relaxation,
        health_goal="manage_condition" if conditions else "maintain",
        prescriptions=prescriptions
    )


@router.get("/patients", response_model=List[schemas.PatientSummary])
def get_patients(db: Session = Depends(get_db)):
    """Fetch all clinical patients registered in the database."""
    summaries = []
    try:
        patients = db.query(models.Patient).all()
        for p in patients:
            rx_count = db.query(models.Prescription).filter(
                models.Prescription.patient_id == p.id,
                models.Prescription.deleted_at.is_(None)
            ).count()
            cond_count = db.query(models.PatientCondition).filter(
                models.PatientCondition.patient_id == p.id,
                models.PatientCondition.archived_at.is_(None)
            ).count()
            name = f"{p.first_name or ''} {p.last_name or ''}".strip() or "Unnamed Patient"
            h = float(p.height_cm) if p.height_cm else None
            w = float(p.weight_kg) if p.weight_kg else None

            u_email = None
            if p.user_id:
                try:
                    auth_u = db.query(models.AuthUser).filter(models.AuthUser.id == p.user_id).first()
                    if auth_u:
                        u_email = auth_u.email
                except Exception:
                    db.rollback()

            summaries.append(schemas.PatientSummary(
                id=str(p.id),
                user_id=str(p.user_id) if p.user_id else None,
                name=name,
                email=u_email,
                age=_calc_age(p.date_of_birth),
                sex=(p.sex or "Other").capitalize(),
                city=p.city or "",
                state=p.state or "",
                weight_kg=w,
                height_cm=h,
                bmi=_calc_bmi(w, h),
                prescription_count=rx_count,
                conditions_count=cond_count
            ))
    except Exception as e:
        db.rollback()
        print(f"[ENERVARA] Error querying patients list: {e}")

    # Also include any local profiles if on sqlite
    if engine.dialect.name == "sqlite":
        try:
            locals_ = db.query(models.LocalUserProfile).all()
            for lp in locals_:
                summaries.append(schemas.PatientSummary(
                    id=str(lp.id),
                    name=lp.name or f"User #{lp.id}",
                    age=lp.age or _calc_age(lp.dob),
                    sex=lp.sex,
                    city=lp.city or "",
                    state=lp.state or "",
                    weight_kg=lp.weight_kg,
                    height_cm=lp.height_cm,
                    bmi=lp.bmi,
                    prescription_count=0,
                    conditions_count=len(lp.conditions or [])
                ))
        except Exception as e:
            db.rollback()
            print(f"[ENERVARA] Error querying local profiles: {e}")

    return summaries


SESSION_PROFILES = {}


@router.post("/profile", response_model=schemas.UserProfileOut)
def create_or_update_profile(profile: schemas.UserProfileIn):
    # In-memory session profile update (Zero DB writes)
    age = _calc_age(profile.dob) if profile.dob else None
    bmi = _calc_bmi(profile.weight_kg, profile.height_cm) if (profile.weight_kg and profile.height_cm) else None

    out = schemas.UserProfileOut(
        id="session-user",
        name=profile.name or "Current User",
        dob=profile.dob,
        age=age,
        sex=profile.sex,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        bmi=bmi,
        state=profile.state,
        city=profile.city,
        blood_group=profile.blood_group,
        diet_type=profile.diet_type,
        exercise_habit=profile.exercise_habit,
        alcohol=profile.alcohol,
        smoking=profile.smoking,
        sleep_hours=profile.sleep_hours,
        water_cups=profile.water_cups,
        conditions=profile.conditions or [],
        allergies=profile.allergies or [],
        medications=profile.medications or [],
        surgeries=profile.surgeries or [],
        mood=profile.mood,
        stress=profile.stress,
        energy=profile.energy,
        work_pressure=profile.work_pressure,
        relaxation=profile.relaxation,
        health_goal=profile.health_goal,
        prescriptions=[]
    )
    SESSION_PROFILES["session-user"] = out
    return out


@router.get("/lookup/by-email", response_model=schemas.UserProfileOut)
def get_profile_by_email(email: str, db: Session = Depends(get_db)):
    clean_email = email.strip().lower()
    try:
        auth_u = db.query(models.AuthUser).filter(func.lower(models.AuthUser.email) == clean_email).first()
        if not auth_u:
            raise HTTPException(status_code=404, detail=f"No user found registered with email '{email}'")
        patient = db.query(models.Patient).filter(models.Patient.user_id == auth_u.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail=f"User found, but no clinical patient profile is linked to '{email}'")
        return _build_patient_profile_out(patient, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/profile", response_model=schemas.UserProfileOut)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    clean_id = user_id.strip()
    if clean_id in SESSION_PROFILES:
        return SESSION_PROFILES[clean_id]

    # 1. If email was passed (contains @)
    if "@" in clean_id:
        try:
            auth_u = db.query(models.AuthUser).filter(func.lower(models.AuthUser.email) == clean_id.lower()).first()
            if auth_u:
                patient = db.query(models.Patient).filter(models.Patient.user_id == auth_u.id).first()
                if patient:
                    return _build_patient_profile_out(patient, db)
                raise HTTPException(status_code=404, detail=f"User found, but no clinical patient profile is linked to '{clean_id}'")
            raise HTTPException(status_code=404, detail=f"No patient found registered with email '{clean_id}'")
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    # 2. Try finding in Patient table by ID or User ID (UUID)
    try:
        patient = db.query(models.Patient).filter(models.Patient.id == clean_id).first()
        if not patient and len(clean_id) == 36:
            patient = db.query(models.Patient).filter(models.Patient.user_id == clean_id).first()
        if patient:
            return _build_patient_profile_out(patient, db)
    except Exception as e:
        db.rollback()
        print(f"[ENERVARA] Error querying Patient by ID {clean_id}: {e}")

    # 3. Check if clean_id matches an AuthUser UUID
    if len(clean_id) == 36:
        try:
            auth_u = db.query(models.AuthUser).filter(models.AuthUser.id == clean_id).first()
            if auth_u:
                patient = db.query(models.Patient).filter(models.Patient.user_id == auth_u.id).first()
                if patient:
                    return _build_patient_profile_out(patient, db)
        except Exception as e:
            db.rollback()

    # 4. Try finding in LocalUserProfile if on sqlite
    if engine.dialect.name == "sqlite" and clean_id.isdigit():
        try:
            local_u = db.query(models.LocalUserProfile).filter(models.LocalUserProfile.id == int(clean_id)).first()
            if local_u:
                return local_u
        except Exception:
            db.rollback()

    # 5. If any patient exists at all in the database, return the first one as default
    try:
        first_patient = db.query(models.Patient).first()
        if first_patient:
            return _build_patient_profile_out(first_patient, db)
    except Exception:
        db.rollback()

    raise HTTPException(status_code=404, detail="User or patient not found")
