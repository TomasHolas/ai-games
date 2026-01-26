"""Data models for LLM responses and metrics."""

from pydantic import BaseModel


class LLMMetrics(BaseModel):
    """Metrics collected from LLM API call."""

    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class LLMResponse(BaseModel):
    """Response from LLM including content and metrics."""

    content: str
    metrics: LLMMetrics
    model_name: str
    # Debug info
    thinking: str | None = (
        None  # Captured thinking/reasoning from models that support it
    )
    system_prompt: str | None = None  # System prompt sent to LLM
    user_prompt: str | None = None  # User prompt sent to LLM
