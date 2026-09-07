"""
Enterprise Authentication & Multi-Tenant Isolation Core for DataSense AI.
Provides JWT token creation/verification, password hashing, pre-configured demo users,
and FastAPI dependency injection with zero-breakage fallback for local/demo mode.
"""

import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from ..config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/token", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)


class TenantUser(BaseModel):
    user_id: str
    email: str
    tenant_id: str
    role: str = "analyst"  # "admin", "analyst", "viewer"
    name: str = "DataSense User"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    tenant_id: str
    user: TenantUser


# Built-in enterprise demo tenants & users for zero-friction evaluation
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "analyst@datasense.ai": {
        "user_id": "usr_analyst_01",
        "email": "analyst@datasense.ai",
        "tenant_id": "enterprise_corp",
        "name": "Sarah Chen (Enterprise)",
        "role": "analyst",
        "password_hash": "e10adc3949ba59abbe56e057f20f883e"  # md5/sha default or demo
    },
    "doctor@datasense.ai": {
        "user_id": "usr_doctor_02",
        "email": "doctor@datasense.ai",
        "tenant_id": "healthcare_system",
        "name": "Dr. Rajesh Sharma (Healthcare)",
        "role": "analyst",
        "password_hash": "e10adc3949ba59abbe56e057f20f883e"
    },
    "admin@datasense.ai": {
        "user_id": "usr_admin_00",
        "email": "admin@datasense.ai",
        "tenant_id": "admin_root",
        "name": "Platform Administrator",
        "role": "admin",
        "password_hash": "e10adc3949ba59abbe56e057f20f883e"
    }
}


def hash_password(password: str) -> str:
    """Cryptographically secure salted pbkdf2 password hashing."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"


def verify_password(plain_password: str, hashed: str) -> bool:
    """Verifies plain password against hashed salt:key string or demo fallback."""
    if not hashed:
        return False
    # Demo bypass for convenience during testing
    if hashed == "e10adc3949ba59abbe56e057f20f883e" and plain_password in ("password123", "admin123"):
        return True
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 100000)
        return hmac.compare_digest(key_hex, computed.hex())
    except Exception:
        return False


def create_access_token(
    user: TenantUser,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Creates a signed JWT access token containing identity and tenant context."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user.user_id,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role,
        "name": user.name,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": "datasense-auth-runtime"
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token integrity and expiration."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_tenant_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    token_str: Optional[str] = Depends(oauth2_scheme)
) -> TenantUser:
    """
    FastAPI dependency for endpoints requiring tenant identification.
    - If AUTH_ENABLED is False (local / hackathon mode), seamlessly injects default developer tenant.
    - If AUTH_ENABLED is True, validates JWT token and enforces tenant context.
    """
    if not settings.AUTH_ENABLED:
        return TenantUser(
            user_id="dev-user-01",
            email="dev@datasense.ai",
            tenant_id="default_tenant",
            role="admin",
            name="Developer (Local Mode)"
        )

    token = None
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif token_str:
        token = token_str

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    return TenantUser(
        user_id=payload.get("sub", "unknown"),
        email=payload.get("email", ""),
        tenant_id=payload.get("tenant_id", "default_tenant"),
        role=payload.get("role", "analyst"),
        name=payload.get("name", "Authenticated User")
    )


def verify_tenant_access(current_user: TenantUser, resource_tenant_id: Optional[str]) -> None:
    """
    Enforces multi-tenant authorization boundaries.
    Admins can access any tenant; standard users can only access resources in their own tenant.
    """
    if not settings.AUTH_ENABLED:
        return

    if current_user.role == "admin":
        return

    if resource_tenant_id and resource_tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Resource belongs to tenant '{resource_tenant_id}', but authenticated tenant is '{current_user.tenant_id}'."
        )
