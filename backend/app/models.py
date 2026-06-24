"""Database setup, ORM models, and Pydantic schemas.

ORM attribute names are kept camelCase (mapped to snake_case columns) so they
line up 1:1 with the front-end JSON shapes in ui/src/api/types.ts. That lets the
Pydantic schemas use from_attributes directly without alias juggling.
"""

import os
from datetime import date

from pydantic import BaseModel, ConfigDict
from sqlalchemy import BigInteger, Date, ForeignKey, Integer, String
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# psycopg3 async driver. Default points at the docker-compose Postgres service.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://booking:booking@localhost:5432/booking",
)

engine = create_async_engine(DATABASE_URL)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


# --- ORM models -------------------------------------------------------------


class Computer(Base):
    __tablename__ = "computers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    macAddress: Mapped[str] = mapped_column("mac_address", String)
    ipAddress: Mapped[str] = mapped_column("ip_address", String)
    osImage: Mapped[str] = mapped_column("os_image", String)
    assignedUser: Mapped[str] = mapped_column("assigned_user", String)
    assignedUserEmail: Mapped[str] = mapped_column("assigned_user_email", String)
    password: Mapped[str] = mapped_column(String)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    computerId: Mapped[int] = mapped_column(
        "computer_id",
        BigInteger,
        ForeignKey("computers.id", ondelete="CASCADE"),
        index=True,
    )
    studentName: Mapped[str] = mapped_column("student_name", String)
    studentEmail: Mapped[str] = mapped_column("student_email", String)
    projectName: Mapped[str] = mapped_column("project_name", String)
    startDate: Mapped[date] = mapped_column("start_date", Date)
    endDate: Mapped[date] = mapped_column("end_date", Date)
    startHour: Mapped[int] = mapped_column("start_hour", Integer)
    endHour: Mapped[int] = mapped_column("end_hour", Integer)


# --- Pydantic schemas (camelCase to match the front-end) --------------------


class ComputerCreate(BaseModel):
    name: str
    macAddress: str
    ipAddress: str
    osImage: str
    assignedUser: str
    assignedUserEmail: str
    password: str


class ComputerUpdate(BaseModel):
    name: str | None = None
    macAddress: str | None = None
    ipAddress: str | None = None
    osImage: str | None = None
    assignedUser: str | None = None
    assignedUserEmail: str | None = None
    password: str | None = None


class ComputerRead(ComputerCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BookingCreate(BaseModel):
    computerId: int
    studentName: str
    studentEmail: str
    projectName: str
    startDate: date
    endDate: date
    startHour: int
    endHour: int


class BookingUpdate(BaseModel):
    computerId: int | None = None
    studentName: str | None = None
    studentEmail: str | None = None
    projectName: str | None = None
    startDate: date | None = None
    endDate: date | None = None
    startHour: int | None = None
    endHour: int | None = None


class BookingRead(BookingCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --- Ping schemas -----------------------------------------------------------


class PingRequest(BaseModel):
    """A batch of IP addresses to check for reachability."""

    ips: list[str]


class PingResult(BaseModel):
    """Reachability of a single host. latencyMs is the average round-trip in
    milliseconds when reachable, and None when the host did not respond."""

    reachable: bool
    latencyMs: float | None = None
