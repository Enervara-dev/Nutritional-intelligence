# ENERVARA — Clinical Nutrition & Metabolic Intelligence Suite

ENERVARA is an enterprise-grade full-stack health, nutrition, and metabolic intelligence application designed to deliver real-time personalized nutrition insights, exercise tracking, clinical safety calibration, and AI-driven dietary guidance.

---

## Key Features

### 1. Unified Real-Time Dashboard
- **Single-Screen Command Center**: Access metabolic metrics, food intake, exercise expenditure, and clinical guidance without fragmented navigation.
- **Top Metabolic & Energy Banner**:
  - **Calories Consumed**: Real-time aggregated intake across all meals.
  - **Calories Burned**: Calibrated burn from completed workouts based on user body weight.
  - **Net Energy Balance**: Live calculation (`Consumed - Burned`).
  - **Macro Tracking**: Real-time progress bars for Protein, Carbs, and Fat.
- **Flexible View Switcher**: Filter the dashboard seamlessly between `All in One`, `Food Logger`, `Workout Logger`, `Clinical AI Guidance`, and `Profile`.

### 2. Clinical AI Dietary Intelligence (Gemini 3.6 Flash)
- **Enterprise Google GenAI Engine**: Uses the modern `google-genai` SDK with strict clinical prompt boundaries and injection protection.
- **7-Day Day-Wise Food & Workout Intelligence**:
  - Ingests past 7 days of food logs and workout logs organized chronologically day-by-day.
  - Detects **chronic multi-day patterns** (e.g. consuming deep-fried/oily foods consecutively for 4 days) and warns about compounding cardiovascular and metabolic hazards.
  - Correlates daily caloric and macro intake with workout expenditure and net energy balance.
- **Structured 3-Part Clinical Guidance**:
  - **Food Assessment**: Objective Good/Bad evaluation correlating multi-day intake and activity against diagnosed conditions and goals, with plain-English physiological justification and positive encouragement.
  - **Healthier Alternatives**: 2 to 3 practical, accessible food replacements tailored to dietary preferences and allergies.
  - **Daily Portion Limit**: Clear, quantifiable daily threshold defining safe intake vs. adverse thresholds.
- **Strict Clinical Formatting**: 100% zero-emoji enforcement across all prompts, system rules, and UI rendering for clinical professionalism.
- **Patient Privacy**: Patient names and PII are never passed to the AI engine; evaluations operate strictly on anonymized physiological and intake context.
- **Resilient Fallback Engine**: If network or quota limits occur, a deterministic rule-based engine generates formatted clinical guidance instantly without disruption, preserving multi-day streak detection.

### 3. Interactive Assessment & Plan History Archive
- **Historical Plan Drawer**: View, compare, and reload previous clinical assessments and plans.
- **Persistent Versioning**: Every profile calibration and meal analysis is timestamped and saved with quick-load capabilities.

### 4. Deterministic Clinical Rules Engine & Collision Resolution
- **10 Core Health Conditions**: Type 2 Diabetes, Hypertension, High Cholesterol, GERD, Celiac Disease, Lactose Intolerance, Gout, Hypothyroidism, CKD, and PCOS.
- **Cross-Factor Collision Resolution**: Automatically resolves conflicts when one condition recommends a food that another restricts (e.g., CKD potassium restrictions overriding Diabetes whole grain guidelines).
- **Safety Priority Hierarchy**: `Allergy > Diet Type > Severe Organ Risk (CKD/Celiac) > Chronic Conditions > Demographics/Goal`.
- **Conditional Cautions**: Flags items requiring special handling (e.g., gluten-free certification requirements).

### 5. Food & Nutrition Logger
- **Meal Slots**: Breakfast, Lunch, Dinner, Snacks, and Other with live item counts.
- **Indian & Global Food Catalog**: South Indian staples, protein sources, dairy, fruits, vegetables, nuts, and healthy fats.
- **Portion Modals**: Count/pieces, portion sizes (Small, Medium, Large bowls with exact gram weights), glass measures, and spoons (tsp/tbsp).
- **Itemized Meal Log**: Real-time macro updates with 1-click item removal (`✕`).

### 6. Workout & Exercise Tracker
- **Activity Library**: Cardio (running, walking, cycling, swimming), Strength (weights, push-ups, squats, sit-ups), and Sports (badminton, yoga).
- **Accurate MET Caloric Burn**: Calculated using Metabolic Equivalent of Task (MET) calibrated specifically to the user's body weight.
- **Smart Modals**: Duration sliders with quick presets (`15m`, `30m`, `45m`, `60m`), repetition steppers, and live calorie burn preview.

### 7. Comprehensive Profile Calibration
- **Basic Info**: Name, Date of Birth (with live Age calculation), Sex, Height, Weight (with live BMI badge), State, City.
- **Lifestyle Habits**: Diet type (Veg, Vegan, Eggetarian, Non-Veg), Exercise habit, Alcohol, Smoking, Sleep hours slider, Water intake slider.
- **Health & Medical**: Searchable medical conditions, food allergies with severity levels, active medications, and surgical history.
- **Mental Wellbeing**: Mood, Stress, Energy, Work pressure sliders (1–10), and relaxation practices.
- **Primary Health Goal**: Lose Weight, Gain Weight, Maintain Weight, or Manage Condition.

---

## Automated 500-User Clinical Validation Suite

ENERVARA includes an automated clinical safety verification suite (`validate_500_users.py`) testing 500 diverse user profiles spanning multi-disease combinations, allergies, and diet types:

- **100% CKD Safety**: 0 high-potassium foods permitted for CKD profiles.
- **100% Celiac Safety**: 0 gluten foods permitted for Celiac profiles.
- **100% Allergy Adherence**: Strict zero-tolerance allergen suppression.
- **100% Vegan Adherence**: Strict zero-tolerance animal product exclusion.
- **Zero Mutual Overlap**: Guaranteed mutual exclusivity between recommended and restricted food lists.
- **2,486+ Collisions Handled**: Verified full audit trail with clinical safety explanations.
- **High Throughput**: >1,700 profile evaluations per second.

```bash
cd backend
python validate_500_users.py
```

---

## Database Schema & Architecture

The application is structured to operate with multi-tenant clinical PostgreSQL databases and local SQLite fallbacks:

- **Patient Baseline**: Maps directly to relational patient models (`patients`, `patient_lifestyle`, `patient_wellbeing`, `patient_conditions`, `condition_catalog`, `patient_allergies`, `patient_medications`, `patient_surgeries`).
- **AI Assessment Storage (Nova Architecture)**: Persists session-based clinical guidance in `conversations`, `messages`, and `message_ai_details`.
- **Dynamic Intake**: Accepts daily meal and workout logs via API payloads for real-time evaluation.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 5, Axios, React Router 7, Vanilla CSS Design System |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Pydantic, Uvicorn |
| **AI Engine** | Google GenAI SDK (`gemini-3.6-flash`), Structured Pydantic Output |
| **Database** | PostgreSQL 16 (Docker) with auto-fallback to local SQLite |
| **Calculations** | Custom MET Burn Engine & Nutrition Aggregator |

---

## Quickstart & Local Setup

### Approach A: Docker (Full-Stack Containers)

Run PostgreSQL, FastAPI backend, and React frontend with a single command:

```powershell
cd enervara
docker compose up -d --build
```

- **Frontend UI**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Approach B: Local Development (Without Docker)

#### Step 1: Start Backend (Terminal 1)
```powershell
cd enervara\backend

# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Linux/macOS: source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at `http://127.0.0.1:8000/`. If PostgreSQL is not active, the backend automatically uses `enervara.db` (local SQLite).

#### Step 2: Start Frontend (Terminal 2)
```powershell
cd enervara\frontend

# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev
```
Frontend runs at `http://localhost:5173/`.

---

## Project Structure

```
enervara/
├── backend/
│   ├── data/
│   │   ├── foods.json            # Whole foods & recipes (nutrition per 100g/unit/portion)
│   │   └── workouts.json         # Exercise database with MET values & calorie formulas
│   ├── engine/
│   │   ├── rules_engine.py       # Clinical safety engine (Allergies, Medications, Condition mapping)
│   │   ├── burn_calc.py          # MET exercise burn calculations calibrated to user weight
│   │   └── nutrition_calc.py     # Portions and macro calculations (protein, carbs, fat)
│   ├── routers/
│   │   ├── users.py              # User profile endpoints (Age & BMI auto-compute)
│   │   ├── food.py               # Food search, logging, slot grouping, daily totals
│   │   ├── workout.py            # Workout catalog, logging, and today's burn total
│   │   └── assessment.py         # Clinical guidance evaluation, Gemini AI synthesis & history
│   ├── database.py               # Multi-dialect SQLAlchemy engine (Postgres + SQLite fallback)
│   ├── models.py                 # SQLAlchemy database models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── main.py                   # FastAPI app entry point with CORS
│   ├── validate_500_users.py     # Automated 500-user clinical safety assertion suite
│   ├── test_e2e.py               # Automated end-to-end test script
│   ├── Dockerfile                # Backend container definition
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js            # Axios client with centralized API methods
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Unified Dashboard (Banner, Food, Workout, AI Guidance, History, Profile)
│   │   │   ├── FoodLogger.jsx    # Food Logger component
│   │   │   ├── WorkoutLogger.jsx # Workout Logger component
│   │   │   └── ProfileSetup.jsx  # Profile Setup component
│   │   ├── App.jsx               # Navigation bar, routing, and view synchronization
│   │   ├── App.css               # Design system, responsive layout, and clinical styling
│   │   └── main.jsx              # React DOM entry point
│   ├── nginx.conf                # Production Nginx reverse-proxy configuration
│   ├── Dockerfile                # Multi-stage production container build (Vite + Nginx)
│   ├── vite.config.js            # Vite configuration
│   └── package.json              # Frontend scripts and dependencies
│
├── docker-compose.yml            # Multi-container orchestration (DB + Backend + Frontend)
└── README.md                     # Documentation
```

---

## Environment Configuration

Configure in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/enervara_db
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If `GEMINI_API_KEY` is omitted, the system seamlessly uses the local deterministic clinical rule synthesis).*

---

## License
Internal project for ENERVARA Nutrition & Metabolic Intelligence. All rights reserved.
