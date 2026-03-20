from fastapi import Cookie, HTTPException, status
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app.config import settings

COOKIE_NAME = "ylc_session"
COOKIE_MAX_AGE = 86400  # 24 hours


def create_session_token() -> str:
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    return s.dumps({"auth": True})


def verify_session_token(token: str) -> bool:
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    try:
        data = s.loads(token, max_age=COOKIE_MAX_AGE)
        return data.get("auth") is True
    except (BadSignature, SignatureExpired):
        return False


def get_current_user(ylc_session: str = Cookie(default=None)):
    if not ylc_session or not verify_session_token(ylc_session):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return True
