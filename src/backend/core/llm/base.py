from abc import ABC, abstractmethod
from typing import Optional
from core.llm.models import LLMResponse


class BaseLLM(ABC):
    """
    Abstract base class for LLM providers.
    Each provider (Azure Proxy, Gemini) must implement the generate method.
    """

    def __init__(self, model_name: str, api_key: str, api_base: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key
        self.api_base = api_base

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        """
        Send prompt to LLM and return response with metrics.

        Args:
            system_prompt: System context/instructions
            user_prompt: User message/query

        Returns:
            LLMResponse with content and metrics
        """
        pass
