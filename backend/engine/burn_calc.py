"""
Calorie burn calculator.
Duration workouts: MET × weight_kg × (minutes / 60)
Rep workouts:      calories_per_rep × reps
"""


def calculate_burn(workout: dict, input_type: str, input_value: float, weight_kg: float) -> float:
    it = input_type.lower()
    if it == "duration":
        hours = input_value / 60
        met = workout.get("met_value", 3.5)
        return round(met * weight_kg * hours, 2)
    elif it == "reps":
        cpr = workout.get("calories_per_rep", 0.3)
        return round(cpr * input_value, 2)
    return 0.0
