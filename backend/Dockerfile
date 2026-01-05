FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 compilation if using the non-binary version, though binary is often easier for dev)
# libpq-dev is good for postgres
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Command is handled by docker-compose, but good to have a default
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
