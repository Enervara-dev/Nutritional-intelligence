"""
Nutrition calculator.
Given a food dict (from foods.json) + quantity_type + quantity_value,
returns {calories, protein_g, carbs_g, fat_g}.
"""

SIZE_GRAMS = {"small": 0, "medium": 1, "large": 2}
SPOON_ML = {"1_tsp": 5, "1_tbsp": 15}
GLASS_ML = 250


def calculate_nutrition(food: dict, quantity_type: str, quantity_value: str) -> dict:
    qt = quantity_type.lower()
    qv = quantity_value.lower()

    if qt in ("count", "piece", "slice"):
        qty = float(qv)
        nu = food["per_unit"]
        return _scale(nu, qty)

    elif qt in ("bowl", "cup", "plate", "handful"):
        sizes = food.get("size_grams", {"small": 100, "medium": 150, "large": 220})
        if isinstance(sizes, dict) and isinstance(list(sizes.values())[0], list):
            grams = sizes[qv]
        else:
            size_list = [sizes["small"], sizes["medium"], sizes["large"]]
            idx = SIZE_GRAMS.get(qv, 1)
            grams = size_list[idx]
        p100 = food["per_100g"]
        factor = grams / 100
        return {k: round(v * factor, 2) for k, v in p100.items()}

    elif qt == "glass":
        # 1 glass = 250 ml, food stores per_100ml
        p100 = food.get("per_100ml", food.get("per_100g", {}))
        factor = GLASS_ML / 100
        return {k: round(v * factor, 2) for k, v in p100.items()}

    elif qt == "spoon":
        ml = SPOON_ML.get(qv, 5)
        # spoon foods store per_100ml (oils/liquids) or per_100g (solids)
        p100 = food.get("per_100ml", food.get("per_100g", {}))
        factor = ml / 100
        return {k: round(v * factor, 2) for k, v in p100.items()}

    else:
        return {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0}


def _scale(nu: dict, factor: float) -> dict:
    return {k: round(v * factor, 2) for k, v in nu.items()}
