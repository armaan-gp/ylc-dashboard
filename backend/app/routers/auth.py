import bcrypt
from fastapi import APIRouter, Response, HTTPException, status, Depends
from pydantic import BaseModel
from app.config import settings
from app.auth import create_session_token, get_current_user, COOKIE_NAME, COOKIE_MAX_AGE

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(body: LoginRequest, response: Response):
    if not settings.APP_PASSWORD_HASH:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="APP_PASSWORD_HASH is not configured. Please set it in your .env file.",
        )

    pw_bytes = body.password.encode("utf-8")
    hash_bytes = settings.APP_PASSWORD_HASH.encode("utf-8")

    try:
        valid = bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    token = create_session_token()
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )
    return {"message": "Login successful"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"message": "Logged out"}


@router.get("/me")
def me(_: bool = Depends(get_current_user)):
    return {"authenticated": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(body: ChangePasswordRequest, _: bool = Depends(get_current_user)):
    """Validates current password and returns new hash — user must manually update .env."""
    if not settings.APP_PASSWORD_HASH:
        raise HTTPException(status_code=500, detail="APP_PASSWORD_HASH not configured")

    pw_bytes = body.current_password.encode("utf-8")
    hash_bytes = settings.APP_PASSWORD_HASH.encode("utf-8")

    try:
        valid = bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode()
    return {
        "message": "New hash generated. Update APP_PASSWORD_HASH in your .env file.",
        "new_hash": new_hash,
    }
