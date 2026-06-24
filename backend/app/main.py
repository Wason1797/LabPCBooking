"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import router

# Schema is managed by Alembic migrations (`alembic upgrade head`), not created
# at startup. See api/migrations.
app = FastAPI(title="PC Booking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
