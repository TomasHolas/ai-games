from core.llm.models import LLMResponse
from core.llm.base import BaseLLM


class Player:
    """
    Represents an AI player interacting with the game via an LLM.
    Wrapper around the LLM to handle game-specific prompting and state.
    """

    def __init__(self, name: str, symbol: str, llm: BaseLLM):
        """
        Initialize the Player.

        Args:
            name (str): Display name of the player (e.g., "GPT-4").
            symbol (str): Symbol representing the player on the board (e.g., "X", "O").
            llm (BaseLLM): The LLM instance driving this player's decisions.
        """
        self.name = name
        self.symbol = symbol  # e.g., 'X' or 'O'
        self.llm = llm

    def get_move(self, game_state: str, system_prompt: str) -> LLMResponse:
        """
        Ask LLM for next move based on game state.

        Args:
            game_state (str): The current state of the game derived from get_state_for_player.
            system_prompt (str): The system prompt defining the game rules and persona.

        Returns:
            LLMResponse: The full response from the LLM, including content and metrics.
        """
        # Prompt for LLM to know who they are and what to do
        # We rely on the Game class to construct the full user prompt (identity + state + instructions)
        user_prompt = game_state

        response: LLMResponse = self.llm.generate(system_prompt, user_prompt)
        return response
