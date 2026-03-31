from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text

import database.db as db
from services.auth import decode_token

router = APIRouter()
engine = db.engine

# 🔐 SECURITY
security = HTTPBearer()


# ✅ GET CURRENT USER FROM TOKEN
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = decode_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return payload  # MUST contain user_id

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# ✅ GET ALL INCIDENTS (USER-SPECIFIC 🔥 FIXED)
@router.get("/incidents")
def get_incidents(user: dict = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT * FROM incidents 
                    WHERE user_id = :user_id
                    ORDER BY id DESC
                """),
                {"user_id": user["user_id"]}
            )

            incidents = [dict(row._mapping) for row in result]

        return incidents

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ GET SINGLE INCIDENT (USER-SPECIFIC 🔥 FIXED)
@router.get("/incident/{id}")
def get_incident(id: str, user: dict = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT * FROM incidents 
                    WHERE id = :id AND user_id = :user_id
                """),
                {
                    "id": id,
                    "user_id": user["user_id"]
                }
            ).fetchone()

            if result:
                return dict(result._mapping)

        raise HTTPException(status_code=404, detail="Incident not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ CREATE INCIDENT (NEW - IMPORTANT 🔥)
@router.post("/incidents")
def create_incident(data: dict, user: dict = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO incidents (id, root_cause, severity, status, user_id)
                    VALUES (:id, :root_cause, :severity, :status, :user_id)
                """),
                {
                    "id": data.get("id"),  # or generate UUID in frontend/backend
                    "root_cause": data.get("root_cause"),
                    "severity": data.get("severity"),
                    "status": data.get("status", "open"),
                    "user_id": user["user_id"]
                }
            )
            conn.commit()

        return {"message": "Incident created successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))