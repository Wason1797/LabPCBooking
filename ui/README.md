# PC Lab Booking — UI

Admin console for booking the PCs in a computer lab. An admin picks a day, sees a
matrix of **computers (rows) × hours (columns)**, and creates bookings by
drag-selecting free hours. Bookings record the student's name, email, project
name, and the booked time. Multi-day ("extended") bookings are supported.

This is a **front-end-only** build: the API is mocked with static JSON files and
an in-memory store (no backend, no auth yet).

## Tech stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check (tsc) + production build
npm run lint     # eslint
```

## Architecture (Atomic Design)

```
src/
  api/          types.ts, mockApi.ts (JSON fetch + in-memory store)
  utils/        time.ts (24 hour slots, overlap helpers), date.ts
  hooks/        useBookings (data), useDragSelection (drag-to-select)
  components/
    atoms/        Button, Input, Label, Select, Badge, Spinner, Modal
    molecules/    FormField, MatrixCell, Legend, CalendarDay, DateRangeSelect
    organisms/    Calendar, BookingMatrix, BookingFormModal
    templates/    BookingLayout
    pages/        BookingPage
```

## Mock data

Edit the JSON files in `public/mock/` — no code changes needed:

- `computers.json` — the lab's PCs (one object per row in the matrix). Add/remove
  entries to change the number of computers.
- `bookings.json` — seed bookings. Each has `startDate`/`endDate` (equal for
  single-day, a range for extended), and `startHour`/`endHour` (0–24, end
  exclusive).

New bookings created in the UI live in memory for the session and reset on reload.

## Conventions

- Hour columns come from a single source: `utils/time.ts#HOURS` (00:00–24:00).
- All data access goes through `api/mockApi.ts`, so swapping in a real backend is
  a one-file change.
- Booking/slot overlap logic lives in `utils/time.ts` and is reused by both the
  matrix rendering and the drag-selection guard.
