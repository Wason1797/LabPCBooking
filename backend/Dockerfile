FROM python:3.13-slim

WORKDIR /app

# iputils-ping provides the `ping` binary used by the /ping endpoint; it isn't
# included in the slim base image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends iputils-ping \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry && poetry config virtualenvs.create false

# Install dependencies first for better layer caching.
COPY pyproject.toml ./
RUN poetry install --no-root --no-interaction --no-ansi

COPY app ./app
COPY alembic.ini ./
COPY migrations ./migrations

EXPOSE 8000
# Apply migrations to bring the schema up to date, then serve the API.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
