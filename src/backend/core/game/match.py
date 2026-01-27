from typing import List, Callable, Optional
from core.game.base import BaseGame
from core.game.player import Player
from core.llm.models import LLMResponse
from utils.logger import setup_logger

logger = setup_logger(__name__)


class Match:
    def __init__(self, game: BaseGame, players: List[Player], system_prompt: str):
        self.game = game
        self.players = players
        self.system_prompt = system_prompt
        self.current_player_idx = 0
        self.is_running = False

    def _extract_action(self, text: str) -> str:
        """Parses the LLM response to find the action on the last line."""
        if not text:
            return ""

        text = text.strip()
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return ""

        last_line = lines[-1]

        # Check for strict "action :" format
        lower_line = last_line.lower()
        if "action" in lower_line and ":" in lower_line:
            parts = last_line.split(":")
            return parts[-1].strip()

        # Fallback: if no "action :" found, return the last line as is
        return last_line

    def run(self, on_update: Optional[Callable[[dict], None]] = None):
        """
        Runs the game loop.
        :param on_update: Function called on every state change (for Frontend).
        """
        self.is_running = True
        logger.info(f"Match starting: {self.players[0].name} vs {self.players[1].name}")

        turn_count = 0

        # Send initial state
        if on_update:
            self._notify(on_update, turn_count, "Game started")

        while not self.game.is_game_over() and self.is_running:
            current_player = self.players[self.current_player_idx]

            # 1. Notify that player is thinking
            if on_update:
                self._notify(
                    on_update,
                    turn_count,
                    f"{current_player.name} is thinking...",
                    is_thinking=True,
                )

            # 2. Get move
            # Get move from LLM
            state = self.game.get_state_for_player(self.current_player_idx)
            try:
                response: LLMResponse = current_player.get_move(
                    state, self.system_prompt
                )
                move_raw = self._extract_action(response.content)
                metrics = response.metrics

                # Fallback: If no structured thinking found, treat the whole content as thinking
                if (
                    not response.thinking
                    and len(response.content.strip()) > len(move_raw.strip()) + 5
                ):
                    response.thinking = response.content

                # 3. Apply move
                success = self.game.make_move(move_raw, current_player.symbol)

                if success:
                    # Notify BEFORE switching player index to show who acted
                    if on_update:
                        self._notify(
                            on_update,
                            turn_count,
                            f"{current_player.name} played {move_raw}",
                            metrics=metrics,
                            raw_response=response.content,
                            thinking=response.thinking,
                            system_prompt=response.system_prompt,
                            user_prompt=response.user_prompt,
                            active_player_override=current_player,
                        )

                    self.current_player_idx = (self.current_player_idx + 1) % len(
                        self.players
                    )
                    turn_count += 1
                    logger.info(
                        f"Turn {turn_count}: {current_player.name} -> {move_raw}"
                    )

                else:
                    logger.warning(f"Invalid move: {move_raw}")
                    # End game for WebUI to prevent stall
                    if on_update:
                        # The winner is the OTHER player
                        winner_idx = (self.current_player_idx + 1) % len(self.players)
                        winner_name = self.players[winner_idx].name

                        # Send everything even if move is invalid
                        self._notify(
                            on_update,
                            turn_count,
                            f"Invalid move by {current_player.name}. Game over.",
                            force_end=True,
                            metrics=metrics,
                            raw_response=response.content,
                            thinking=response.thinking,
                            system_prompt=response.system_prompt,
                            user_prompt=response.user_prompt,
                            active_player_override=current_player,
                            error_by=current_player.name,
                            winner=winner_name,
                            winner_idx=winner_idx,
                        )
                    return

            except Exception as e:
                if on_update:
                    winner_idx = (self.current_player_idx + 1) % len(self.players)
                    winner_name = self.players[winner_idx].name
                    self._notify(
                        on_update,
                        turn_count,
                        f"System error during turn: {e}",
                        force_end=True,
                        error_by=current_player.name,
                        winner=winner_name,
                        winner_idx=winner_idx,
                    )
                return

        winner_symbol = self.game.get_winner()
        winner_name = None
        winner_idx = None
        if winner_symbol:
            for i, p in enumerate(self.players):
                if p.symbol == winner_symbol:
                    winner_name = p.name
                    winner_idx = i
                    break

        if on_update:
            msg = f"Winner: {winner_name}" if winner_name else "Draw!"
            # Use a dummy system player so the frontend treats this as a system message
            # and doesn't color it with the previous player's color
            system_player = Player(name="System", symbol="S", llm=None)  # type: ignore

            self._notify(
                on_update,
                turn_count,
                msg,
                game_over=True,
                winner=winner_name,
                winner_idx=winner_idx,
                active_player_override=system_player,
            )

    def _notify(
        self,
        callback,
        turn,
        message,
        is_thinking=False,
        game_over=False,
        winner=None,
        force_end=False,
        metrics=None,
        raw_response=None,
        thinking=None,
        system_prompt=None,
        user_prompt=None,
        active_player_override=None,
        error_by=None,
        winner_idx=None,
        **kwargs,
    ):
        current_p = (
            active_player_override
            if active_player_override
            else self.players[self.current_player_idx]
        )

        # Determine symbol based on player index or stored symbol
        # For TTT it's "X"/"O", for Poker it might be irrelevant or we use Name
        current_symbol = current_p.symbol

        # Determine correct player index for frontend coloring
        actual_player_idx = self.current_player_idx
        if active_player_override:
            try:
                actual_player_idx = self.players.index(active_player_override)
            except ValueError:
                # Fallback for system players or custom overrides not in list
                actual_player_idx = -1

        data = {
            "board": self.game.get_board_state(),
            "turn": turn,
            "message": message,
            "current_player": current_p.name,  # ID/Name
            "current_player_idx": actual_player_idx,  # Frontend hook expects current_player_idx!
            "player_index": actual_player_idx,  # Keeping redundancy just in case
            "current_symbol": current_symbol,
            "is_thinking": is_thinking,
            "game_over": game_over or force_end,
            "winner": winner,
            "winner_index": winner_idx,
            "metrics": metrics.dict() if metrics else None,
            "raw_response": raw_response,
            "thinking": thinking,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "error_by": error_by,
        }

        # Merge extra data (like folded_cards)
        data.update(kwargs)

        if game_over or force_end:
            logger.info(
                f"NOTIFY END: game_over={game_over}, force_end={force_end}, winner={winner}"
            )

        callback(data)
