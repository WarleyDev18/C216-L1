from fastapi import FastAPI

from app.api.routes.atividades import router as atividades_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.disciplinas import router as disciplinas_router
from app.api.routes.health import router as health_router

app = FastAPI(title="Gestor Academico")

app.include_router(health_router)
app.include_router(disciplinas_router)
app.include_router(atividades_router)
app.include_router(dashboard_router)
