from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/")
def root():
    return {"message": "Ola, Sistemas Distribuidos!"}
