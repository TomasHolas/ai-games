from abc import ABC, abstractmethod
from typing import List, Any


class BaseGame(ABC):
    """
    Abstract base class for all game implementations.
    Defines the standard interface that the Match engine uses to interact with games.
    """

    @abstractmethod
    def get_board_state(self) -> Any:
        """
        Retrieve the current public state of the game board.

        Returns:
            Any: A representation of the board state. Can be a string (for simple text games)
                 or a dictionary (for rich UI applications).
        """
        pass

    @abstractmethod
    def get_available_moves(self) -> List[Any]:
        """
        Get a list of currently valid moves.

        Returns:
            List[Any]: A list of legal moves available in the current state.
        """
        pass

    @abstractmethod
    def make_move(self, move: Any, player_symbol: str) -> bool:
        """
        Attempt to execute a move for a specific player.

        Args:
            move (Any): The move to attempt (format depends on the game).
            player_symbol (str): The identifier of the player making the move.

        Returns:
            bool: True if the move was valid and successfully executed, False otherwise.
        """
        pass

    @abstractmethod
    def is_game_over(self) -> bool:
        """
        Check if the game has reached a terminal state.

        Returns:
            bool: True if the game has ended (win, loss, or draw), False otherwise.
        """
        pass

    @abstractmethod
    def get_winner(self) -> str | None:
        """
        Get the winner of the game if it is over.

        Returns:
            str | None: The symbol/name of the winning player, or None if the game
                        is a draw or still in progress.
        """
        pass

    def get_state_for_player(self, player_idx: int) -> str:
        """
        Get the game state viewed from the perspective of a specific player.
        This allows for imperfect information games (like Poker).

        Args:
            player_idx (int): The index of the viewing player.

        Returns:
            str: A text description of the game state tailored for the LLM player.
        """
        return self.get_board_state()
