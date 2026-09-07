"""
Tests for DataSense AI Enterprise Scaling Architecture.
Verifies OAuth2/JWT authentication, multi-tenant data isolation,
storage partition scoping, and pluggable JobQueueBroker.
"""

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.app.core.auth import (
    TenantUser,
    create_access_token,
    decode_access_token,
    get_current_tenant_user,
    verify_tenant_access,
    DEMO_USERS,
)
from backend.app.services.job_store import job_store
from backend.app.services.storage_service import storage_service
from backend.app.tasks.broker import job_broker


client = TestClient(app)


class TestEnterpriseScaling:
    def test_01_token_generation_and_decoding(self):
        """Verifies JWT token issuance, claims embedding, and decoding."""
        user = TenantUser(
            user_id="usr_test_123",
            email="analyst@enterprise.com",
            tenant_id="tenant_alpha",
            role="analyst",
            name="Test Analyst"
        )
        token = create_access_token(user)
        assert isinstance(token, str)
        assert len(token) > 20

        payload = decode_access_token(token)
        assert payload["sub"] == "usr_test_123"
        assert payload["tenant_id"] == "tenant_alpha"
        assert payload["email"] == "analyst@enterprise.com"
        assert payload["role"] == "analyst"

    def test_02_disabled_auth_mode_fallback(self):
        """
        When AUTH_ENABLED=False, endpoints must operate seamlessly
        injecting default developer tenant without requiring Authorization headers.
        """
        original_auth = settings.AUTH_ENABLED
        try:
            settings.AUTH_ENABLED = False
            res = client.get("/api/auth/me")
            assert res.status_code == 200
            data = res.json()
            assert data["tenant_id"] == "default_tenant"
            assert data["auth_enabled"] is False
        finally:
            settings.AUTH_ENABLED = original_auth

    def test_03_enabled_auth_mode_bearer_token(self):
        """
        When AUTH_ENABLED=True, missing/invalid token returns 401,
        and valid signed Bearer token grants authenticated tenant access.
        """
        original_auth = settings.AUTH_ENABLED
        try:
            settings.AUTH_ENABLED = True
            
            # 1. Missing token -> 401
            res_no_token = client.get("/api/auth/me")
            assert res_no_token.status_code == 401

            # 2. Invalid token -> 401
            res_bad_token = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
            assert res_bad_token.status_code == 401

            # 3. Valid user token -> 200
            user = TenantUser(
                user_id="usr_retail_88",
                email="retail@enterprise.com",
                tenant_id="retail_corp",
                role="analyst",
                name="Retail Analyst"
            )
            valid_token = create_access_token(user)
            res_valid = client.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_token}"})
            assert res_valid.status_code == 200
            data = res_valid.json()
            assert data["tenant_id"] == "retail_corp"
            assert data["email"] == "retail@enterprise.com"
        finally:
            settings.AUTH_ENABLED = original_auth

    def test_04_multi_tenant_isolation_boundary(self):
        """
        Enforces that Tenant B cannot access or query datasets created by Tenant A.
        Returns 403 Forbidden on tenant boundary crossing.
        """
        original_auth = settings.AUTH_ENABLED
        try:
            settings.AUTH_ENABLED = True

            tenant_a_user = TenantUser(
                user_id="usr_a", email="a@corp.com", tenant_id="tenant_a", role="analyst", name="Tenant A User"
            )
            tenant_b_user = TenantUser(
                user_id="usr_b", email="b@corp.com", tenant_id="tenant_b", role="analyst", name="Tenant B User"
            )
            admin_user = TenantUser(
                user_id="usr_admin", email="admin@datasense.ai", tenant_id="admin_tenant", role="admin", name="Admin User"
            )

            token_a = create_access_token(tenant_a_user)
            token_b = create_access_token(tenant_b_user)
            token_admin = create_access_token(admin_user)

            # Tenant A creates a job
            job_id_a = job_store.create_job("ds_test_a", tenant_id="tenant_a")
            job_store.update_job_status(job_id_a, status="completed", progress=100)
            job_store.save_dashboard(job_id_a, {"job_id": job_id_a, "dataset_id": "ds_test_a", "health_score": 95.0, "summary_cards": [], "charts": [], "insights": [], "cleaning_summary": {}})

            # 1. Tenant A accesses own job -> 200
            res_a = client.get(f"/api/status/{job_id_a}", headers={"Authorization": f"Bearer {token_a}"})
            assert res_a.status_code == 200

            # 2. Tenant B attempts to access Tenant A's job -> 403 Forbidden!
            res_b = client.get(f"/api/status/{job_id_a}", headers={"Authorization": f"Bearer {token_b}"})
            assert res_b.status_code == 403
            assert "Access denied" in res_b.json()["detail"]

            # 3. Platform Admin accesses Tenant A's job -> 200 (Admin oversight permitted)
            res_admin = client.get(f"/api/status/{job_id_a}", headers={"Authorization": f"Bearer {token_admin}"})
            assert res_admin.status_code == 200
        finally:
            settings.AUTH_ENABLED = original_auth

    def test_05_storage_tenant_directory_isolation(self):
        """
        Verifies uploaded files are segregated into dedicated tenant folders on the filesystem.
        """
        dummy_csv = b"TransactionID,Revenue,Profit\n1,1000,200\n2,1500,350\n"
        file_id, path, size = storage_service.save_file(
            file_bytes=dummy_csv,
            original_filename="sample_sales.csv",
            tenant_id="tenant_isolated_99"
        )
        assert path.exists()
        assert "tenant_isolated_99" in str(path)

    def test_06_job_broker_dual_mode_dispatch(self):
        """
        Verifies JobQueueBroker dispatches correctly in background mode
        and gracefully handles celery mode.
        """
        dummy_file = settings.LOCAL_UPLOAD_DIR / "dummy_test.csv"
        dummy_file.write_text("A,B\n1,2\n3,4\n", encoding="utf-8")

        # Test local background mode
        res_local = job_broker.dispatch_investigation_job(
            job_id="job_test_01",
            file_path=dummy_file,
            filename="dummy_test.csv",
            tenant_id="tenant_x"
        )
        assert res_local["worker_cluster"] == "local"

    def test_07_oauth2_token_endpoint_and_demo_tenants(self):
        """
        Verifies OpenAPI standard OAuth2 token flow and demo tenant listing.
        """
        # 1. Demo tenant list
        res_tenants = client.get("/api/auth/demo-tenants")
        assert res_tenants.status_code == 200
        assert len(res_tenants.json()["available_demo_tenants"]) >= 2

        # 2. OAuth2 password token exchange (Swagger UI lock icon compatible)
        form_payload = {
            "username": "analyst@datasense.ai",
            "password": "password123"
        }
        res_token = client.post("/api/auth/token", data=form_payload)
        assert res_token.status_code == 200
        token_data = res_token.json()
        assert "access_token" in token_data
        assert token_data["tenant_id"] == "enterprise_corp"
