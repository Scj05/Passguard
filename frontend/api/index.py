from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from zxcvbn import zxcvbn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PasswordRequest(BaseModel):
    password: str

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/check-password")
def check_password(data: PasswordRequest):
    result = zxcvbn(data.password)

    score = result["score"]
    strength_percent = int((score / 4) * 100)

    return {
        "score": score,
        "strength_percent": strength_percent,
        "crack_time": result["crack_times_display"]["offline_slow_hashing_1e4_per_second"],
        "feedback": result["feedback"],
        "guesses": result["guesses"],
        "warning": result["feedback"].get("warning", ""),
        "suggestions": result["feedback"].get("suggestions", [])
    }