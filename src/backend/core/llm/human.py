import threading
from core.llm.base import BaseLLM
from core.llm.models import LLMResponse, LLMMetrics


class HumanLLM(BaseLLM):
    """
    Special LLM provider that waits for human input from the frontend.
    """

    def __init__(self, model_name: str = "human"):
        # Human player doesn't need API keys
        super().__init__(model_name=model_name, api_key="none")
        self.move_event = threading.Event()
        self.next_move = None

    def set_move(self, move: str):
        """Called by the API/WebSocket layer when a human move is received."""
        self.next_move = move
        self.move_event.set()

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        """
        Wait for human input.
        """
        # Clear previous state
        self.move_event.clear()
        self.next_move = None

        # Wait for move from WebSocket (blocking call in the game thread)
        # We wait up to 5 minutes for a human move
        self.move_event.wait(timeout=300)

        move = self.next_move or ""

        return LLMResponse(
            content=move,
            metrics=LLMMetrics(
                latency_ms=0, prompt_tokens=0, completion_tokens=0, total_tokens=0
            ),
            model_name=self.model_name,
            thinking="",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
