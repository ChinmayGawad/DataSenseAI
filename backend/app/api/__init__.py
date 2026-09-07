from fastapi import APIRouter
from .upload import router as upload_router
from .investigation import router as investigation_router
from .dashboard import router as dashboard_router
from .drilldown import router as drilldown_router
from .query import router as query_router
from .evaluation import router as evaluation_router
from .auth import router as auth_router
from .why_engine import router as why_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(upload_router)
api_router.include_router(investigation_router)
api_router.include_router(dashboard_router)
api_router.include_router(drilldown_router)
api_router.include_router(query_router)
api_router.include_router(evaluation_router)
api_router.include_router(why_router)


__all__ = ["api_router"]
