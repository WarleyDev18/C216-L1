from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.atividades import router as atividades_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.disciplinas import router as disciplinas_router
from app.api.routes.health import router as health_router
from app.core.config import CORS_ORIGINS

app = FastAPI(title="Gestor Academico")

# So as origens configuradas e so o que o frontend usa (o preflight OPTIONS e
# respondido pelo proprio middleware).
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(health_router)
app.include_router(disciplinas_router)
app.include_router(atividades_router)
app.include_router(dashboard_router)
