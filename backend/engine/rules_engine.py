import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
FOODS_PATH = os.path.join(DATA_DIR, "foods.json")
DISEASES_PATH = os.path.join(DATA_DIR, "diseases.json")


def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_dietary_rules(user_profile: dict) -> dict:
    foods = load_json(FOODS_PATH)
    diseases = load_json(DISEASES_PATH)

    conditions = [c.strip() for c in (user_profile.get("conditions") or [])]
    allergies = user_profile.get("allergies") or []
    # Normalize allergy names (e.g. "Nuts", "Dairy (Lactose)", "Gluten", "Peanuts")
    allergy_names = set()
    for a in allergies:
        if isinstance(a, dict):
            name = a.get("name", "").lower()
        else:
            name = str(a).lower()
        allergy_names.add(name)

    diet_type = (user_profile.get("diet_type") or "non_veg").lower()
    health_goal = (user_profile.get("health_goal") or "maintain").lower()
    sleep_hours = float(user_profile.get("sleep_hours") or 7.5)
    water_cups = int(user_profile.get("water_cups") or 8)
    bmi = float(user_profile.get("bmi") or 22.0)
    age = int(user_profile.get("age") or 30)
    sex = (user_profile.get("sex") or "Male").capitalize()
    stress = int(user_profile.get("stress") or 5)
    energy = int(user_profile.get("energy") or 6)
    mood = int(user_profile.get("mood") or 6)

    # Output buckets
    dos_map = {}
    donts_map = {}
    cautions_list = []
    collisions_list = []

    for food in foods:
        fid = food["id"]
        fname = food["name"]
        tags = set(food.get("tags", []))
        food_diet_types = food.get("diet_types", [])

        rec_factors = []
        rest_factors = []

        # ── 1. DIET TYPE GATE (Hard Filter) ─────────────────
        if diet_type not in food_diet_types:
            rest_factors.append({
                "factor": f"Diet Preference ({diet_type.capitalize()})",
                "type": "diet_type",
                "priority": 10,
                "reason": f"Not compatible with {diet_type} diet."
            })

        # ── 2. ALLERGY FILTER (Highest Medical Priority) ─────
        for al in allergy_names:
            if "nut" in al and "nuts" in tags:
                rest_factors.append({"factor": "Nut Allergy", "type": "allergy", "priority": 1, "reason": "Contains tree nuts/peanuts which trigger allergic reactions."})
            elif "peanut" in al and ("nuts" in tags or fid == "peanuts"):
                rest_factors.append({"factor": "Peanut Allergy", "type": "allergy", "priority": 1, "reason": "Contains peanuts which trigger anaphylactic/allergic risks."})
            elif "dairy" in al and "dairy" in tags:
                rest_factors.append({"factor": "Dairy Allergy / Intolerance", "type": "allergy", "priority": 1, "reason": "Contains dairy milk proteins or lactose."})
            elif "gluten" in al and "gluten" in tags:
                rest_factors.append({"factor": "Gluten Sensitivity / Allergy", "type": "allergy", "priority": 1, "reason": "Contains gluten grains."})
            elif "egg" in al and (fid == "egg" or "animal_product" in tags):
                rest_factors.append({"factor": "Egg Allergy", "type": "allergy", "priority": 1, "reason": "Contains egg albumen or yolk."})

        # ── 3. MEDICAL CONDITIONS (Clinical Guidelines) ───────
        for cond in conditions:
            rules = diseases.get(cond)
            if not rules:
                continue

            # Hard conditions restrictions
            if fid in rules.get("donts_foods", []):
                rest_factors.append({
                    "factor": cond,
                    "type": "disease",
                    "priority": 2,
                    "reason": rules.get("reason", f"Restricted for {cond}.")
                })
            else:
                for t in rules.get("restricted_tags", []):
                    if t in tags:
                        rest_factors.append({
                            "factor": cond,
                            "type": "disease",
                            "priority": 2,
                            "reason": f"Contains '{t}' which is restricted in {cond}."
                        })
                        break

            # Recommendations
            if fid in rules.get("dos_foods", []):
                rec_factors.append({
                    "factor": cond,
                    "type": "disease",
                    "priority": 2,
                    "reason": f"Recommended for {cond} support."
                })
            else:
                for t in rules.get("recommended_tags", []):
                    if t in tags:
                        rec_factors.append({
                            "factor": cond,
                            "type": "disease",
                            "priority": 2,
                            "reason": f"Contains beneficial '{t}' for {cond}."
                        })
                        break

        # ── 4. LIFESTYLE & MENTAL WELLBEING FACTORS ──────────
        # Sleep
        if sleep_hours < 6:
            if "caffeine" in tags:
                rest_factors.append({"factor": "Sleep Deficit (<6h)", "type": "lifestyle", "priority": 4, "reason": "Caffeine exacerbates sleep fragmentation and elevates evening cortisol."})
            if "magnesium_rich" in tags:
                rec_factors.append({"factor": "Sleep Optimization", "type": "lifestyle", "priority": 4, "reason": "Magnesium promotes GABA activation and deeper restorative sleep."})

        # Stress & Mood
        if stress >= 7:
            if "high_sugar" in tags or "fried" in tags:
                rest_factors.append({"factor": "High Stress (7/10+)", "type": "mental", "priority": 5, "reason": "High-sugar foods drive glycemic volatility that worsens acute stress response."})
            if "serotonin_support" in tags or "antioxidant" in tags:
                rec_factors.append({"factor": "Stress Resilience", "type": "mental", "priority": 5, "reason": "Provides tryptophan and antioxidants supporting neuroendocrine recovery."})

        # Energy
        if energy <= 4:
            if "iron_rich" in tags or "whole_grain" in tags:
                rec_factors.append({"factor": "Energy Boost", "type": "mental", "priority": 5, "reason": "Complex carbs and iron enhance cellular oxygenation and steady ATP generation."})
            if "refined_carbs" in tags:
                rest_factors.append({"factor": "Low Energy", "type": "mental", "priority": 5, "reason": "Refined carbs cause rapid insulin spikes followed by reactive fatigue crashes."})

        # ── 5. DEMOGRAPHICS (Age & Sex) ───────────────────────
        if age >= 55 and ("calcium_rich" in tags or "high_fibre" in tags):
            rec_factors.append({"factor": "Age (55+ Bone & Digestive Health)", "type": "demographic", "priority": 6, "reason": "Preserves bone mineral density and sustains gut motility."})
        if sex == "Female" and "iron_rich" in tags:
            rec_factors.append({"factor": "Female Iron Needs", "type": "demographic", "priority": 6, "reason": "Assists monthly hemoglobin synthesis and prevents subclinical anemia."})

        # ── 6. HEALTH GOAL & BMI ──────────────────────────────
        if health_goal == "lose_weight" or bmi >= 25.0:
            if "high_calorie" in tags or "high_fat" in tags or "saturated_fat" in tags:
                rest_factors.append({"factor": "Weight Control", "type": "goal", "priority": 3, "reason": "High caloric density impairs negative energy balance."})
            if "low_calorie" in tags or "high_fibre" in tags:
                rec_factors.append({"factor": "Weight Control", "type": "goal", "priority": 3, "reason": "High satiety per calorie helps maintain controlled caloric intake."})
        elif health_goal == "gain_weight" or bmi < 18.5:
            if "high_calorie" in tags and "high_protein" in tags:
                rec_factors.append({"factor": "Weight Gain", "type": "goal", "priority": 3, "reason": "Nutrient-dense calories provide building blocks for lean mass accrual."})

        # ── 7. COLLISION DETECTION & RESOLUTION ───────────────
        if rec_factors and rest_factors:
            # Sort rest_factors by clinical priority (lower number = higher priority)
            rest_factors.sort(key=lambda x: x.get("priority", 99))
            rec_factors.sort(key=lambda x: x.get("priority", 99))

            top_rest = rest_factors[0]
            top_rec = rec_factors[0]

            # Critical override check: Allergy or CKD potassium or Celiac gluten always blocks
            if top_rest.get("type") in ["allergy", "diet_type"] or "CKD" in top_rest.get("factor", "") or "Celiac" in top_rest.get("factor", ""):
                decision = "Don'ts (Avoid)"
                explanation = f"Recommended by {top_rec['factor']}, but strictly restricted by {top_rest['factor']}. Safety priority overrides recommendation."
                donts_map[fid] = {
                    "food_id": fid,
                    "name": fname,
                    "category": food.get("category"),
                    "reasons": rest_factors
                }
            else:
                # Other conflicts
                decision = "Don'ts (Avoid)"
                explanation = f"Recommended for {top_rec['factor']}, but restricted due to {top_rest['factor']} ({top_rest['reason']})."
                donts_map[fid] = {
                    "food_id": fid,
                    "name": fname,
                    "category": food.get("category"),
                    "reasons": rest_factors
                }

            collisions_list.append({
                "food_id": fid,
                "name": fname,
                "recommended_by": f"{top_rec['factor']} ({top_rec['reason']})",
                "restricted_by": f"{top_rest['factor']} ({top_rest['reason']})",
                "decision": decision,
                "explanation": explanation
            })
        elif rest_factors:
            donts_map[fid] = {
                "food_id": fid,
                "name": fname,
                "category": food.get("category"),
                "reasons": rest_factors
            }
        elif rec_factors:
            # Check for conditional cautions (e.g. brown rice for celiacs must be certified GF)
            if "Celiac Disease" in conditions and fid == "brown_rice":
                cautions_list.append({
                    "food_id": fid,
                    "name": fname,
                    "factor": "Celiac Disease",
                    "note": "Brown rice is naturally gluten-free and low-GI, but must be certified gluten-free to avoid cross-contamination."
                })
            dos_map[fid] = {
                "food_id": fid,
                "name": fname,
                "category": food.get("category"),
                "reasons": rec_factors
            }

    # Generate 3-5 personalized clinical lifestyle tips
    tips = []
    if "Type 2 Diabetes" in conditions:
        tips.append("Pair complex carbohydrates like dal or oats with dietary fiber to blunt postprandial glucose excursions.")
    if "Hypertension" in conditions:
        tips.append("Avoid sodium hidden in processed snacks like instant noodles; aim for natural potassium from permitted whole foods.")
    if "Chronic Kidney Disease (CKD)" in conditions:
        tips.append("Strictly monitor potassium; rinse and soak vegetables and choose white rice over whole grains to limit phosphorus.")
    if "Celiac Disease" in conditions:
        tips.append("Always inspect food packaging for certified gluten-free seals to avoid cross-contamination in milled grains.")
    if sleep_hours < 7:
        tips.append(f"Your sleep duration ({sleep_hours}h) is below optimal recovery levels; curtail caffeine intake 6 hours prior to bedtime.")
    if water_cups < 8:
        tips.append(f"Increase hydration from {water_cups} to 8-10 cups daily to support renal clearance and metabolic equilibrium.")
    if health_goal == "lose_weight":
        tips.append("Prioritize lean protein (minimum 25g per meal) to safeguard muscle mass during caloric deficits.")

    return {
        "dos": list(dos_map.values()),
        "donts": list(donts_map.values()),
        "cautions": cautions_list,
        "collisions": collisions_list,
        "tips": tips[:5]
    }
