from openai import OpenAI
from core.llm.base import BaseLLM
from core.llm.models import LLMResponse, LLMMetrics
from config.settings import settings
import logging
import time

logger = logging.getLogger(__name__)


class ProxyLLM(BaseLLM):
    """
    Universal connector for your LLM Proxy.
    Can call GPT-5, Claude 3.7, Phi-4 etc. via OpenAI-compatible interface.
    """

    def __init__(self, model_name: str):
        super().__init__(model_name, settings.OPENAI_API_KEY, settings.OPENAI_BASE_URL)

        if not self.api_key or not self.api_base:
            raise ValueError("Missing OpenAI API Key or Base URL in configuration.")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.api_base,
        )

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        start_time = time.time()
        try:
            # Prepare arguments
            kwargs = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            }

            # O1/O3 models often don't support temperature
            # Check if model starts with o1- or o3-
            if not (
                self.model_name.startswith("o1-") or self.model_name.startswith("o3-")
            ):
                kwargs["temperature"] = 0.7

            response = self.client.chat.completions.create(**kwargs)

            # Helper to safely get usage
            def get_usage_attr(usage, attr):
                return getattr(usage, attr, 0) if usage else 0

            # Calculate metrics
            latency = (time.time() - start_time) * 1000  # ms
            usage = response.usage
            prompt_tokens = get_usage_attr(usage, "prompt_tokens")
            completion_tokens = get_usage_attr(usage, "completion_tokens")
            total_tokens = get_usage_attr(usage, "total_tokens")

            metrics = LLMMetrics(
                latency_ms=latency,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )

            # Extract content and thinking blocks
            message = response.choices[0].message
            content = message.content or ""
            thinking = None

            # 1. Try to capture thinking/reasoning if available from API natively
            if hasattr(message, "reasoning") and message.reasoning:
                thinking = message.reasoning
            elif hasattr(message, "content_blocks"):
                for block in message.content_blocks:
                    if getattr(block, "type", None) == "thinking":
                        thinking = getattr(block, "thinking", None)
                    elif getattr(block, "type", None) == "text":
                        content = getattr(block, "text", content)

            # 2. Heuristic extraction REMOVED.
            # We rely on Match._extract_action to parse the move from the full content.
            # This preserves the full raw response for debugging.

            return LLMResponse(
                content=content,
                metrics=metrics,
                model_name=self.model_name,
                thinking=thinking,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )

        except Exception as e:
            logger.error(
                f"Error generating response from Proxy ({self.model_name}): {e}"
            )
            # Return error response
            return LLMResponse(
                content=f"ERROR: {str(e)}",
                metrics=LLMMetrics(
                    latency_ms=0,
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0,
                ),
                model_name=self.model_name,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
