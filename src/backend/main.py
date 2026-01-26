"""
AI Games - CLI Entry Point
Run a quick match between two LLM players.
"""

from core.llm.proxy import ProxyLLM
from core.llm.gemini import GeminiLLM
from core.game.player import Player
from core.game.match import Match
from games.tictactoe.game import TicTacToe
from games.tictactoe.prompt import PROMPT_TICTACTOE
from config.models import is_gemini_model


def get_llm_instance(model_name: str):
    """Factory function to get appropriate LLM instance based on model name."""
    if is_gemini_model(model_name):
        return GeminiLLM(model_name=model_name)
    return ProxyLLM(model_name=model_name)


def main():
    print("🤖 Welcome to AI Games: Battle of Titans! 🤖")

    # 1. Game setup
    game = TicTacToe()

    # 2. Select gladiators
    model_name_1 = "gpt-4o"  # Player 1 (X)
    model_name_2 = "gemini-1.5-flash"  # Player 2 (O)

    print(f"⚔️  Today's match: {model_name_1} vs {model_name_2}")

    try:
        # Player 1
        llm1 = get_llm_instance(model_name_1)
        p1 = Player(name=model_name_1, symbol="X", llm=llm1)

        # Player 2
        llm2 = get_llm_instance(model_name_2)
        p2 = Player(name=model_name_2, symbol="O", llm=llm2)

    except Exception as e:
        print(f"❌ Error initializing models: {e}")
        return

    # 3. Start match
    match = Match(game=game, players=[p1, p2], system_prompt=PROMPT_TICTACTOE)
    match.run()


if __name__ == "__main__":
    main()
