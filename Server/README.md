# AI Chat API

Minimal Python backend for the AI chat app.

## Run locally

```bash
cd Server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The health endpoint is available at <http://localhost:8000/health> and returns:

```json
{"status":"ok"}
```
