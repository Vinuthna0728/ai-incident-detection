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

        return payload

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# ✅ GET ALL INCIDENTS (PROTECTED)
@router.get("/incidents")
def get_incidents(user: dict = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM incidents ORDER BY rowid DESC"))

            incidents = [dict(row._mapping) for row in result]

        return incidents

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ GET SINGLE INCIDENT (PROTECTED)
@router.get("/incident/{id}")
def get_incident(id: str, user: dict = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM incidents WHERE id=:id"),
                {"id": id}
            ).fetchone()

            if result:
                return dict(result._mapping)

        raise HTTPException(status_code=404, detail="Incident not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))