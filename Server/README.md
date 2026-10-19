# AI Chat API

Minimal Python backend for the AI chat app.

## Run locally

Install the Python dependencies and the root npm development dependency:

```bash
python -m venv Server/.venv
Server/.venv/bin/python -m pip install -r Server/requirements.txt
npm install
npm run dev
```

This starts the Next.js client on <http://localhost:3000> and FastAPI on
<http://localhost:8000>. The client proxies `POST /chat` to FastAPI, so the
browser uses the same origin as the client. Set `CHAT_API_URL` to change the
FastAPI base URL. The health endpoint is available at `/health` and returns:

```json
{"status":"ok"}
```

## Chat with Ollama

Make sure Ollama is running. `POST /chat` accepts the full conversation and an
optional model name. If no model is supplied, the server uses `OLLAMA_MODEL`
(default `llama3.2:latest`). The endpoint streams generated text as
newline-delimited JSON (`application/x-ndjson`), one response chunk per line.

```bash
curl -N -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'
```

Each request sends the ordered conversation history using `user` and
`assistant` roles. The server passes that history to Ollama and streams back
NDJSON records in the shape `{"model":"...","response":"..."}`. Errors
received from Ollama are streamed as `{"error":"..."}`. Set `OLLAMA_MODEL`
to select a different default model or `OLLAMA_URL` if Ollama is listening
somewhere other than `http://localhost:11434`.
