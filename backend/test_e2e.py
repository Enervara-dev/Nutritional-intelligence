import requests
import json

BASE = 'http://127.0.0.1:8000'

def run():
    print("--- 1. Health Check ---")
    r = requests.get(f"{BASE}/")
    print("Root API:", r.status_code, r.json())

    print("\n--- 2. Create User Profile ---")
    payload = {
        "name": "Alex Smith",
        "dob": "1995-06-15",
        "sex": "Male",
        "height_cm": 175.0,
        "weight_kg": 72.0,
        "state": "California",
        "city": "San Francisco",
        "diet_type": "vegetarian",
        "exercise_habit": "yes",
        "alcohol": "never",
        "smoking": "never",
        "sleep_hours": 7.5,
        "water_cups": 8,
        "conditions": ["none"],
        "allergies": [{"name": "peanut", "severity": "mild"}],
        "medications": [],
        "surgeries": [],
        "mood": 8,
        "stress": 3,
        "energy": 8,
        "work_pressure": 4,
        "relaxation": "daily",
        "health_goal": "maintain"
    }
    r = requests.post(f"{BASE}/users/profile", json=payload)
    print("Profile creation response:", r.status_code)
    user = r.json()
    user_id = user["id"]
    print(f"Created User ID: {user_id}, Age: {user.get('age')}, BMI: {user.get('bmi')}")

    print("\n--- 3. Log Food Items ---")
    # Breakfast
    food1 = {
        "user_id": user_id,
        "food_id": "oats",
        "meal_type": "breakfast",
        "quantity_type": "bowl",
        "quantity_value": "medium"
    }
    r1 = requests.post(f"{BASE}/food/log", json=food1)
    res1 = r1.json()
    print(f"Logged {res1.get('food_name')}: {res1.get('calories')} kcal, {res1.get('protein_g')}g protein")

    # Lunch
    food2 = {
        "user_id": user_id,
        "food_id": "dal",
        "meal_type": "lunch",
        "quantity_type": "bowl",
        "quantity_value": "medium"
    }
    r2 = requests.post(f"{BASE}/food/log", json=food2)
    res2 = r2.json()
    print(f"Logged {res2.get('food_name')}: {res2.get('calories')} kcal, {res2.get('protein_g')}g protein")

    # Fetch today food log
    r_food_today = requests.get(f"{BASE}/food/log/{user_id}/today")
    print("Today's Food Summary:", json.dumps(r_food_today.json().get("daily_totals"), indent=2))

    print("\n--- 4. Log Workouts ---")
    w1 = {
        "user_id": user_id,
        "workout_id": "running",
        "input_type": "duration",
        "input_value": 30.0
    }
    rw1 = requests.post(f"{BASE}/workout/log", json=w1)
    res_w1 = rw1.json()
    print(f"Logged {res_w1.get('workout_name')}: {res_w1.get('calories_burned')} kcal burned")

    w2 = {
        "user_id": user_id,
        "workout_id": "pushups",
        "input_type": "reps",
        "input_value": 50.0
    }
    rw2 = requests.post(f"{BASE}/workout/log", json=w2)
    res_w2 = rw2.json()
    print(f"Logged {res_w2.get('workout_name')}: {res_w2.get('calories_burned')} kcal burned")

    # Fetch today workout log
    r_w_today = requests.get(f"{BASE}/workout/log/{user_id}/today")
    print("Today's Workout Summary:", json.dumps(r_w_today.json(), indent=2))

    print("\n[SUCCESS] End-to-end test completed successfully!")

if __name__ == "__main__":
    run()
