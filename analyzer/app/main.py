"""Android Privacy Auditor - Analyzer Backend Service."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Android Privacy Auditor - Analyzer API",
    description="Static analysis engine and privacy scoring API for Android applications.",
    version="0.1.0",
)

# Configure CORS for local Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """Basic health check endpoint returning service operational status."""
    return {"status": "ok"}
