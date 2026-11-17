from fastapi import FastAPI

from app.api.routes.disciplinas import router as disciplinas_router
from app.api.routes.health import router as health_router

app = FastAPI(title="Gestor Academico")

app.include_router(health_router)
app.include_router(disciplinas_router)
