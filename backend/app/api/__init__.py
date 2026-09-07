from fastapi import APIRouter
from .upload import router as upload_router
from .investigation import router as investigation_router
from .dashboard import router as dashboard_router
from .drilldown import router as drilldown_router

api_router = APIRouter()
api_router.include_router(upload_router)
api_router.include_router(investigation_router)
api_router.include_router(dashboard_router)
api_router.include_router(drilldown_router)

__all__ = ["api_router"]
