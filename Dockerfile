# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend-react
COPY frontend-react/package.json frontend-react/package-lock.json* ./
RUN npm install
COPY frontend-react/ ./
RUN npm run build

# Stage 2: Build the Python backend and assemble
FROM python:3.12-slim
RUN pip install --no-cache-dir uv==0.8.13
WORKDIR /code
COPY ./pyproject.toml ./README.md ./uv.lock* ./
COPY ./app ./app
# Copy the built frontend into the expected directory structure
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react/dist
RUN uv sync --frozen

ARG COMMIT_SHA=""
ENV COMMIT_SHA=${COMMIT_SHA}

ARG AGENT_VERSION=0.0.0
ENV AGENT_VERSION=${AGENT_VERSION}

# Make sure SQLite db can be written to.
# Running as root for simplicity in this container or creating a mount point.
VOLUME ["/code/data"]
# Set an env var or just expect the db at /code/business_os.db which is mapped via volume

EXPOSE 8080
CMD ["uv", "run", "uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]
