# ENERVARA Frontend

React + Vite frontend for the ENERVARA Nutrition & Workout Intelligence platform.

## Architecture

- **Framework**: React 19 + Vite 5
- **Routing**: React Router 7 (`/`, `/food`, `/workout`, `/profile`)
- **API Communication**: Axios client configured to `http://localhost:8000`
- **Design System**: Vanilla CSS (`App.css`) with curated modern variables, gradients, and micro-interactions
- **Key Views**:
  - `src/pages/Dashboard.jsx`: All-in-One Dashboard integrating:
    - Real-Time Energy & Metabolic Balance banner
    - Food & Nutrition Logger with meal slots, category filtering, portion modals, and macro progress
    - Workout & Exercise Tracker with MET-based caloric burn estimation and today's activity log
    - Profile Setup with Demographics, Lifestyle, Health & Medical, Mental Wellbeing, and Primary Goal
  - `src/pages/FoodLogger.jsx`: Standalone Food Logger component
  - `src/pages/WorkoutLogger.jsx`: Standalone Workout Logger component
  - `src/pages/ProfileSetup.jsx`: Standalone Profile Setup component

## Getting Started

```bash
# Install dependencies
npm install

# Start local dev server (default port 5173)
npm run dev

# Build for production
npm run build
```
