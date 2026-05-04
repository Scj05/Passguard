import hashlib
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from zxcvbn import zxcvbn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PasswordRequest(BaseModel):
    password: str


def calculate_pattern_risk(password: str) -> int:
    if not password:
        return 0

    risk = 100

    if len(password) >= 8:
        risk -= 15
    if len(password) >= 12:
        risk -= 20
    if any(char.isupper() for char in password):
        risk -= 10
    if any(char.islower() for char in password):
        risk -= 10
    if any(char.isdigit() for char in password):
        risk -= 10
    if any(not char.isalnum() for char in password):
        risk -= 15

    common_patterns = ["123", "abc", "qwerty", "password", "admin"]

    if any(pattern in password.lower() for pattern in common_patterns):
        risk += 25

    for i in range(len(password) - 2):
        if password[i] == password[i + 1] == password[i + 2]:
            risk += 15

    years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]
    if any(year in password for year in years):
        risk += 10

    return max(0, min(100, risk))


def check_breached_password(password: str) -> int:
    sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"

    try:
        response = requests.get(url, timeout=5)

        if response.status_code != 200:
            return -1

        for line in response.text.splitlines():
            hash_suffix, count = line.split(":")
            if hash_suffix == suffix:
                return int(count)

        return 0

    except requests.RequestException:
        return -1


def mask_password(password: str) -> str:
    if len(password) <= 2:
        return "*" * len(password)

    return password[0] + "*" * (len(password) - 2) + password[-1]


@app.get("/")
def home():
    return {"message": "PassGuard AI backend is running"}


@app.post("/analyze")
def analyze_password(request: PasswordRequest):
    password = request.password
    result = zxcvbn(password)

    pattern_risk = calculate_pattern_risk(password)
    breach_count = check_breached_password(password)
    strength_percent = (result["score"] + 1) * 20

    return {
        "score": result["score"],
        "strength_percent": strength_percent,
        "strength_label": ["Very Weak", "Weak", "Okay", "Strong", "Very Strong"][result["score"]],
        "estimated_crack_time": result["crack_times_display"]["offline_slow_hashing_1e4_per_second"],
        "pattern_risk": pattern_risk,
        "breach_count": breach_count,
        "masked_password": mask_password(password),
        "warning": result["feedback"]["warning"],
        "suggestions": result["feedback"]["suggestions"],
        "attack_simulation": {
            "dictionary_attack": result["crack_times_display"]["offline_fast_hashing_1e10_per_second"],
            "slow_hash_attack": result["crack_times_display"]["offline_slow_hashing_1e4_per_second"],
            "online_attack": result["crack_times_display"]["online_no_throttling_10_per_second"],
        },
    }