"""CRUD endpoints for computers and bookings."""

import asyncio
import ipaddress
import re
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    Booking,
    BookingCreate,
    BookingRead,
    BookingUpdate,
    Computer,
    ComputerCreate,
    ComputerRead,
    ComputerUpdate,
    PingRequest,
    PingResult,
    SessionLocal,
)

router = APIRouter()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


@router.get("/computers", response_model=list[ComputerRead])
async def list_computers(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Computer))
    return result.scalars().all()


@router.get("/computers/{computer_id}", response_model=ComputerRead)
async def get_computer(computer_id: str, session: AsyncSession = Depends(get_session)):
    computer = await session.get(Computer, computer_id)
    if computer is None:
        raise HTTPException(status_code=404, detail="Computer not found")
    return computer


@router.post("/computers", response_model=ComputerRead, status_code=201)
async def create_computer(
    payload: ComputerCreate, session: AsyncSession = Depends(get_session)
):
    computer = Computer(**payload.model_dump())
    session.add(computer)
    await session.commit()
    await session.refresh(computer)
    return computer


@router.patch("/computers/{computer_id}", response_model=ComputerRead)
async def update_computer(
    computer_id: str,
    payload: ComputerUpdate,
    session: AsyncSession = Depends(get_session),
):
    computer = await session.get(Computer, computer_id)
    if computer is None:
        raise HTTPException(status_code=404, detail="Computer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(computer, field, value)
    await session.commit()
    await session.refresh(computer)
    return computer


@router.delete("/computers/{computer_id}", status_code=204)
async def delete_computer(
    computer_id: str, session: AsyncSession = Depends(get_session)
):
    computer = await session.get(Computer, computer_id)
    if computer is None:
        raise HTTPException(status_code=404, detail="Computer not found")
    await session.delete(computer)
    await session.commit()


# --- Bookings ---------------------------------------------------------------


@router.get("/bookings", response_model=list[BookingRead])
async def list_bookings(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking))
    return result.scalars().all()


@router.get("/bookings/{booking_id}", response_model=BookingRead)
async def get_booking(booking_id: str, session: AsyncSession = Depends(get_session)):
    booking = await session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/bookings", response_model=BookingRead, status_code=201)
async def create_booking(
    payload: BookingCreate, session: AsyncSession = Depends(get_session)
):
    booking = Booking(**payload.model_dump())
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking


@router.patch("/bookings/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: str,
    payload: BookingUpdate,
    session: AsyncSession = Depends(get_session),
):
    booking = await session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    await session.commit()
    await session.refresh(booking)
    return booking


@router.delete("/bookings/{booking_id}", status_code=204)
async def delete_booking(booking_id: str, session: AsyncSession = Depends(get_session)):
    booking = await session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    await session.delete(booking)
    await session.commit()


# --- Ping -------------------------------------------------------------------

# Number of echo requests per host ("3 tries").
PING_COUNT = 3
# Overall deadline (seconds) so an unreachable host can't hang the request.
PING_DEADLINE = 5
# Average round-trip from the ping summary: "rtt min/avg/max/mdev = a/b/c/d ms".
_RTT_RE = re.compile(r"=\s*[\d.]+/([\d.]+)/")


async def _ping(ip: str) -> PingResult:
    """Ping a single, already-validated IP. The address is passed as a discrete
    argv entry to ``ping`` via create_subprocess_exec — no shell is involved, so
    there is no string for anything but the IP to be interpreted as."""
    proc = await asyncio.create_subprocess_exec(
        "ping",
        "-c",
        str(PING_COUNT),
        "-t",
        str(PING_DEADLINE),
        ip,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    stdout, _ = await proc.communicate()
    print("STDOUT PING", stdout.decode(errors="ignore"))
    if proc.returncode != 0:
        return PingResult(reachable=False, latencyMs=None)
    match = _RTT_RE.search(stdout.decode(errors="ignore"))
    latency = float(match.group(1)) if match else None
    return PingResult(reachable=True, latencyMs=latency)


@router.post("/ping", response_model=dict[str, PingResult])
async def ping(payload: PingRequest):
    """Check reachability of a batch of hosts, returning latency keyed by IP."""
    # Sanitize: each entry must parse as a real IP address. Anything else is
    # rejected outright, guaranteeing only an IP reaches the ping subprocess.
    validated: list[str] = []
    for raw in payload.ips:
        try:
            validated.append(str(ipaddress.ip_address(raw)))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid IP address: {raw!r}")

    results = await asyncio.gather(*(_ping(ip) for ip in validated))
    return dict(zip(validated, results))
