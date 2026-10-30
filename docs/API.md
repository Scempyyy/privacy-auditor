# Analyzer API

Run from `analyzer/` with the pinned dependencies installed:

```sh
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

```sh
curl http://127.0.0.1:8000/health
```

Analyze an APK. `category` must match a key in `data/categories.json` (`utility`, `camera`, `navigation`, `social`, `finance`, `weather`, `photo_video`, or `messaging`). Maximum APK size is 100 MiB.

```sh
curl -F 'file=@base.apk' -F 'category=utility' \
  http://127.0.0.1:8000/api/v1/analyze
```

The response is JSON validated by the API's strict Pydantic schema. Its top level contains `scan_id`, package and version metadata, `category`, permission findings, tracker findings, security findings, `score`, `grade`, itemized `deductions`, permission `revoke_steps`, and analysis `limitations`. Unknown permission names are returned with `risk` and classification `Unknown` and receive no permission penalty.

Invalid APKs return HTTP 400; unsupported categories return HTTP 422; oversized request bodies return HTTP 413. Errors use `{"detail":"..."}`. The current curated tracker file is empty, so no tracker matches are reported until verified signatures and attribution are added.
