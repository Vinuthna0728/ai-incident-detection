from fastapi import APIRouter, HTTPException
from sqlalchemy import text
import database.db as db
from services.auth import create_token
import traceback

router = APIRouter()
engine = db.engine


# ---------------- REGISTER ----------------
@router.post("/register")
def register(data: dict):
    username = data.get("username")
    password = data.get("password")

    # ✅ Validate input
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    try:
        with engine.begin() as conn:

            # 🔍 Check if user already exists
            existing_user = conn.execute(
                text("SELECT * FROM users WHERE username=:u"),
                {"u": username}
            ).fetchone()

            if existing_user:
                raise HTTPException(status_code=400, detail="User already exists")

            # ✅ Insert new user
            conn.execute(
                text("INSERT INTO users (username, password) VALUES (:u, :p)"),
                {"u": username, "p": password}
            )

        return {"message": "User registered successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print("❌ REGISTER ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Register failed")


# ---------------- LOGIN ----------------
@router.post("/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    # ✅ Validate input
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE username=:u"),
                {"u": username}
            ).fetchone()

        # ❌ User not found
        if not result:
            raise HTTPException(status_code=401, detail="User not found")

        user = dict(result._mapping)

        # ❌ Password mismatch
        if user["password"] != password:
            raise HTTPException(status_code=401, detail="Invalid password")

        # ✅ Generate JWT token
        token = create_token({
            "username": username
        })

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Login failed")