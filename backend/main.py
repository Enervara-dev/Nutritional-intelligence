from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

# Database is strictly read-only for fetching clinical data

from routers import users, food, workout, assessment

app = FastAPI(title="ENERVARA Nutrition Intelligence API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(food.router, prefix="", tags=["Food"])
app.include_router(workout.router, prefix="", tags=["Workout"])
app.include_router(assessment.router, prefix="", tags=["Assessment"])

@app.get("/")
def root():
    return {"message": "ENERVARA API is running"}
