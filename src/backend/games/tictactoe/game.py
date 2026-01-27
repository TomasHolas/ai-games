from core.game.base import BaseGame
from typing import List


class TicTacToe(BaseGame):
    def __init__(self):
        # 3x3 board, empty string is empty spot
        self.board = [[" " for _ in range(3)] for _ in range(3)]
        self.winner = None

    def get_board_state(self) -> List[List[str]]:
        # Return a copy to prevent mutation of history logs
        return [row[:] for row in self.board]

    def _render_board_text(self) -> str:
        lines = ["Current state:"]
        for i, row in enumerate(self.board):
            vis_row = [cell if cell.strip() else "_" for cell in row]
            lines.append(f"- Row {i}: {', '.join(vis_row)}")
        return "\n".join(lines)

    def get_available_moves(self) -> List[tuple]:
        moves = []
        for r in range(3):
            for c in range(3):
                if self.board[r][c] == " ":
                    moves.append((r, c))
        return moves

    def make_move(self, move: str, player_symbol: str) -> bool:
        # Expect format "row,col" e.g. "1,1"
        try:
            import re

            # Find all coordinate-like patterns (num, num) or num,num
            matches = list(re.finditer(r"\(?(\d+)[\s,]+(\d+)\)?", move))

            if not matches:
                return False

            # Take the LAST match
            last_match = matches[-1]
            r, c = int(last_match.group(1)), int(last_match.group(2))

            if 0 <= r < 3 and 0 <= c < 3 and self.board[r][c] == " ":
                self.board[r][c] = player_symbol
                return True
            return False
        except (ValueError, IndexError):
            return False

    def is_game_over(self) -> bool:
        # Check rows, columns and diagonals
        b = self.board

        # Rows and columns
        for i in range(3):
            if b[i][0] == b[i][1] == b[i][2] and b[i][0] != " ":
                self.winner = b[i][0]
                return True
            if b[0][i] == b[1][i] == b[2][i] and b[0][i] != " ":
                self.winner = b[0][i]
                return True

        # Diagonals
        if b[0][0] == b[1][1] == b[2][2] and b[0][0] != " ":
            self.winner = b[0][0]
            return True
        if b[0][2] == b[1][1] == b[2][0] and b[0][2] != " ":
            self.winner = b[0][2]
            return True

        # Draw (full board)
        if not any(" " in row for row in b):
            return True

        return False

    def get_winner(self) -> str | None:
        return self.winner

    def get_state_for_player(self, player_idx: int) -> str:
        symbol = "X" if player_idx == 0 else "O"
        return f"You are playing as symbol: '{symbol}'.\nThis is a standard 3x3 Tic-Tac-Toe.\n\nCurrent game state:\n{self._render_board_text()}\n\nWhat is your next move? Please output coordinates in 'row,col' format (e.g. '1,1' for center)."
