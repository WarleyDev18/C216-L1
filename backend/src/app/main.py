import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api.routes.atividades import router as atividades_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.disciplinas import router as disciplinas_router
from app.api.routes.health import router as health_router
from app.core.config import CORS_ORIGINS

app = FastAPI(title="Gestor Academico")
logger = logging.getLogger("app")


# OperationalError = falha de operacao do banco (fora do ar, conexao perdida):
# indisponibilidade temporaria, nao erro do cliente nem bug -> 503. Erros de
# programacao e de integridade nao passam por aqui. A sessao e fechada pelo
# get_db (rollback); nada e repetido automaticamente.
@app.exception_handler(OperationalError)
async def banco_indisponivel(request: Request, exc: OperationalError):
    logger.error(
        "Banco indisponivel em %s %s: %s",
        request.method,
        request.url.path,
        exc.orig,
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Banco de dados indisponível"},
    )


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
