from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

# 🔐 CONFIG
SECRET_KEY = "supersecretkey"   # ⚠️ change in production (.env)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# 🔑 PASSWORD HASHING
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------- PASSWORD ----------------

# ✅ Hash password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ✅ Verify password
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------- TOKEN ----------------

# ✅ Create JWT token
def create_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ✅ Decode JWT token
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None