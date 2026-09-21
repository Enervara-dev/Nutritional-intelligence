# ENERVARA — Nutrition & Workout Intelligence Suite

ENERVARA is a full-stack health, nutrition, and metabolic intelligence application designed to deliver real-time personalized nutrition insights, exercise tracking, and physiological baseline calibration.

---

## 🚀 Key Features

### 1. 📌 All-in-One Unified Dashboard
- Everything accessible on **one single, responsive dashboard** without fragmented navigation.
- **Top Metabolic & Energy Banner**:
  - 🍏 **Calories Consumed**: Real-time aggregated intake across all meals.
  - 🔥 **Calories Burned**: Calibrated burn from completed workouts.
  - ⚡ **Net Energy Balance**: Live calculation (`Consumed - Burned`).
  - 📊 **Macro Progress**: Real-time tracking of Protein, Carbs, and Fat.
- Flexible view mode switcher:
  - `📌 All in One` (Default: complete view of everything)
  - `🥗 Food Logger` (Focused meal logging)
  - `🏃 Workout Logger` (Focused workout tracking)
  - `👤 Profile` (Focused baseline settings)

### 2. 🥗 Food & Nutrition Logger
- **Meal Slots**: Breakfast, Lunch, Dinner, Snacks, and Other with live item counts.
- **Categorized Food Catalog**: South Indian, Staples, Protein, Dairy, Fruits, Vegetables, Nuts, and more.
- **Instant Search & Quantity Modals**:
  - Steppers for discrete counts/pieces (e.g. eggs, bananas).
  - Portion size selectors for bowls/plates (Small, Medium, Large with exact gram weights).
  - Standard liquid measures (glasses) and spoon sizes (tsp / tbsp).
- **Macro Breakdown**: Visual progress bars and itemized meal log with 1-click item removal (`✕`).

### 3. 🏃 Workout & Exercise Tracker
- **Activity Library**: Cardio (running, walking, cycling, swimming), Strength (weights, push-ups, squats, sit-ups), and Sports (badminton, yoga).
- **Accurate MET Caloric Burn**: Calculated using Metabolic Equivalent of Task (MET) calibrated to the user's specific body weight.
- **Smart Modals**:
  - Duration slider with quick presets (`15m`, `30m`, `45m`, `60m`).
  - Repetition steppers for bodyweight exercises.
  - Real-time estimated calorie burn preview.
- **Daily Completed Workouts**: Itemized activity history with 1-click deletion (`✕`).

### 4. 👤 Comprehensive Profile Calibration
- All 5 sections in one continuous view with **zero input focus loss**:
  1. **Basic Info**: Name, Date of Birth (with live Age), Sex, Height, Weight (with live BMI & category badge), State, City.
  2. **Lifestyle Habits**: Diet type (Veg, Vegan, Eggetarian, Non-Veg), Exercise, Alcohol, Smoking, Sleep hours slider, Water intake slider.
  3. **Health & Medical**: Searchable medical conditions, food allergies with severity levels, medications with tag input on Enter, past surgeries with recovery status.
  4. **Mental Wellbeing**: Mood, Stress, Energy, Work pressure sliders (1–10) with emoji indicators, relaxation practices.
  5. **Primary Health Goal**: Interactive cards for Lose Weight, Gain Weight, Maintain Weight, or Manage Condition.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 5, Axios, React Router 7, Vanilla CSS Design System |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Pydantic, Uvicorn |
| **Database** | PostgreSQL 16 (Docker) with auto-fallback to local SQLite |
| **Calculations** | Custom MET Burn Engine & Nutrition Aggregator |

---

## 📋 Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher & npm
- **Docker Desktop** (for PostgreSQL)

---

## ⚡ Quick Start (Docker Compose — Recommended)

Run the **entire full-stack platform** (Database + FastAPI Backend + React Frontend) with a single command:

```bash
docker compose up -d --build
```

That's it! All three services will build, connect, and start automatically:
- 🌐 **Frontend (React UI)**: [http://localhost:5173/](http://localhost:5173/)
- ⚙️ **Backend API (FastAPI)**: [http://localhost:8000/](http://localhost:8000/)
- 📖 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🗄️ **Database**: PostgreSQL 16 on `localhost:5432` (`enervara_db`)

To stop all containers:
```bash
docker compose down
```

---

## 💻 Alternative: Running Locally (Development Mode)

If you prefer running services outside Docker for live development:

### 1. Start Only Database
```powershell
docker compose up -d db
```

### 2. Start FastAPI Backend
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Start React Frontend
```powershell
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated End-to-End Testing

An automated verification test is provided in the backend to validate profile creation, food logging, and MET workout calculation:

```powershell
cd enervara/backend
.\venv\Scripts\python.exe test_e2e.py
```

Expected output:
```
--- 1. Health Check ---
Root API: 200 {'message': 'ENERVARA API is running'}

--- 2. Create User Profile ---
Profile creation response: 200
Created User ID: 1, Age: 31, BMI: 23.5

--- 3. Log Food Items ---
Logged Oats (Cooked): 106.5 kcal, 3.75g protein
Logged Dal (Cooked): 174.0 kcal, 13.5g protein
Today's Food Summary: 280.5 kcal, 17.25g protein, 48g carbs, 2.7g fat

--- 4. Log Workouts ---
Logged Running: 270.0 kcal burned
Logged Push-ups: 25.0 kcal burned
Today's Workout Summary: 295.0 kcal burned

[SUCCESS] End-to-end test completed successfully!
```

---

## 📁 Project Structure

```
enervara/
├── backend/
│   ├── data/
│   │   ├── foods.json            # Nutrition data catalog (100g, per unit, portion sizes)
│   │   └── workouts.json         # Exercise database with MET values and calorie formulas
│   ├── engine/
│   │   ├── burn_calc.py          # MET exercise burn calculations calibrated to user weight
│   │   └── nutrition_calc.py     # Portions and macro calculations (protein, carbs, fat)
│   ├── routers/
│   │   ├── users.py              # User profile endpoints (Age & BMI auto-compute)
│   │   ├── food.py               # Food search, logging, slot grouping, daily totals
│   │   └── workout.py            # Workout catalog, logging, and today's burn total
│   ├── database.py               # Multi-dialect SQLAlchemy engine (Postgres + SQLite fallback)
│   ├── models.py                 # User, FoodLog, WorkoutLog, Assessment models
│   ├── schemas.py                # Pydantic validation schemas
│   ├── main.py                   # FastAPI app entry point with CORS
│   ├── test_e2e.py               # Automated end-to-end test script
│   └── requirements.txt          # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.js            # Axios client with centralized API methods
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # All-in-One Dashboard (Energy summary, Food, Workout, Profile)
    │   │   ├── FoodLogger.jsx    # Standalone Food Logger component
    │   │   ├── WorkoutLogger.jsx # Standalone Workout Logger component
    │   │   └── ProfileSetup.jsx  # Standalone Profile Setup component
    │   ├── App.jsx               # Navigation bar, routing, and view synchronization
    │   ├── App.css               # Core styling, responsive grid, and UI design tokens
    │   └── main.jsx              # React DOM entry point
    ├── vite.config.js            # Vite configuration (port 5173, host enabled)
    └── package.json              # Frontend scripts and dependencies
```

---

## 🔒 Environment Variables

Configured in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/enervara_db
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📜 License
Internal project for ENERVARA Nutrition Intelligence. All rights reserved.
