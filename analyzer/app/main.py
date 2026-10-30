"""FastAPI application for static Android APK auditing."""
import logging

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

from app.analyzer import MAX_UPLOAD_BYTES, InvalidApk, analyze_upload
from app.knowledge import load_knowledge
from app.models import AnalysisReport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Android Privacy Auditor - Analyzer API",
              description="Static analysis engine and privacy scoring API for Android applications.", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                   allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["Content-Type"])


class OversizedRequest(Exception):
    """Request body exceeded the multipart budget."""


@app.middleware("http")
async def reject_oversized_request(request: Request, call_next: RequestResponseEndpoint) -> Response:
    """Reject declared oversized bodies before multipart parsing allocates storage."""
    if request.url.path == "/api/v1/analyze":
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > MAX_UPLOAD_BYTES + 1024 * 1024:
                    return JSONResponse(status_code=413, content={"detail": "APK exceeds the 100 MB upload limit"})
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header"})
    if request.url.path != "/api/v1/analyze":
        return await call_next(request)
    received = 0
    original_receive = request.receive

    async def bounded_receive() -> dict[str, object]:
        nonlocal received
        message = await original_receive()
        if message["type"] == "http.request":
            body = message.get("body", b"")
            received += len(body) if isinstance(body, bytes) else 0
            if received > MAX_UPLOAD_BYTES + 1024 * 1024:
                raise OversizedRequest
        return message

    request = Request(request.scope, receive=bounded_receive)
    try:
        return await call_next(request)
    except OversizedRequest:
        return JSONResponse(status_code=413, content={"detail": "APK exceeds the 100 MB upload limit"})


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/analyze", response_model=AnalysisReport)
async def analyze_apk(file: UploadFile = File(...), category: str = Form(...)) -> AnalysisReport:
    """Inspect uploaded APK bytes without installing or executing the package."""
    knowledge = load_knowledge()
    if category not in knowledge["categories"]:
        await file.close()
        raise HTTPException(status_code=422, detail="Unsupported application category")
    try:
        return await analyze_upload(file, category)
    except InvalidApk as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected APK analysis failure")
        raise HTTPException(status_code=500, detail="APK analysis failed") from exc
