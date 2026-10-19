import json
import os
from collections.abc import AsyncIterator
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.responses import StreamingResponse

app = FastAPI(title="AI Chat API")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    model: str | None = None


async def get_model(client: httpx.AsyncClient, requested_model: str | None) -> str:
    if requested_model:
        return requested_model
    if OLLAMA_MODEL:
        return OLLAMA_MODEL

    try:
        response = await client.get(f"{OLLAMA_URL}/api/tags")
        response.raise_for_status()
        models = response.json().get("models", [])
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Could not connect to Ollama") from exc

    if not models:
        raise HTTPException(status_code=503, detail="No Ollama models are installed")
    return models[0]["name"]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    client = httpx.AsyncClient(timeout=None)
    try:
        model = await get_model(client, request.model)
    except Exception:
        await client.aclose()
        raise

    async def stream_response() -> AsyncIterator[str]:
        try:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": model,
                    "messages": [
                        {"role": message.role, "content": message.content}
                        for message in request.messages
                    ],
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield json.dumps({"model": model, "response": content}) + "\n"
                    if chunk.get("done"):
                        break
        except httpx.HTTPError:
            yield json.dumps({"error": "Ollama could not generate a response"}) + "\n"
        finally:
            await client.aclose()

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")
