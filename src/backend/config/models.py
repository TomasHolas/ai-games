"""
Centralized model configuration for AI Games.
This is the single source of truth for available models.
"""

from typing import List, TypedDict


class ModelConfig(TypedDict):
    """Model configuration type."""

    id: str
    name: str
    provider: str
    enabled: bool


# === AVAILABLE MODELS ===
# All models available through the LLM Proxy and native integrations

MODELS: List[ModelConfig] = [
    {"id": "human", "name": "Human", "provider": "User", "enabled": True},
    # Azure OpenAI Models / Proxy (Verified)
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "Azure", "enabled": True},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "Azure", "enabled": True},
    {"id": "gpt-4.1", "name": "GPT-4.1", "provider": "Azure", "enabled": True},
    {
        "id": "gpt-4.1-mini",
        "name": "GPT-4.1 Mini",
        "provider": "Azure",
        "enabled": True,
    },
    {
        "id": "gpt-4.1-nano",
        "name": "GPT-4.1 Nano",
        "provider": "Azure",
        "enabled": True,
    },
    {"id": "gpt-5", "name": "GPT-5 (Preview)", "provider": "Azure", "enabled": True},
    {
        "id": "gpt-5-mini",
        "name": "GPT-5 Mini (Preview)",
        "provider": "Azure",
        "enabled": True,
    },
    # Reasoning Models
    {"id": "o3-mini", "name": "o3 Mini", "provider": "Azure", "enabled": True},
    {"id": "o4-mini", "name": "o4 Mini", "provider": "Azure", "enabled": True},
    # Phi Series
    {"id": "phi4", "name": "Phi-4", "provider": "Azure", "enabled": True},
    {"id": "phi4-mini", "name": "Phi-4 Mini", "provider": "Azure", "enabled": True},
    {
        "id": "phi4-multi",
        "name": "Phi-4 Multimodal",
        "provider": "Azure",
        "enabled": True,
    },
    # Bedrock Models (via Azure Proxy)
    {
        "id": "bedrock-claude-3-5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    {
        "id": "bedrock-claude-3-7-sonnet",
        "name": "Claude 3.7 Sonnet",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    {
        "id": "bedrock-claude-haiku-4.5",
        "name": "Claude Haiku 4.5",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    {
        "id": "bedrock-claude-opus-4.5",
        "name": "Claude Opus 4.5",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    {
        "id": "bedrock-claude-sonnet-4",
        "name": "Claude Sonnet 4",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    {
        "id": "bedrock-claude-sonnet-4.5",
        "name": "Claude Sonnet 4.5",
        "provider": "Azure Proxy",
        "enabled": True,
    },
    # Google Gemini Models (Native Verified)
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "Google",
        "enabled": True,
    },
    {
        "id": "gemini-2.5-flash-lite",
        "name": "Gemini 2.5 Flash Lite",
        "provider": "Google",
        "enabled": True,
    },
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash (Preview)",
        "provider": "Google",
        "enabled": True,
    },
]


def get_enabled_models() -> List[ModelConfig]:
    """Returns list of enabled models."""
    return [m for m in MODELS if m["enabled"]]


def get_model_by_id(model_id: str) -> ModelConfig | None:
    """Returns model config by ID or None if not found."""
    return next((m for m in MODELS if m["id"] == model_id), None)


def get_models_by_provider(provider: str) -> List[ModelConfig]:
    """Returns list of models for a given provider."""
    return [m for m in MODELS if m["provider"] == provider and m["enabled"]]


def is_gemini_model(model_id: str) -> bool:
    """Check if model is a Google Gemini model (uses native API)."""
    # Better logic: Check provider field in configuration
    model = get_model_by_id(model_id)
    if model:
        return model["provider"] == "Google"
    # Fallback for unknown models (e.g. from tests)
    return model_id.startswith("gemini") or model_id.startswith("gemma")
