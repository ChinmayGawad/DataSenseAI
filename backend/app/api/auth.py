"""
DataSense AI - Authentication & Tenant Management Endpoints.
Provides OAuth2 token exchange, JSON login, tenant inspection, and demo profile switching.
"""

import re
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator

from ..core.auth import (
    TenantUser,
    TokenResponse,
    create_access_token,
    hash_password,
    verify_password,
    get_current_tenant_user,
    DEMO_USERS,
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Enterprise Authentication & Multi-Tenancy"])

# Email validation pattern (RFC 5322 simplified)
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

# Password strength rules: min 8 chars, at least 1 letter, 1 digit, 1 special char
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    confirm_password: str
    name: str = "DataSense User"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_PATTERN.match(v):
            raise ValueError("Invalid email format. Please provide a valid email address.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must be at least 8 characters long and include at least "
                "one letter, one number, and one special character."
            )
        return v

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match. Please confirm your password.")
        return v


@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(payload: LoginRequest):
    """
    Standard JSON authentication endpoint for web client and external API consumers.
    Returns signed JWT access token containing tenant_id and user role.
    """
    email = payload.email.lower().strip()
    user_record = DEMO_USERS.get(email)

    if not user_record or not verify_password(payload.password, user_record.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password credentials."
        )

    user = TenantUser(
        user_id=user_record["user_id"],
        email=user_record["email"],
        tenant_id=user_record["tenant_id"],
        role=user_record["role"],
        name=user_record["name"],
    )

    token = create_access_token(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        tenant_id=user.tenant_id,
        user=user,
    )


@router.post("/register", response_model=TokenResponse)
async def register_new_user(payload: RegisterRequest):
    """
    Standard JSON registration endpoint for new users.
    Validates email format, password strength, and password confirmation.
    Hashes the password with PBKDF2 and issues a signed JWT access token.
    """
    email = payload.email

    if email in DEMO_USERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in instead.",
        )

    password_hash = hash_password(payload.password)

    user_id = f"usr_{len(DEMO_USERS) + 1:02d}"
    user_record = {
        "user_id": user_id,
        "email": email,
        "tenant_id": "default_tenant",
        "name": payload.name.strip(),
        "role": "analyst",
        "password_hash": password_hash,
    }
    DEMO_USERS[email] = user_record

    user = TenantUser(
        user_id=user_record["user_id"],
        email=user_record["email"],
        tenant_id=user_record["tenant_id"],
        role=user_record["role"],
        name=user_record["name"],
    )

    token = create_access_token(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        tenant_id=user.tenant_id,
        user=user,
    )


@router.post("/token", response_model=Dict[str, Any])
async def oauth2_token_endpoint(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 Password Flow endpoint. Compatible with OpenAPI Swagger UI Authorize lock icon.
    Username accepts user email (e.g. analyst@datasense.ai / password123).
    """
    email = form_data.username.lower().strip()
    user_record = DEMO_USERS.get(email)

    if not user_record or not verify_password(form_data.password, user_record.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = TenantUser(
        user_id=user_record["user_id"],
        email=user_record["email"],
        tenant_id=user_record["tenant_id"],
        role=user_record["role"],
        name=user_record["name"],
    )

    token = create_access_token(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "tenant_id": user.tenant_id,
        "role": user.role
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_profile(
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Returns the profile and isolated tenant workspace context of the currently authenticated caller.
    """
    return {
        "status": "success",
        "user_id": current_user.user_id,
        "email": current_user.email,
        "tenant_id": current_user.tenant_id,
        "role": current_user.role,
        "name": current_user.name,
        "auth_enabled": settings.AUTH_ENABLED,
    }


@router.get("/demo-tenants")
async def list_demo_tenants():
    """
    Lists available demonstration tenants for testing tenant data isolation.
    """
    return {
        "auth_enabled": settings.AUTH_ENABLED,
        "available_demo_tenants": [
            {
                "email": "analyst@datasense.ai",
                "role": "analyst",
                "tenant_id": "enterprise_corp",
                "name": "Sarah Chen",
                "default_password": "password123",
                "description": "Retail / Enterprise tenant boundary"
            },
            {
                "email": "doctor@datasense.ai",
                "role": "analyst",
                "tenant_id": "healthcare_system",
                "name": "Dr. Rajesh Sharma",
                "default_password": "password123",
                "description": "HIPAA-compliant healthcare tenant boundary"
            },
            {
                "email": "admin@datasense.ai",
                "role": "admin",
                "tenant_id": "admin_root",
                "name": "Platform Administrator",
                "default_password": "admin123",
                "description": "Global administrator with multi-tenant oversight"
            }
        ]
    }
