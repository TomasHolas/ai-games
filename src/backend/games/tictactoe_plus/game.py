from core.game.base import BaseGame
from typing import List


class TicTacToePlus(BaseGame):
    def __init__(self):
        # 9x9 board, empty string is empty spot
        self.size = 9
        self.win_condition = 5
        self.board = [[" " for _ in range(self.size)] for _ in range(self.size)]
        self.winner = None

    def get_board_state(self) -> List[List[str]]:
        return self.board

    def _render_board_text(self) -> str:
        lines = ["Current state (9x9 grid, coordinates 0-8):"]
        # Add column header
        lines.append("    " + " ".join(str(i) for i in range(self.size)))
        for i, row in enumerate(self.board):
            vis_row = [cell if cell.strip() else "_" for cell in row]
            lines.append(f"Row {i}: {' '.join(vis_row)}")
        return "\n".join(lines)

    def get_available_moves(self) -> List[tuple]:
        moves = []
        for r in range(self.size):
            for c in range(self.size):
                if self.board[r][c] == " ":
                    moves.append((r, c))
        return moves

    def make_move(self, move: str, player_symbol: str) -> bool:
        # Expect format "row,col" e.g. "4,4"
        try:
            import re

            # Find all coordinate-like patterns (num, num) or num,num
            matches = list(re.finditer(r"\(?(\d+)[\s,]+(\d+)\)?", move))

            if not matches:
                return False

            # Take the LAST match, as models often think first then say the move at the end
            last_match = matches[-1]
            r, c = int(last_match.group(1)), int(last_match.group(2))

            if 0 <= r < self.size and 0 <= c < self.size and self.board[r][c] == " ":
                self.board[r][c] = player_symbol
                return True

            # If rejected, log why (internal log)
            return False
        except (ValueError, IndexError):
            return False

    def is_game_over(self) -> bool:
        # Check rows, columns and diagonals for 5 in a row
        b = self.board
        s = self.size
        w = self.win_condition

        for r in range(s):
            for c in range(s):
                if b[r][c] == " ":
                    continue

                symbol = b[r][c]

                # Check horizontal
                if c <= s - w:
                    if all(b[r][c + i] == symbol for i in range(w)):
                        self.winner = symbol
                        return True

                # Check vertical
                if r <= s - w:
                    if all(b[r + i][c] == symbol for i in range(w)):
                        self.winner = symbol
                        return True

                # Check diagonal (\)
                if r <= s - w and c <= s - w:
                    if all(b[r + i][c + i] == symbol for i in range(w)):
                        self.winner = symbol
                        return True

                # Check anti-diagonal (/)
                if r >= w - 1 and c <= s - w:
                    if all(b[r - i][c + i] == symbol for i in range(w)):
                        self.winner = symbol
                        return True

        # Draw (full board)
        if not any(" " in row for row in b):
            return True

        return False

    def get_winner(self) -> str | None:
        return self.winner

    def get_state_for_player(self, player_idx: int) -> str:
        symbol = "X" if player_idx == 0 else "O"
        return f"You are playing as symbol: '{symbol}'.\nThis is a 9x9 Tic-Tac-Toe Plus (Connect 5).\n\n{self._render_board_text()}\n\nWhat is your next move? Please output coordinates in 'row,col' format."
