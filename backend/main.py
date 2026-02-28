from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401 — ensure all models are registered with Base
from routers.auth import router as auth_router
from routers.dashboard import router as dashboard_router
from routers.units import router as units_router
from routers.payments import router as payments_router
from routers.markets import router as markets_router
from routers.chat import router as chat_router
from routers.notifications import router as notifications_router
from routers.ratings import router as ratings_router
from routers.admin import router as admin_router


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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(units_router)
app.include_router(payments_router)
app.include_router(markets_router)
app.include_router(chat_router)
app.include_router(notifications_router)
app.include_router(ratings_router)
app.include_router(admin_router)


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
