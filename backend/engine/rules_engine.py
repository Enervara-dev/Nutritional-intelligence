import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
FOODS_PATH = os.path.join(DATA_DIR, "foods.json")

# In-memory clinical condition guidelines (100% dynamic, eliminates external diseases.json)
CLINICAL_CONDITIONS = {
    "Type 2 Diabetes": {
        "recommended_tags": ["low_gi", "high_fibre", "whole_grain"],
        "restricted_tags": ["high_sugar", "high_gi", "refined_carbs"],
        "dos_foods": ["oats", "brown_rice", "dal", "spinach", "apple"],
        "donts_foods": ["sugar", "cake", "white_rice", "bread_white"],
        "reason": "Blood sugar regulation requires low glycemic index foods and minimal refined sugars."
    },
    "Hypertension": {
        "recommended_tags": ["high_potassium", "magnesium_rich", "low_fat"],
        "restricted_tags": ["high_sodium", "processed"],
        "dos_foods": ["banana", "spinach", "orange", "oats", "dal"],
        "donts_foods": ["maggi", "poori", "cake"],
        "reason": "Blood pressure control benefits from potassium and magnesium while strictly minimizing sodium."
    },
    "High Cholesterol": {
        "recommended_tags": ["high_fibre", "low_fat", "antioxidant"],
        "restricted_tags": ["saturated_fat", "high_cholesterol", "high_fat"],
        "dos_foods": ["oats", "apple", "dal", "brown_rice", "spinach"],
        "donts_foods": ["ghee", "egg", "poori", "cake"],
        "reason": "LDL reduction requires limiting saturated fats and dietary cholesterol while boosting soluble fibre."
    },
    "GERD": {
        "recommended_tags": ["low_fat", "cooling", "probiotic"],
        "restricted_tags": ["acidic", "spicy", "caffeine", "high_fat"],
        "dos_foods": ["oats", "curd", "banana", "apple", "buttermilk"],
        "donts_foods": ["coffee", "tea", "orange", "orange_juice", "sambar", "rasam", "biryani", "poori", "dark_chocolate"],
        "reason": "Acid reflux management requires avoiding acidic, spicy, and lower-esophageal sphincter-relaxing foods."
    },
    "Celiac Disease": {
        "recommended_tags": ["gluten_free"],
        "restricted_tags": ["gluten"],
        "dos_foods": ["brown_rice", "white_rice", "idli", "dosa", "dal", "spinach", "banana", "apple"],
        "donts_foods": ["roti", "poori", "bread_white", "bread_brown", "cake", "maggi"],
        "reason": "Autoimmune intolerance requires strict and complete elimination of all gluten-containing grains."
    },
    "Lactose Intolerance": {
        "recommended_tags": [],
        "restricted_tags": ["dairy"],
        "dos_foods": ["oats", "dal", "spinach", "banana", "apple", "almonds"],
        "donts_foods": ["milk", "curd", "tea", "coffee", "buttermilk", "ghee"],
        "reason": "Lactase enzyme deficiency impairs digestion of dairy sugars and causes gastrointestinal distress."
    },
    "Gout": {
        "recommended_tags": ["hydrating", "vitamin_c", "antioxidant"],
        "restricted_tags": ["high_purine", "animal_product"],
        "dos_foods": ["water", "orange", "apple", "spinach", "curd", "brown_rice"],
        "donts_foods": ["chicken", "cake"],
        "reason": "Elevated uric acid levels crystallize in joints; purine-rich meats and alcohol must be strictly limited."
    },
    "Hypothyroidism": {
        "recommended_tags": ["magnesium_rich", "antioxidant", "high_protein"],
        "restricted_tags": ["goitrogens"],
        "dos_foods": ["almonds", "oats", "apple", "dal"],
        "donts_foods": [],
        "reason": "Thyroid hormone synthesis requires zinc, selenium, and tyrosine while avoiding excess raw goitrogens."
    },
    "Chronic Kidney Disease (CKD)": {
        "recommended_tags": ["low_potassium", "low_sodium", "hydrating"],
        "restricted_tags": ["high_potassium", "high_sodium", "high_protein"],
        "dos_foods": ["white_rice", "apple", "water"],
        "donts_foods": ["banana", "orange", "orange_juice", "spinach", "almonds", "cashews", "peanuts", "dal", "maggi"],
        "reason": "Impaired renal filtration cannot clear potassium, sodium, or excess protein nitrogen waste products."
    },
    "PCOS": {
        "recommended_tags": ["low_gi", "high_fibre", "anti_inflammatory"],
        "restricted_tags": ["high_sugar", "refined_carbs"],
        "dos_foods": ["oats", "brown_rice", "spinach", "dal", "apple", "almonds"],
        "donts_foods": ["sugar", "cake", "bread_white", "maggi"],
        "reason": "Insulin resistance drives androgen synthesis; stabilizing glucose via low-GI foods improves ovarian function."
    },
    "Fever": {
        "recommended_tags": ["hydrating", "cooling", "probiotic", "low_fat"],
        "restricted_tags": ["spicy", "fried", "high_fat"],
        "dos_foods": ["idli", "white_rice", "curd", "buttermilk", "apple", "banana", "dal"],
        "donts_foods": ["biryani", "poori", "cake", "maggi", "coffee"],
        "reason": "Elevated metabolic rate during fever requires light, hydrating, and easily digestible foods to prevent GI strain."
    },
    "Malaria": {
        "recommended_tags": ["hydrating", "antioxidant", "high_protein", "low_fat"],
        "restricted_tags": ["spicy", "fried", "caffeine", "high_fat"],
        "dos_foods": ["white_rice", "dal", "banana", "apple", "orange", "curd"],
        "donts_foods": ["biryani", "poori", "cake", "coffee", "tea"],
        "reason": "Parasitic infection causes acute hepatic and metabolic stress; bland foods, high fluids, and antioxidants support recovery."
    },
    "Bronchitis": {
        "recommended_tags": ["anti_inflammatory", "antioxidant"],
        "restricted_tags": ["cold", "acidic", "fried"],
        "dos_foods": ["dal", "spinach", "apple", "oats", "banana"],
        "donts_foods": ["poori", "cake", "biryani"],
        "reason": "Bronchial mucosal inflammation requires warm, antioxidant-rich foods while strictly avoiding oily fried irritants."
    },
    "Upper Respiratory Tract Infection (URTI)": {
        "recommended_tags": ["anti_inflammatory", "vitamin_c", "hydrating"],
        "restricted_tags": ["cold", "fried", "spicy"],
        "dos_foods": ["dal", "orange", "banana", "spinach", "apple", "curd"],
        "donts_foods": ["poori", "biryani", "cake", "maggi"],
        "reason": "Sore throat and viral airway infection require warm fluids, vitamin C, and soothing non-irritating nutrition."
    },
    "Gastroenteritis": {
        "recommended_tags": ["probiotic", "low_fat", "hydrating"],
        "restricted_tags": ["spicy", "acidic", "high_fat", "fried"],
        "dos_foods": ["white_rice", "curd", "banana", "apple"],
        "donts_foods": ["sambar", "rasam", "biryani", "poori", "coffee", "cake"],
        "reason": "Gastric and intestinal mucosa inflammation demands bland oral rehydration while eliminating spicy and fatty irritants."
    }
}


def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_dietary_rules(user_profile: dict) -> dict:
    foods = load_json(FOODS_PATH)

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

        # Match condition to clinical knowledge
        def match_disease(c_raw):
            c_low = str(c_raw).strip().lower().replace("_", " ").replace("-", " ")
            for k, v in CLINICAL_CONDITIONS.items():
                k_low = k.lower().replace("-", " ")
                if c_low == k_low or c_low in k_low or k_low in c_low:
                    return k, v
            if any(term in c_low for term in ["diabet", "sugar"]):
                return "Type 2 Diabetes", CLINICAL_CONDITIONS.get("Type 2 Diabetes")
            if any(term in c_low for term in ["hyperten", "bp", "pressure"]):
                return "Hypertension", CLINICAL_CONDITIONS.get("Hypertension")
            if any(term in c_low for term in ["choles", "lipid"]):
                return "High Cholesterol", CLINICAL_CONDITIONS.get("High Cholesterol")
            if any(term in c_low for term in ["gerd", "reflux", "acidity", "heartburn"]):
                return "GERD", CLINICAL_CONDITIONS.get("GERD")
            if any(term in c_low for term in ["fever", "pyrexia"]):
                return "Fever", CLINICAL_CONDITIONS.get("Fever")
            if any(term in c_low for term in ["malaria"]):
                return "Malaria", CLINICAL_CONDITIONS.get("Malaria")
            if any(term in c_low for term in ["bronch"]):
                return "Bronchitis", CLINICAL_CONDITIONS.get("Bronchitis")
            if any(term in c_low for term in ["urti", "respiratory", "sore throat"]):
                return "Upper Respiratory Tract Infection (URTI)", CLINICAL_CONDITIONS.get("Upper Respiratory Tract Infection (URTI)")
            if any(term in c_low for term in ["gastro", "diarrhea", "vomiting", "stomach infection", "watery stool"]):
                return "Gastroenteritis", CLINICAL_CONDITIONS.get("Gastroenteritis")
            return c_raw, None

        # ── 3. MEDICAL CONDITIONS (Clinical Guidelines) ───────
        matched_disease_names = set()
        for cond in conditions:
            d_name, rules = match_disease(cond)
            if not rules:
                continue
            matched_disease_names.add(d_name)

            # Hard conditions restrictions
            if fid in rules.get("donts_foods", []):
                rest_factors.append({
                    "factor": d_name,
                    "type": "disease",
                    "priority": 2,
                    "reason": rules.get("reason", f"Restricted for {d_name}.")
                })
            else:
                for t in rules.get("restricted_tags", []):
                    if t in tags:
                        rest_factors.append({
                            "factor": d_name,
                            "type": "disease",
                            "priority": 2,
                            "reason": f"Contains '{t}' which triggers symptoms in {d_name}."
                        })
                        break

            # Recommendations
            if fid in rules.get("dos_foods", []):
                rec_factors.append({
                    "factor": d_name,
                    "type": "disease",
                    "priority": 2,
                    "reason": f"Recommended for clinical support in {d_name}."
                })
            else:
                for t in rules.get("recommended_tags", []):
                    if t in tags:
                        rec_factors.append({
                            "factor": d_name,
                            "type": "disease",
                            "priority": 2,
                            "reason": f"Contains beneficial '{t}' for {d_name} recovery."
                        })
                        break

        # ── 3B. MEDICATION CONTRAINDICATIONS & INTERACTIONS ───
        meds = [str(m).lower() for m in (user_profile.get("medications") or [])]
        for m in meds:
            if any(ppi in m for ppi in ["panto", "omepra", "rabepra", "esomepra"]):
                if fid in ["coffee", "tea", "sambar", "poori", "dark_chocolate"] or "acidic" in tags or "spicy" in tags:
                    rest_factors.append({
                        "factor": f"Medication Interaction ({m.title()})",
                        "type": "medication",
                        "priority": 1,
                        "reason": f"Acid-stimulating food counteracts PPI therapy ({m.title()}) and delays gastric mucosal healing."
                    })
            if any(abx in m for abx in ["cefixime", "azithro", "amox", "cipro"]):
                if fid in ["curd", "buttermilk"] or "probiotic" in tags:
                    rec_factors.append({
                        "factor": f"Microbiome Support ({m.title()})",
                        "type": "medication",
                        "priority": 2,
                        "reason": "Replenishes beneficial gut flora disrupted by antibiotic therapy."
                    })
            if "artemether" in m or "lumefantrine" in m:
                if fid in ["milk", "curd", "dal"] or "high_protein" in tags:
                    rec_factors.append({
                        "factor": f"Absorption Enhancer ({m.title()})",
                        "type": "medication",
                        "priority": 3,
                        "reason": "Lipids and protein in this food enhance bioavailability of antimalarial medications."
                    })

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
    if "Type 2 Diabetes" in matched_disease_names:
        tips.append("Pair complex carbohydrates like dal or oats with dietary fiber to blunt postprandial glucose excursions.")
    if "Hypertension" in matched_disease_names:
        tips.append("Avoid sodium hidden in processed snacks like instant noodles; aim for natural potassium from permitted whole foods.")
    if "GERD" in matched_disease_names:
        tips.append("Eat dinner at least 2-3 hours before lying down, avoid spicy or acidic foods, and sleep with your head slightly elevated.")
    if "Fever" in matched_disease_names:
        tips.append("Prioritize light, hydrating foods like steamed idlis, moong dal khichdi, and tender coconut water to support elevated metabolic demands.")
    if "Malaria" in matched_disease_names:
        tips.append("Take complete bed rest, avoid heavy or oily foods, and consume easy-to-digest nutrition like boiled rice with dal and oral electrolytes.")
    if "Bronchitis" in matched_disease_names or "Upper Respiratory Tract Infection (URTI)" in matched_disease_names:
        tips.append("Drink warm fluids regularly (herbal broth or warm water), use steam inhalation, and strictly avoid cold drinks and deep-fried irritants.")
    if "Gastroenteritis" in matched_disease_names:
        tips.append("Follow a gentle gut-rest diet (BRAT: bananas, soft rice, curd), take oral rehydration fluids, and eliminate spicy/oily food.")
    if "Chronic Kidney Disease (CKD)" in matched_disease_names:
        tips.append("Strictly monitor potassium; rinse and soak vegetables and choose white rice over whole grains to limit phosphorus.")
    if "Celiac Disease" in matched_disease_names:
        tips.append("Always inspect food packaging for certified gluten-free seals to avoid cross-contamination in milled grains.")
    if any("panto" in m or "omepra" in m for m in meds):
        tips.append("Take your PPI (Pantoprazole/Omeprazole) 30 minutes before your first meal for optimal acid-suppression efficacy.")
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
