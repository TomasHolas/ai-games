from core.game.match import Match
from core.game.base import BaseGame
from typing import List, Callable, Optional
from core.game.player import Player
from utils.logger import setup_logger
import queue

logger = setup_logger(__name__)


class PokerMatch(Match):
    def __init__(self, game: BaseGame, players: List[Player], system_prompt: str):
        super().__init__(game, players, system_prompt)
        self.command_queue = queue.Queue()

    def process_command(self, cmd: str):
        """Thread-safe method to receive commands from outside (e.g. WebSocket)."""
        logger.info(f"PokerMatch received command: {cmd}")
        self.command_queue.put(cmd)

    def run(self, on_update: Optional[Callable[[dict], None]] = None):
        """
        Runs the poker game loop.
        Overrides Match.run to handle:
        1. Skipping folded/out players
        2. Dynamic turn order (if needed, though standard poker is rotation)
        3. Potentially different end-game conditions
        """
        self.is_running = True
        logger.info(f"Poker Match starting with {len(self.players)} players")

        turn_count = 0

        # IMPORTANT: Sync with game engine's initial player (preflop starts at UTG, not index 0)
        self.current_player_idx = self.game.current_player_idx

        class SystemPlayer:
            name = "System"
            symbol = "SYS"

        # Send initial state
        if on_update:
            self._notify(
                on_update,
                turn_count,
                "Poker Game started",
                active_player_override=SystemPlayer(),
            )

        while not self.game.is_game_over() and self.is_running:
            # Handle manual wait between hands (End Screen pause)
            if hasattr(self.game, "stage") and self.game.stage == "HAND_OVER":
                try:
                    # Non-blocking wait loop to allow checking is_running
                    try:
                        cmd = self.command_queue.get(timeout=0.5)
                        if cmd.strip() == "next":
                            if hasattr(self.game, "start_new_hand"):
                                self.game.start_new_hand()
                                # Re-sync player index after new hand generic setup
                                self.current_player_idx = self.game.current_player_idx

                                if on_update:
                                    # Send system message to clear end-screen overlay
                                    self._notify(
                                        on_update,
                                        turn_count,
                                        "New hand started",
                                        active_player_override=SystemPlayer(),
                                    )
                                continue
                    except queue.Empty:
                        pass
                except Exception as e:
                    logger.error(f"Error processing command: {e}")
                continue

            # Capture stage at start of turn to detect changes later
            current_stage = self.game.stage if hasattr(self.game, "stage") else None

            # IMPORTANT: Always sync with game engine's current player at the start of each iteration.
            # The game engine may have changed the current player (e.g., after stage change in _next_stage).
            # Without this sync, we could skip players after stage transitions.
            self.current_player_idx = self.game.current_player_idx

            # Skip players who are out or folded

            logger.info(
                f"Loop start: current_player_idx={self.current_player_idx}, game.current_player_idx={self.game.current_player_idx}"
            )

            # Using the game engine's state to check player status
            # We assume game.players[i] corresponds to self.players[i]
            # This is a bit tight coupling, but necessary

            # Safety check: Prevent infinite loop if everyone is folded (should be caught by is_game_over)
            loop_count = 0
            while True:
                p_status = self.game.players[self.current_player_idx]["status"]
                if p_status == "active":
                    break

                logger.info(
                    f"Skipping player {self.current_player_idx} (status={p_status})"
                )
                self.current_player_idx = (self.current_player_idx + 1) % len(
                    self.players
                )
                loop_count += 1
                if loop_count > len(self.players):
                    logger.error("Infinite loop in player selection - all folded?")
                    return

            current_player = self.players[self.current_player_idx]
            logger.info(
                f"Selected player: {current_player.name} (idx={self.current_player_idx})"
            )

            # Sync game engine's current player pointer BEFORE notifications
            self.game.current_player_idx = self.current_player_idx

            # 1. Notify that player is thinking
            if on_update:
                self._notify(
                    on_update,
                    turn_count,
                    f"{current_player.name} is thinking...",
                    is_thinking=True,
                )

            # 2. Get move
            state = self.game.get_state_for_player(self.current_player_idx)
            try:
                response = current_player.get_move(state, self.system_prompt)
                move_raw = self._extract_action(response.content)
                metrics = response.metrics

                # Fallback: If no structured thinking found, treat the whole content as thinking
                # This ensures the "Thinking" badge appears if the model outputted text analysis
                if (
                    not response.thinking
                    and len(response.content.strip()) > len(move_raw.strip()) + 10
                ):
                    response.thinking = response.content

                # 3. Apply move
                # Sync game engine's current player pointer to match the loop's pointer
                self.game.current_player_idx = self.current_player_idx

                success = self.game.make_move(move_raw, current_player.symbol)

                if success:
                    # Attach hand cards if folding, so frontend can show what was folded
                    extra_data = {}
                    if "fold" in move_raw.lower():
                        p_data = self.game.players[self.current_player_idx]
                        extra_data["folded_cards"] = [str(c) for c in p_data["hand"]]

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
                            **extra_data,
                        )

                    # Game engine handles turn order - we sync at start of each iteration
                    logger.info(
                        f"After move: game.current_player_idx={self.game.current_player_idx}, stage={self.game.stage}"
                    )
                    turn_count += 1
                    logger.info(
                        f"Turn {turn_count}: {current_player.name} -> {move_raw}"
                    )

                else:
                    # For Poker, invalid move -> Force Fold
                    logger.warning(
                        f"Invalid move: {move_raw} by {current_player.name}. Forcing FOLD."
                    )

                    self.game.force_fold(self.current_player_idx)

                    # Capture folded cards for display even on forced fold
                    folded_cards = []
                    try:
                        p_data = self.game.players[self.current_player_idx]
                        folded_cards = [str(c) for c in p_data["hand"]]
                    except Exception:
                        pass

                    if on_update:
                        self._notify(
                            on_update,
                            turn_count,
                            f"Invalid move '{move_raw}' by {current_player.name}. Forced Fold.",
                            metrics=metrics,
                            raw_response=response.content,
                            thinking=response.thinking,
                            system_prompt=response.system_prompt,
                            user_prompt=response.user_prompt,
                            active_player_override=current_player,
                            error_by=current_player.name,
                            folded_cards=folded_cards,
                        )

                    # Game engine handles turn order after force_fold - we sync at start of each iteration
                    logger.info(
                        f"After force_fold: game.current_player_idx={self.game.current_player_idx}, stage={self.game.stage}"
                    )

                    turn_count += 1

                # Check for stage change to log it clearly
                # This check runs for both successful moves and forced folds
                if hasattr(self.game, "stage") and self.game.stage != current_stage:
                    logger.info(f"Stage changed: {current_stage} -> {self.game.stage}")

                    if self.game.stage == "HAND_OVER":
                        # Hand finished - Send rich report
                        res = getattr(self.game, "last_hand_result", None)
                        logger.info(
                            f"HAND_OVER detected. Result present: {res is not None}"
                        )

                        class SystemPlayer:
                            name = "System"
                            symbol = "SYS"

                        if on_update and res:
                            winner_names = ", ".join(res.get("winners", []))

                            self._notify(
                                on_update,
                                turn_count,
                                f"Hand Finished. Winner: {winner_names} (${res.get('pot', 0)})",
                                active_player_override=SystemPlayer(),
                                hand_result=res,
                                is_hand_summary=True,
                            )
                        elif on_update:
                            self._notify(
                                on_update,
                                turn_count,
                                "--- HAND OVER (No Result Data) ---",
                                active_player_override=SystemPlayer(),
                            )
                    else:
                        # Standard stage change log
                        if on_update:

                            class SystemPlayer:
                                name = "System"
                                symbol = "SYS"

                            self._notify(
                                on_update,
                                turn_count,
                                f"--- {self.game.stage} ---",
                                active_player_override=SystemPlayer(),
                            )

            except Exception as e:
                logger.error(f"Error in poker loop: {e}")
                if on_update:
                    self._notify(on_update, turn_count, f"Error: {e}", force_end=True)
                return

        # End of game
        winner_name = self.game.get_winner()
        winner_idx = self.game.get_winner_idx()
        if on_update:
            self._notify(
                on_update,
                turn_count,
                f"Winner: {winner_name}",
                game_over=True,
                winner=winner_name,
                winner_idx=winner_idx,
            )
