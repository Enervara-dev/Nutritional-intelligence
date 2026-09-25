# ENERVARA — Complete Technical & Clinical Documentation

**Full-Stack Clinical Nutrition, Metabolic Safety, & Workout Intelligence Suite**

---

## Table of Contents
1. [Executive Summary & Technology Stack](#1-executive-summary--technology-stack)
2. [High-Level Architecture & Request Flow](#2-high-level-architecture--request-flow)
3. [MVP Implementation Blueprint](#3-mvp-implementation-blueprint)
4. [System Architecture & Dual-Database Persistence](#4-system-architecture--dual-database-persistence)
5. [Clinical Rules & Cross-Factor Collision Engine](#5-clinical-rules--cross-factor-collision-engine)
6. [Complete REST API Specification](#6-complete-rest-api-specification)
7. [Gemini AI Dietary Intelligence Engine](#7-gemini-ai-dietary-intelligence-engine)
8. [Nutrition & Caloric Burn Calculators](#8-nutrition--caloric-burn-calculators)
9. [Automated 500-User Clinical Validation Suite](#9-automated-500-user-clinical-validation-suite)
10. [Deployment & DevOps Manual](#10-deployment--devops-manual)

---

## 1. Executive Summary & Technology Stack

**ENERVARA** is an enterprise-grade full-stack health, nutrition, and metabolic intelligence application designed to deliver real-time personalized nutrition insights, exercise expenditure tracking, clinical safety calibration, and AI-driven dietary guidance.

### Technology Stack
| Layer | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 5, Axios, Vanilla CSS Design System | Real-time single-page dashboard with zero page reloads, responsive layout, metabolic status bars, and interactive modals. |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Pydantic, Uvicorn | Asynchronous REST API, high-throughput rules evaluation ($>1,700\text{ profiles/sec}$), and modular calculation engines. |
| **Database** | PostgreSQL 16 / Amazon Aurora PG17 with SQLite fallback (`enervara.db`) | Relational patient models, multi-tenant clinical schema, and persistent consultation history. |
| **AI Intelligence**| Google GenAI SDK (`gemini-3.6-flash`), Pydantic Structured Output | Clinical dietary guidance, 7-day multi-day chronic streak detection, whole-food alternative generation, and quantifiable daily portion limits. |
| **Calculations** | Custom ACSM MET Engine & Nutrition Serving Unit Scaler | Body-weight calibrated exercise calorie burn and exact portion-to-gram nutritional conversions. |

---

## 2. High-Level Architecture & Request Flow

```mermaid
graph TB
    subgraph ClientLayer["Frontend Command Center (React 19 + Vite 5)"]
        UI_Nav["View Switcher Engine<br/>(All in One / Food / Workout / Guidance / Profile)"]
        UI_Banner["Metabolic Energy Banner<br/>(Consumed vs Burned vs Net Balance)"]
        UI_Food["Food Logger<br/>(5 Meal Slots, Portioned Modals)"]
        UI_Workout["Workout Logger<br/>(Duration Sliders & Rep Steppers)"]
        UI_Assess["Clinical Guidance View<br/>(Dos, Don'ts, Cautions, Collisions)"]
        UI_History["Historical Plan Drawer"]
    end

    subgraph APILayer["FastAPI Gateway (:8000)"]
        R_Users["/users Router"]
        R_Food["/food Router"]
        R_Workout["/workout Router"]
        R_Assess["/assessment & /report Router"]
    end

    subgraph EngineLayer["Core Computational & Clinical Engines"]
        NutCalc["Nutrition Calculation Engine<br/>(engine/nutrition_calc.py)"]
        BurnCalc["ACSM MET Burn Engine<br/>(engine/burn_calc.py)"]
        RulesEngine["Clinical Safety & Collision Engine<br/>(engine/rules_engine.py)"]
        GeminiEngine["Gemini 3.6 Flash Synthesis Engine<br/>(Structured Pydantic Output)"]
        FallbackEngine["Deterministic Local AI Fallback"]
    end

    subgraph PersistenceLayer["Data & Persistence Layer"]
        PostgresDB[("PostgreSQL Aurora PG17 / RDS")]
        SQLiteDB[("Local SQLite Fallback (enervara.db)")]
        Data_Foods[("foods.json (37 whole foods)")]
        Data_Workouts[("workouts.json (10 exercise types)")]
    end

    UI_Food -->|POST /food/log| R_Food
    UI_Workout -->|POST /workout/log| R_Workout
    UI_Assess -->|POST /assessment/dos-donts| R_Assess
    UI_Assess -->|POST /report/generate| R_Assess

    R_Food --> NutCalc
    R_Workout --> BurnCalc
    R_Assess --> RulesEngine
    R_Assess --> GeminiEngine
    GeminiEngine -.->|Rate Limit / Offline| FallbackEngine

    NutCalc -.-> Data_Foods
    BurnCalc -.-> Data_Workouts
    RulesEngine -.-> Data_Foods

    R_Users <--> PostgresDB
    R_Users <--> SQLiteDB
```

---

## 3. MVP Implementation Blueprint

### The 5 Core User Flows
1. **Profile Calibration**: Collects comprehensive user data: age, sex, height, weight, sleep, medical conditions, allergies, medications, past surgeries, lifestyle habits, mental wellbeing metrics, and primary health goal.
2. **Food Logger**: User selects a meal slot (Breakfast / Lunch / Dinner / Snacks / Other), selects foods with item-specific quantity pickers (steppers, bowl/cup sizes, spoons) $\rightarrow$ live calorie and macro display per meal slot and daily total.
3. **Workout Logger**: User logs exercises by duration (minutes) or repetitions $\rightarrow$ live calorie burn calculation calibrated to body weight via MET values.
4. **Dos & Don'ts Engine**: Clinical rules engine maps user conditions, allergies, medications, diet type, and lifestyle attributes to recommended and restricted foods, identifying and resolving multi-factor collisions.
5. **AI Report + Guidance**: Gemini AI synthesizes a clinical report explaining dietary dos/don'ts, multi-day pattern warnings, healthy whole-food substitutions, and safe daily portion thresholds.

---

### Phase 1 — Foundational Data Files

#### File 1: Food Catalogue (`data/foods.json`)
Contains 37 Indian and global staples, portion definitions, and clinical tags.

| Quantity Type | Example Foods | UI Picker Experience | Internal Computation |
| :--- | :--- | :--- | :--- |
| `count` | Idli, Dosa, Egg, Roti, Chapati | Number stepper (1, 2, 3...) | $\text{Unit Nutrition} \times \text{Quantity}$ |
| `bowl` | Rice, Dal, Sambar, Oats, Curd | Small (100g) / Medium (150g) / Large (200-220g) | $(\text{Per 100g} / 100) \times \text{Grams}$ |
| `cup` | Milk, Tea, Coffee, Orange Juice | Small (100ml) / Medium (150-200ml) / Large (200-300ml) | $(\text{Per 100ml} / 100) \times \text{ml}$ |
| `glass` | Water, Buttermilk | Standard glass measure ($250\,\text{ml}$) | $(\text{Per 100ml} / 100) \times 250$ |
| `handful` | Almonds, Cashews, Peanuts | Small (15g) / Medium (25g) / Large (40g) | $(\text{Per 100g} / 100) \times \text{Grams}$ |
| `slice` | Bread White, Bread Brown, Cake | Number stepper | $\text{Unit Nutrition} \times \text{Quantity}$ |
| `spoon` | Ghee, Sunflower Oil, Sugar, Honey | $1\,\text{tsp}\ (5\,\text{ml})$ / $1\,\text{tbsp}\ (15\,\text{ml})$ | $(\text{Per 100ml/g} / 100) \times \text{ml}$ |
| `piece` | Banana, Apple, Orange, Chicken, Dark Chocolate | Number stepper | $\text{Unit Nutrition} \times \text{Quantity}$ |
| `plate` | Veg Biryani, Maggi Noodles | Small (100-200g) / Medium (150-300g) / Large (200-450g) | $(\text{Per 100g} / 100) \times \text{Grams}$ |

#### File 2: Workout Catalogue (`data/workouts.json`)
| Workout | Category | Input Type | Calorie Calculation Logic |
| :--- | :--- | :--- | :--- |
| **Walking** | Cardio | Duration (min) | $\text{MET } 3.5 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Running** | Cardio | Duration (min) | $\text{MET } 7.5 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Cycling** | Cardio | Duration (min) | $\text{MET } 6.0 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Swimming** | Cardio | Duration (min) | $\text{MET } 6.0 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Badminton** | Sport | Duration (min) | $\text{MET } 5.5 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Yoga** | Flexibility | Duration (min) | $\text{MET } 2.5 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Gym (Weights)** | Strength | Duration (min) | $\text{MET } 4.5 \times \text{weight (kg)} \times (\text{minutes} / 60)$ |
| **Push-ups** | Strength | Reps | $0.50\,\text{kcal}$ per rep |
| **Squats** | Strength | Reps | $0.32\,\text{kcal}$ per rep |
| **Sit-ups** | Strength | Reps | $0.25\,\text{kcal}$ per rep |

---

### Phase 2 — Screen Cards & Frontend Interface

- **Screen 1 — Profile Setup (5-Step Form)**:
  - Step 1: Basic Info (Name, Date of Birth with live Age, Sex, Height, Weight with live BMI badge, State, City).
  - Step 2: Lifestyle Habits (Diet Type dropdown, Exercise habit, Alcohol, Smoking, Sleep hours slider $0-12\text{h}$, Water intake slider $0-20\text{ cups}$).
  - Step 3: Clinical & Medical (Searchable medical conditions, Allergies with Mild/Moderate/Severe tags, Medications, Past surgeries).
  - Step 4: Mental Wellbeing (Mood, Stress, Energy, Work pressure sliders $1-10$, Relaxation toggle buttons).
  - Step 5: Primary Health Goal (Lose Weight, Gain Weight, Maintain, Manage Condition).
- **Screen 2 — Food Logger**:
  - Meal Slot Tabs (Breakfast, Lunch, Dinner, Snacks, Other) with independent item lists.
  - Category filters and dynamic quantity modals.
  - Slot running macro totals + persistent Daily Summary bar.
- **Screen 3 — Workout Logger**:
  - Interactive activity cards, duration sliders ($5-120\text{ min}$) with presets ($15, 30, 45, 60\text{ min}$), repetition steppers, and real-time calorie burn preview.
- **Screen 4 — Clinical Guidance (Dos & Don'ts)**:
  - Two-column layout: Recommended (Do Eat) vs Restricted (Avoid).
  - Color-coded factor tags (Disease = teal, Lifestyle = yellow, Mental = pink, Allergy = red).
  - Amber Caution section (conditional foods) and Orange Collision section (conflict audit trail).
- **Screen 5 — AI Report + Guidance**:
  - "Generate My Report" trigger, structured clinical guidance, multi-day pattern recognition, and safe portion limits.

---

### Phase 3 — Systematic Build Order
1. **Backend Scaffold & Catalogues**: Database models, SQLite fallback, `foods.json`, `workouts.json`.
2. **Calculators & Ingestion**: Nutrition conversion engine (`nutrition_calc.py`) and MET burn engine (`burn_calc.py`).
3. **Clinical Decision Engine**: Constraint solver, priority hierarchy, and collision resolution logic (`rules_engine.py`).
4. **GenAI Synthesis**: Google GenAI integration with Pydantic structured output (`ClinicalAssessmentGuidance`).
5. **Frontend Core**: Unified Dashboard, Metabolic expenditure banner, Food & Workout loggers.
6. **Clinical Guidance UI**: 2-Column Dos/Don'ts view, Cautions, Collisions, and AI Plan drawer.
7. **Automated Testing Suite**: 500-user automated clinical assertion suite (`validate_500_users.py`).

---

## 4. System Architecture & Dual-Database Persistence

### Dual-Database Engine (`database.py`)
ENERVARA features an enterprise cloud PostgreSQL architecture with zero-configuration SQLite failover:

```mermaid
flowchart TD
    Start["Initialize Backend Engine"] --> CheckEnv{"Is DATABASE_URL configured?"}
    CheckEnv -- Yes --> ConnectPG["Attempt PostgreSQL Connection"]
    ConnectPG --> VerifyConn{"Connection Successful?"}
    VerifyConn -- Yes --> UsePG["Operate in Enterprise PostgreSQL Mode (Aurora PG17)"]
    VerifyConn -- No --> LogWarning["Log Warning & Trigger Failover"]
    CheckEnv -- No --> LogWarning
    LogWarning --> UseSQLite["Operate in Local SQLite Mode (enervara.db)"]
```

### Entity Relationship Model

```mermaid
erDiagram
    PATIENTS ||--o{ PATIENT_CONDITIONS : has
    PATIENTS ||--o{ PATIENT_ALLERGIES : has
    PATIENTS ||--o{ PATIENT_MEDICATIONS : takes
    PATIENTS ||--o{ PATIENT_SURGERIES : underwent
    PATIENTS ||--|| PATIENT_LIFESTYLE : maintains
    PATIENTS ||--|| PATIENT_WELLBEING : reports
    PATIENTS ||--o{ CONVERSATIONS : initiates
    CONVERSATIONS ||--o{ MESSAGES : contains
    MESSAGES ||--o| MESSAGE_AI_DETAILS : explains

    PATIENTS {
        uuid id PK
        uuid user_id FK
        string first_name
        string last_name
        date date_of_birth
        string sex
        float height_cm
        float weight_kg
    }

    PATIENT_LIFESTYLE {
        uuid id PK
        uuid patient_id FK
        string diet_type
        string exercise_habit
        string alcohol
        string smoking
        float sleep_hours
        int water_cups
    }

    PATIENT_WELLBEING {
        uuid id PK
        uuid patient_id FK
        int mood
        int stress
        int energy
        int work_pressure
        string relaxation
        string health_goal
    }
```

### Fault Tolerance & Resilience Guarantees
- **UUID Syntax Guard**: Automatically verifies UUID length and formatting before querying PostgreSQL UUID columns (`Patient.id`), eliminating PostgreSQL transaction abortion errors when non-UUID string IDs are submitted.
- **In-Memory Session Caching**: Maintains session-level profiles, food logs, workout logs, and assessment histories to guarantee uninterrupted workflows during development or offline database migrations.
- **Graceful AI Degradation**: Incorporates a 60-second cooldown circuit breaker. If Gemini API rate limits or network latency spikes occur, the deterministic clinical engine generates immediate, medically-grounded advice with zero user interruption.

---

## 5. Clinical Rules & Cross-Factor Collision Engine

### Multi-Tier Clinical Safety Priority Hierarchy

```mermaid
graph TD
    Gate1["Gate 1: Diet Type Hard Pre-Filter<br/>(Vegan / Vegetarian / Eggetarian / Non-Veg)"] --> Gate2
    Gate2["Priority 1: Severe Allergies & Critical Drug Contraindications<br/>(Peanuts, Tree Nuts, Gluten, Dairy, Warfarin, PPIs)"] --> Gate3
    Gate3["Priority 2: Severe Organ Protection & Primary Chronic Conditions<br/>(CKD Potassium/Sodium, Diabetes Low-GI, Hypertension DASH)"] --> Gate4
    Gate4["Priority 3: Metabolic BMI & Primary Health Goals<br/>(Overweight/Obesity vs Underweight, Calorie Density)"] --> Gate5
    Gate5["Priority 4: Sleep Debt & Circadian Rhythm<br/>(Caffeine elimination, Magnesium promotion)"] --> Gate6
    Gate6["Priority 5: Mental Wellbeing & Cortisol Resilience<br/>(Stress, Mood, Energy, Refined Sugar suppression)"] --> Gate7
    Gate7["Priority 6: Demographics<br/>(Age 55+ Bone/Fiber, Female Iron Needs)"]
```

### Clinical Conditions Reference Matrix
1. **Type 2 Diabetes**: Low GI, high soluble fiber, eliminates refined carbohydrates and monosaccharides (ADA Guidelines).
2. **Hypertension**: High potassium, magnesium, strict low sodium to lower peripheral vascular resistance (AHA DASH Protocol).
3. **High Cholesterol**: Strict reduction of dietary cholesterol and saturated fatty acids; boosts beta-glucan soluble fiber (AHA/NCEP).
4. **GERD**: Strictly restricts lower esophageal sphincter-relaxing items (caffeine, chocolate, fats) and direct mucosal irritants (spicy, citric acid) (ACG Guidelines).
5. **Celiac Disease**: Strict zero-tolerance elimination of wheat, rye, barley, and gluten contamination (Celiac Disease Foundation).
6. **Lactose Intolerance**: Eliminates dairy milk and unfermented high-lactose products.
7. **Chronic Kidney Disease (CKD)**: Strictly restricts potassium, sodium, and excess protein nitrogenous waste (NKF KDOQI).
8. **Gout**: Strict restriction of high-purine meats, organ tissues, and alcohol (ACR Guidelines).
9. **Hypothyroidism**: Promotes zinc, selenium, and tyrosine while avoiding excess raw goitrogens.
10. **PCOS**: Focuses on insulin sensitization via low-GI carbohydrates and anti-inflammatory whole foods.

### Cross-Factor Collision Resolution Matrix
When dietary factors conflict, higher-priority safety tiers override lower-priority recommendations:

| Food | Recommended By (Factor) | Restricted By (Factor) | Final Decision | Clinical Explanation Given to User |
| :--- | :--- | :--- | :--- | :--- |
| **Eggs** | High Activity + Goal (Gain Weight) | High Cholesterol | **Don'ts List** | "Eggs offer high protein, but your diagnosed High Cholesterol restricts dietary cholesterol. Avoid for now." |
| **Banana** | Hypertension (high potassium) | Chronic Kidney Disease (CKD) | **Don'ts List** | "Banana helps with blood pressure but potassium must be strictly limited in CKD to prevent hyperkalemia." |
| **Almonds / Nuts** | Sleep (Magnesium) + Goal (Weight Gain) | Nut Allergy | **Don'ts List** | "Nuts provide magnesium, but your diagnosed Nut Allergy triggers an absolute safety block." |
| **Curd / Yogurt** | GERD (soothing) + Female (Calcium) | Lactose Intolerance | **Don'ts List** | "Curd is beneficial for acid reflux, but lactose intolerance restricts dairy. Opt for lactose-free alternatives." |
| **Brown Rice** | Type 2 Diabetes (low GI staple) | Celiac Disease | **Dos with Caution** | "Brown rice stabilizes blood sugar. Verify certified gluten-free processing to prevent celiac cross-contamination." |
| **Ghee** | Age 55+ (joint lubrication) | BMI $>25$ + High Cholesterol | **Don'ts List** | "Ghee is traditional for joint health, but your BMI and cholesterol contraindicate saturated fats." |
| **Coffee** | Fatigue / Low Energy | Poor Sleep ($<6\text{h}$) + GERD | **Don'ts List** | "Coffee worsens acid reflux and elevates evening cortisol, exacerbating sleep fragmentation." |
| **Spinach** | Female Iron Needs + Sleep | Warfarin Medication | **Dos with Caution** | "Spinach provides iron and magnesium. Keep day-to-day intake steady to prevent destabilizing Warfarin INR." |

---

## 6. Complete REST API Specification

### Base URL: `http://127.0.0.1:8000` (Local) / `http://localhost:8000` (Docker)

| Method | Endpoint | Description | Request Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | API health check | None | `{"message": "ENERVARA API is running"}` |
| `POST` | `/users/profile` | Create/update user profile | User demographic & clinical JSON | `UserProfileOut` with auto Age & BMI |
| `GET` | `/users/{id}/profile`| Fetch user profile | `id` (UUID, email, or session ID) | `UserProfileOut` |
| `GET` | `/users/patients` | List registered clinical patients | None | `List[PatientSummary]` |
| `GET` | `/foods/list` | Food catalogue | Optional `?diet_type=vegetarian` | List of 37 food items & tags |
| `POST` | `/food/log` | Log meal slot food entry | `user_id`, `food_id`, `meal_type`, `quantity` | `FoodLogOut` with computed macros |
| `GET` | `/food/log/{id}/today`| Slot-wise food logs & daily totals| `user_id` | Slot grouped foods & cumulative macros |
| `DELETE`| `/food/log/{id}` | Remove food log entry | `log_id` | Success message |
| `GET` | `/workouts/list` | Workout activity catalogue | None | List of 10 workouts & MET values |
| `POST` | `/workout/log` | Log workout entry | `user_id`, `workout_id`, `input_value` | `WorkoutLogOut` with calorie burn |
| `GET` | `/workout/log/{id}/today`| Today's workout entries & total burn| `user_id` | Logged exercises & total kcal burned |
| `DELETE`| `/workout/log/{id}` | Remove workout log entry | `log_id` | Success message |
| `POST` | `/assessment/dos-donts`| Run clinical safety engine | `user_id`, `profile_override`, intake logs | `AssessmentResponse` (Dos, Don'ts, Collisions) |
| `GET` | `/assessment/{id}/latest`| Fetch latest clinical guidance | `user_id` | Latest `AssessmentResponse` |
| `GET` | `/assessment/{id}/history`| Fetch past assessments archive | `user_id`, `limit` | Historical assessment list |
| `POST` | `/report/generate` | Synthesize AI clinical report | `user_id`, `assessment_id` | Updated `AssessmentResponse` |

---

## 7. Gemini AI Dietary Intelligence Engine

### Google GenAI Model Configuration
- **Model**: `gemini-3.6-flash` via the official `google-genai` SDK.
- **Structured Schema Enforcement**: Output is bound to the `ClinicalAssessmentGuidance` Pydantic model:
  - `is_good` (boolean): Favorable vs concerning intake evaluation.
  - `food_assessment` (string): Biochemical rationale and positive clinical encouragement.
  - `multi_day_pattern` (string / null): Detection of chronic dietary trends across past 7 days.
  - `healthier_alternatives` (list of strings): 2 to 3 tailored whole-food alternatives.
  - `daily_portion_limit` (string): Explicit quantifiable threshold.
  - `workout_impact` (string / null): Exercise energy balance and recovery assessment.

### 7-Day Day-Wise Pattern Recognition
Instead of isolated single-meal assessments, the engine evaluates multi-day intake context:
- Detects chronic streaks of deep-fried, oily, or high-sodium foods over 3+ consecutive days.
- Correlates daily caloric and macro intake against physical workout expenditure.
- Generates preventative alerts for cardiovascular and metabolic stress.

### Clinical Boundaries & Fallback Engine
- **100% Zero-Emoji Enforcement**: Preserves clinical rigor across all prompts and UI displays.
- **Patient Privacy**: PII is stripped prior to LLM submission; evaluations operate strictly on anonymized physiological markers.
- **Deterministic Fallback**: In the event of network disconnection or API rate limits, a deterministic clinical synthesis engine executes instantaneously, preserving 100% system availability.

---

## 8. Nutrition & Caloric Burn Calculators

### Nutrition Serving Conversion Engine (`engine/nutrition_calc.py`)

#### A. Count, Piece, & Slice
$$\text{Nutrient Value} = \text{per\_unit.nutrient} \times \text{Quantity}$$

#### B. Bowl, Cup, Plate, & Handful (Gram Scaling)
$$\text{Factor} = \frac{\text{Selected Size in Grams}}{100}$$
$$\text{Nutrient Value} = \text{per\_100g.nutrient} \times \text{Factor}$$

*Portion Standards*:
- Bowl (Dal, Oats, Curd): Small = $100\,\text{g}$, Medium = $150\,\text{g}$, Large = $200\,\text{g}$.
- Bowl (Rice): Small = $100\,\text{g}$, Medium = $150\,\text{g}$, Large = $220\,\text{g}$.
- Plate (Biryani): Small = $200\,\text{g}$, Medium = $300\,\text{g}$, Large = $450\,\text{g}$.
- Handful (Nuts): Small = $15\,\text{g}$, Medium = $25\,\text{g}$, Large = $40\,\text{g}$.

#### C. Glass & Spoon
- Glass: Standard $250\,\text{ml}$ ($\text{Factor} = 2.5$).
- Spoon: $1\,\text{tsp} = 5\,\text{ml}$ ($\text{Factor} = 0.05$); $1\,\text{tbsp} = 15\,\text{ml}$ ($\text{Factor} = 0.15$).

---

### ACSM Caloric Burn Engine (`engine/burn_calc.py`)

#### A. Duration Workouts (ACSM MET Formula)
$$\text{Calories Burned} = \text{MET} \times \text{Weight (kg)} \times \left(\frac{\text{Duration in Minutes}}{60}\right)$$

*Validated MET Coefficients*:
- Walking (Brisk): $3.5\text{ MET}$
- Running: $7.5\text{ MET}$
- Cycling: $6.0\text{ MET}$
- Swimming: $6.0\text{ MET}$
- Badminton: $5.5\text{ MET}$
- Gym (Weights): $4.5\text{ MET}$
- Yoga: $2.5\text{ MET}$

#### B. Repetition Workouts
$$\text{Calories Burned} = \text{Calories Per Rep} \times \text{Reps}$$
- Push-ups: $0.50\,\text{kcal}$ / rep
- Squats: $0.32\,\text{kcal}$ / rep
- Sit-ups: $0.25\,\text{kcal}$ / rep

---

## 9. Automated 500-User Clinical Validation Suite

Located in [`validate_500_users.py`](file:///c:/Github/New%20folder/enervara/backend/validate_500_users.py), this test suite verifies clinical safety invariants across 500 randomized and edge-case patient profiles.

### 5 Mathematical Safety Invariants
1. **100% CKD Safety**: Zero high-potassium foods permitted for Chronic Kidney Disease profiles.
2. **100% Celiac Safety**: Zero gluten-containing foods permitted for Celiac profiles.
3. **100% Allergy Adherence**: Strict suppression of all identified allergens.
4. **100% Vegan Adherence**: Strict zero-tolerance animal product exclusion.
5. **100% Mutual Exclusivity**: $\text{Dos} \cap \text{Don'ts} = \emptyset$ (no food can be simultaneously recommended and restricted).

### Execution Command
```powershell
cd enervara\backend
.\venv\Scripts\python.exe validate_500_users.py
```

### Benchmark Results
- **Pass Rate**: $100\%$ ($500/500$ profiles passed).
- **Collisions Resolved**: $2,450+$ collisions audited with clinical overrides.
- **Throughput**: $>1,700$ profile evaluations per second.

---

## 10. Deployment & DevOps Manual

### Quick Start with Docker (Recommended)
Run PostgreSQL 16, FastAPI backend, and React frontend with a single command:
```powershell
cd enervara
docker compose up -d --build
```

- **Frontend Dashboard**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database**: PostgreSQL 16 on port `5432` (`enervara_db`)

### Local Development Setup (Without Docker)

#### Terminal 1 — Backend:
```powershell
cd enervara\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Frontend:
```powershell
cd enervara\frontend
npm install
npm run dev
```

### Environment Configuration (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/enervara_db
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If `GEMINI_API_KEY` is omitted, the system seamlessly uses the local deterministic clinical rule synthesis).*
