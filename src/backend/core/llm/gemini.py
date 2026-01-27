from google import genai
from google.genai import types
from core.llm.base import BaseLLM
from core.llm.models import LLMResponse, LLMMetrics
from config.settings import settings
import logging
import time

logger = logging.getLogger(__name__)


class GeminiLLM(BaseLLM):
    """
    Implementation of LLM for Google Gemini using the new `google-genai` SDK.
    """

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        super().__init__(model_name, settings.GEMINI_API_KEY or "")

        if not self.api_key:
            logger.warning("Missing Gemini API Key in configuration.")
            self.client = None
        else:
            # New SDK Initialization
            self.client = genai.Client(api_key=self.api_key)

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        start_time = time.time()

        if not self.client:
            return LLMResponse(
                content="ERROR: Missing Gemini API Key.",
                metrics=LLMMetrics(
                    latency_ms=0, prompt_tokens=0, completion_tokens=0, total_tokens=0
                ),
                model_name=self.model_name,
            )

        try:
            full_prompt = f"{system_prompt}\n\nUser Task: {user_prompt}"

            # Safety settings (Updated for new SDK if needed, though defaults are often fine for games)
            # In the new SDK, config is passed differently.
            # Using basic config to disable blocking if possible.
            # Note: The new SDK types structure is different.

            # Simplified safety config with type ignores as the SDK types are strict Enums
            # and we want to pass strings or would need to import exact Enums which might vary by version.
            config = types.GenerateContentConfig(
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_HARASSMENT",  # type: ignore
                        threshold="BLOCK_NONE",  # type: ignore
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HATE_SPEECH",  # type: ignore
                        threshold="BLOCK_NONE",  # type: ignore
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_SEXUALLY_EXPLICIT",  # type: ignore
                        threshold="BLOCK_NONE",  # type: ignore
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",  # type: ignore
                        threshold="BLOCK_NONE",  # type: ignore
                    ),
                ]
            )

            # --- GENERATION ---
            # Handling "models/" prefix logic inside the call
            target_model = self.model_name

            # Simple retry logic for 404s/naming
            try:
                response = self.client.models.generate_content(
                    model=target_model, contents=full_prompt, config=config
                )
            except Exception as e:
                # Retry with models/ prefix if missing
                if "404" in str(e) and "models/" not in target_model:
                    target_model = f"models/{self.model_name}"
                    logger.info(f"Retrying with {target_model}")
                    response = self.client.models.generate_content(
                        model=target_model, contents=full_prompt, config=config
                    )
                else:
                    raise e
            # ------------------

            content = response.text or ""

            latency = (time.time() - start_time) * 1000

            # Extract usage if available
            prompt_tokens = 0
            completion_tokens = 0
            total_tokens = 0

            # Usage metadata access might vary in new SDK, checking extraction
            if response.usage_metadata:
                prompt_tokens = response.usage_metadata.prompt_token_count or 0
                completion_tokens = response.usage_metadata.candidates_token_count or 0
                total_tokens = response.usage_metadata.total_token_count or 0

            metrics = LLMMetrics(
                latency_ms=latency,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )

            return LLMResponse(
                content=content,
                metrics=metrics,
                model_name=self.model_name,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )

        except Exception as e:
            logger.error(
                f"Error generating response from Gemini ({self.model_name}): {e}"
            )

            # Provide helpful error message to UI
            msg = str(e)
            if "404" in msg:
                msg += " (Model not found. Check availability in your Google AI Studio region)"
            if "API_KEY" in msg or "403" in msg:
                msg += " (Check your Google API Key)"

            return LLMResponse(
                content=f"ERROR: {msg}",
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
