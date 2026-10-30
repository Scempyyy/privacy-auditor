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
                   allow_headers=["*"])


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

import hashlib
import tempfile
from pathlib import Path
from app.models import RadarComparisonReport, PassportVerifyRequest, PassportVerifyResponse
from app.radar import compare_apks
from app.passport import verify_passport

MAX_COMPARE_BYTES = 150 * 1024 * 1024  # 150 MB combined budget for two APKs


@app.post("/api/v1/compare", response_model=RadarComparisonReport)
async def compare_apk_versions(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
    category: str = Form(...),
) -> RadarComparisonReport:
    """Compares privacy and security posture between two versions of an application."""
    knowledge = load_knowledge()
    if category not in knowledge["categories"]:
        await old_file.close()
        await new_file.close()
        raise HTTPException(status_code=422, detail="Unsupported application category")

    try:
        with tempfile.TemporaryDirectory(prefix="privacy-radar-") as temp_dir:
            temp_path = Path(temp_dir)
            old_path = temp_path / "old_version.apk"
            new_path = temp_path / "new_version.apk"

            total_size = 0
            old_hasher = hashlib.sha256()
            new_hasher = hashlib.sha256()

            # Stream old_file
            with old_path.open("wb") as f:
                while chunk := await old_file.read(1024 * 1024):
                    total_size += len(chunk)
                    if total_size > MAX_COMPARE_BYTES:
                        raise HTTPException(status_code=413, detail="Combined comparison upload exceeds the 150 MB limit")
                    old_hasher.update(chunk)
                    f.write(chunk)

            # Stream new_file
            with new_path.open("wb") as f:
                while chunk := await new_file.read(1024 * 1024):
                    total_size += len(chunk)
                    if total_size > MAX_COMPARE_BYTES:
                        raise HTTPException(status_code=413, detail="Combined comparison upload exceeds the 150 MB limit")
                    new_hasher.update(chunk)
                    f.write(chunk)

            if old_path.stat().st_size == 0 or new_path.stat().st_size == 0:
                raise HTTPException(status_code=400, detail="One or both uploaded comparison APKs are empty")

            old_sha256 = old_hasher.hexdigest()
            new_sha256 = new_hasher.hexdigest()

            try:
                return compare_apks(
                    old_path=old_path,
                    new_path=new_path,
                    category=category,
                    knowledge=knowledge,
                    old_sha256=old_sha256,
                    new_sha256=new_sha256,
                )
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve)) from ve
            except InvalidApk as iae:
                raise HTTPException(status_code=400, detail=str(iae)) from iae
            except Exception as exc:
                logger.exception("Unexpected error in radar comparison")
                raise HTTPException(status_code=500, detail="Comparison analysis failed") from exc

    finally:
        await old_file.close()
        await new_file.close()


@app.post("/api/v1/passport/verify", response_model=PassportVerifyResponse)
async def verify_privacy_passport(request: PassportVerifyRequest) -> PassportVerifyResponse:
    """Cryptographically verifies a Privacy Passport JSON payload without requiring the original APK."""
    try:
        return verify_passport(request.passport)
    except Exception as exc:
        logger.exception("Passport verification failed")
        raise HTTPException(status_code=400, detail=f"Invalid passport structure: {exc}") from exc


from app.benchmark import run_benchmark_evaluation
from app.sandbox import check_sandbox_availability
from app.models import BenchmarkSuiteReport, DynamicSandboxStatusReport


@app.get("/api/v1/benchmark", response_model=BenchmarkSuiteReport)
def get_benchmark_report() -> BenchmarkSuiteReport:
    """Returns the ground-truth benchmark evaluation results across all 5 test APK scenarios."""
    return run_benchmark_evaluation()


@app.get("/api/v1/sandbox/status", response_model=DynamicSandboxStatusReport)
def get_sandbox_status() -> DynamicSandboxStatusReport:
    """Probes the environment and returns the availability, device status, and safety controls of the dynamic sandbox."""
    return check_sandbox_availability()

