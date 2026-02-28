from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401 — ensure all models are registered with Base
from routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Landly API",
    description="Citizen Housing Management Portal — Backend Services",
    version="2.4.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "service": "Landly API",
        "version": "2.4.1",
        "status": "operational",
        "message": "Compliance is comfort.",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
