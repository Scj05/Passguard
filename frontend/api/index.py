from fastapi import FastAPI
from pydantic import BaseModel
from zxcvbn import zxcvbn

app = FastAPI()

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
        "suggestions": result["feedback"].get("suggestions", []),
        "attack_methods": {
            "dictionary_attack": {
                "risk": "High" if score <= 2 else "Low",
                "description": "Checks whether the password contains common words, names, or predictable patterns."
            },
            "brute_force": {
                "risk": "High" if score <= 1 else "Medium" if score <= 3 else "Low",
                "description": "Estimates how difficult the password is to guess by trying many possible combinations."
            },
            "pattern_matching": {
                "risk": "High" if score <= 2 else "Low",
                "description": "Looks for predictable structures like repeated characters, keyboard patterns, or simple substitutions."
            }
        }
    }