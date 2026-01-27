import random
from typing import List, Dict, Any
from core.game.base import BaseGame
from .card import Card
from .deck import Deck
from .evaluator import evaluate_hand, HandStrength
from core.constants import PLAYER_COLOR_NAMES

# Game Stages
PREFLOP = "PREFLOP"
FLOP = "FLOP"
TURN = "TURN"
RIVER = "RIVER"
SHOWDOWN = "SHOWDOWN"
HAND_OVER = "HAND_OVER"


class PokerGame(BaseGame):
    """
    Implements a simplified No-Limit Texas Hold'em Poker game logic.
    Manages the deck, community cards, player states, betting rounds, and hand evaluation.
    """

    def __init__(self, player_names: List[str], starting_chips: int = 1000):
        """
        Initialize the Poker game.

        Args:
            player_names (List[str]): List of player names participating in the game.
            starting_chips (int): Initial chip count for each player. Defaults to 1000.
        """
        self.player_names = player_names
        self.starting_chips = starting_chips
        self.deck = Deck()
        self.community_cards: List[Card] = []
        self.pot = 0
        
        # Randomize starting dealer position
        # We set it effectively to (Target - 1) so that the first call to start_new_hand()
        # (which increments dealer_idx) lands exactly on our random Target.
        target_dealer = random.randint(0, len(player_names) - 1)
        self.dealer_idx = (target_dealer - 1) % len(player_names)
        
        self.current_player_idx = 0
        self.stage = PREFLOP
        self.wins = {name: 0 for name in player_names}

        # Player State: index -> dict
        # keys: name, chips, hand, status ('active', 'folded', 'allin'), current_round_bet, total_bet, has_acted, final_hand_rank
        self.players: List[Dict[str, Any]] = []
        self._init_players()

        self.small_blind = 25
        self.big_blind = 50
        self.min_raise = 50
        self.last_raiser_idx = -1  # Track who made the last aggressive action

        self.start_new_hand()

    def _init_players(self):
        """
        Reset player structures for a completely new game session.
        """
        self.players = []
        for name in self.player_names:
            self.players.append(
                {
                    "name": name,
                    "chips": self.starting_chips,
                    "hand": [],
                    "status": "active",
                    "current_round_bet": 0,
                    "total_bet": 0,
                    "has_acted": False,
                }
            )

    def start_new_hand(self):
        """
        Prepare the game state for a new hand.
        Resets deck, community cards, pot, stage, and player round statuses.
        Moves the dealer button and posts blinds.
        """
        self.deck.reset()
        self.community_cards = []
        self.pot = 0
        self.stage = PREFLOP
        self.last_hand_result = None

        # Rotation
        self.dealer_idx = (self.dealer_idx + 1) % len(self.players)

        # Reset player round states
        for p in self.players:
            if p["chips"] > 0 and not p.get("is_eliminated"):
                p["status"] = "active"
                p["hand"] = self.deck.deal(2)
                p["current_round_bet"] = 0
                p["total_bet"] = 0
                p["has_acted"] = False
                if "final_hand_rank" in p:
                    del p["final_hand_rank"]
            else:
                p["status"] = "out"
                p["hand"] = []

        # Helper to find next active player
        def get_next_active(start_idx):
            for i in range(1, len(self.players) + 1):
                idx = (start_idx + i) % len(self.players)
                if self.players[idx]["status"] == "active":
                    return idx
            return start_idx

        # Calculate Blinds Indices (skipping out/eliminated players)
        # Assuming at least 2 active players
        sb_idx = get_next_active(self.dealer_idx)
        bb_idx = get_next_active(sb_idx)

        print(f"[GAME] Posting Blinds: Dealer={self.dealer_idx}, SB={sb_idx}, BB={bb_idx}")

        self._post_blind(sb_idx, self.small_blind)
        self._post_blind(bb_idx, self.big_blind)

        # Action starts after BB (UTG)
        start_offset = get_next_active(bb_idx) # Actually UTG is the one AFTER BB
        
        # Find first active player starting from UTG
        for i in range(len(self.players)):
            idx = (start_offset + i) % len(self.players)
            if self.players[idx]["status"] == "active":
                self.current_player_idx = idx
                break

        print(f"[GAME] Hand Started. Current Player: {self.current_player_idx} (UTG)")
        self.last_raiser_idx = bb_idx
        self.min_raise = self.big_blind

    def eliminate_player(self, player_idx: int):
        """
        Permanently remove a player from the game (e.g. due to API rate limits).
        Treats them as folded for the current hand and marks them to stay 'out' in future hands.
        """
        p = self.players[player_idx]
        p["status"] = "folded"
        p["is_eliminated"] = True
        
        # Advance to next active player to keep game moving
        # Need to be careful not to create infinite loop if everyone eliminated
        for i in range(1, len(self.players) + 1):
            next_idx = (player_idx + i) % len(self.players)
            if self.players[next_idx]["status"] == "active":
                self.current_player_idx = next_idx
                break
                
        self._check_round_completion()

        self.last_raiser_idx = bb_idx
        self.min_raise = self.big_blind

    def _post_blind(self, player_idx: int, amount: int):
        """
        Post a blind bet for a specific player.
        Updates player's chips, current bet, and the pot.

        Args:
            player_idx (int): Index of the player posting the blind.
            amount (int): Amount of the blind (Small Blind or Big Blind).
        """
        player = self.players[player_idx]
        actual_bet = min(player["chips"], amount)
        player["chips"] -= actual_bet
        player["current_round_bet"] += actual_bet
        player["total_bet"] += actual_bet
        self.pot += actual_bet

    def get_board_state(self) -> Dict[str, Any]:
        """
        Returns the public state for the frontend as a dictionary.
        This provides a rich state for the UI to render the poker table.
        """
        # Visibility Logic
        has_human = any("human" in p["name"].lower() for p in self.players)

        players_data = []
        for i, p in enumerate(self.players):
            is_human_player = "human" in p["name"].lower()

            # Determine visibility
            show_cards = False

            # Count humans to detect "Hotseat" (multi-human) vs "Single Player"
            human_indices = [
                idx
                for idx, pl in enumerate(self.players)
                if "human" in pl["name"].lower()
            ]
            is_hotseat = len(human_indices) > 1

            if self.stage in [SHOWDOWN, HAND_OVER]:
                show_cards = True
            elif p["status"] == "show":
                show_cards = True
            elif p["status"] == "folded":
                # Reveal folded cards for spectator interest (gives info advantage but acceptable for AI games)
                show_cards = True
            elif not has_human:
                # Spectator Mode: No humans in game, show all cards
                show_cards = True
            elif is_human_player:
                if is_hotseat:
                    # Hotseat: Only show cards if it is THIS player's turn
                    # This prevents Player A from seeing Player B's cards in 4x Human mode
                    if i == self.current_player_idx:
                        show_cards = True
                else:
                    # Single Human: Always show their own cards
                    show_cards = True

            players_data.append(
                {
                    "name": p["name"],
                    "chips": p["chips"],
                    "bet": p["current_round_bet"],
                    "total_bet": p["total_bet"],
                    "status": p["status"],
                    "has_acted": p["has_acted"],
                    "is_dealer": i == self.dealer_idx,
                    "cards": [str(c) for c in p["hand"]] if show_cards else None,
                    "hand_rank": p.get("final_hand_rank"),
                }
            )

        return {
            "pot": self.pot,
            "community_cards": [str(c) for c in self.community_cards],
            "stage": self.stage,
            "dealer_idx": self.dealer_idx,
            "current_player_idx": self.current_player_idx,
            "players": players_data,
            "last_hand_result": (
                self.last_hand_result if hasattr(self, "last_hand_result") else None
            ),
            "wins": self.wins,
        }

    def get_state_for_player(self, player_idx: int) -> str:
        return self._render_state_text(player_idx)

    @property
    def board(self) -> Dict[str, Any]:
        """Property to access board state, required by Match engine."""
        return self.get_board_state()

    def _cards_to_text(self, cards: List[Card]) -> str:
        if not cards:
            return "[]"
        parts = []
        for c in cards:
            r = c.rank.value
            s = c.suit.value
            # Use symbols directly for cleaner prompt and better LLM parsing
            # e.g. "A♥", "10♣"
            parts.append(f"{r}{s}")
        return "[" + ", ".join(parts) + "]"

    def _render_state_text(self, player_idx: int) -> str:
        """
        Render a text description of the game state for the LLM.
        NOW INCLUDES COLORS instead of names.
        Formatted in Markdown for better readability.
        """
        # Color Mapping based on index
        my_color = PLAYER_COLOR_NAMES[player_idx % len(PLAYER_COLOR_NAMES)]

        # Calculate blinds indices
        n_players = len(self.players)
        sb_idx = (self.dealer_idx + 1) % n_players
        bb_idx = (self.dealer_idx + 2) % n_players

        txt = f"You are playing as: **Player {my_color}**\n\n"

        txt += f"### Poker Table (Stage: {self.stage})\n"
        txt += f"- **Blinds:** Small Blind: `{self.small_blind}` | Big Blind: `{self.big_blind}`\n"
        comm_str = self._cards_to_text(self.community_cards)
        txt += f"- **Total Pot:** {self.pot}\n"
        txt += f"- **Community Cards:** {comm_str}\n\n"

        txt += "### Players Status:\n"
        for i, p in enumerate(self.players):
            roles = []
            if i == self.dealer_idx:
                roles.append("DEALER")
            if i == sb_idx:
                roles.append("SMALL BLIND")
            if i == bb_idx:
                roles.append("BIG BLIND")

            role_str = f" **[{', '.join(roles)}]**" if roles else ""
            p_color = PLAYER_COLOR_NAMES[i % len(PLAYER_COLOR_NAMES)]

            cards_str = "*[Hidden]*"
            if i == player_idx or self.stage == SHOWDOWN:  # Use string constant
                cards_str = self._cards_to_text(p["hand"])

            # Status Icon
            status = p["status"]

            txt += f"- **Player {p_color}**{role_str}\n"
            txt += f"  - Chips: `{p['chips']}` | Current Bet: `{p['current_round_bet']}` | Status: `{status}`\n"

            if i == player_idx:
                txt += f"  - **YOUR HAND:** {cards_str}\n"

        txt += "\n**What is your next move?**"
        return txt

    def get_available_moves(self) -> List[str]:
        # Simple for now
        return ["fold", "check", "call", "raise <amount>", "allin"]

    def force_fold(self, player_idx: int):
        """Force a player to fold (used when they make an invalid move)."""
        p = self.players[player_idx]
        p["status"] = "folded"

        # Advance to next active player BEFORE checking round completion
        # This is needed so that if no stage change occurs, the game engine
        # has the correct current_player_idx for the match loop to sync with
        for i in range(1, len(self.players) + 1):
            next_idx = (player_idx + i) % len(self.players)
            if self.players[next_idx]["status"] == "active":
                self.current_player_idx = next_idx
                break

        self._check_round_completion()

    def make_move(self, move: str, player_symbol: str) -> bool:
        p_idx = self.current_player_idx
        # Safety: Ensure current player is valid
        if self.players[p_idx]["status"] != "active":
            # This happens if match loop tries to move a folded player.
            return False

        p = self.players[p_idx]

        move = move.lower().strip()
        parts = move.split()
        if not parts:
            return False
        action = parts[0]

        current_max_bet = max(
            [
                pl["current_round_bet"]
                for pl in self.players
                if pl["status"] in ["active", "allin"]
            ]
            or [0]
        )
        to_call = current_max_bet - p["current_round_bet"]

        valid = False
        if action == "fold":
            p["status"] = "folded"
            valid = True

        elif action == "check":
            if to_call == 0:
                valid = True

        elif action == "call":
            amount = min(to_call, p["chips"])
            self._bet_chips(p, amount)
            # If we called and ran out of chips, we are all-in
            if p["chips"] == 0:
                p["status"] = "allin"
            valid = True

        elif action == "raise":
            if len(parts) >= 2 and parts[1].isdigit():
                add_amt = int(parts[1])
                # Raise is ON TOP of the call amount usually, or TO an amount?
                # "RAISE X" -> I put in Call + X.
                total_needed = to_call + add_amt

                if total_needed <= p["chips"] and add_amt >= self.min_raise:
                    self._bet_chips(p, total_needed)
                    self.min_raise = add_amt
                    self.last_raiser_idx = p_idx
                    # Reset acted flags for others to reopen action
                    for pl in self.players:
                        if pl["status"] == "active":
                            pl["has_acted"] = False
                    valid = True

        elif action == "allin":
            amt = p["chips"]
            self._bet_chips(p, amt)
            p["status"] = "allin"

            # Raise logic for All-in
            if p["current_round_bet"] > current_max_bet:
                raise_amt = p["current_round_bet"] - current_max_bet
                # Only reopen action if it's a "full" raise?
                # For simplified rules: always reopen if it raises max bet
                if raise_amt > self.min_raise:
                    self.min_raise = raise_amt

                self.last_raiser_idx = p_idx
                for pl in self.players:
                    if pl["status"] == "active":
                        pl["has_acted"] = False
            valid = True

        if not valid:
            return False

        p["has_acted"] = True

        # Advance to next active player BEFORE checking round completion
        # Game engine is the source of truth for turn order
        for i in range(1, len(self.players) + 1):
            next_idx = (p_idx + i) % len(self.players)
            if self.players[next_idx]["status"] == "active":
                self.current_player_idx = next_idx
                break

        self._check_round_completion()
        return True

    def _bet_chips(self, p, amount):
        p["chips"] -= amount
        p["current_round_bet"] += amount
        p["total_bet"] += amount
        self.pot += amount

    def _check_round_completion(self):
        # Check standard round end
        active = [p for p in self.players if p["status"] == "active"]
        allin = [p for p in self.players if p["status"] == "allin"]
        not_folded = active + allin

        # If only 1 player remains not folded, they win immediately (no showdown needed)
        if len(not_folded) == 1:
            winner = not_folded[0]
            winner["chips"] += self.pot
            self.wins[winner["name"]] = self.wins.get(winner["name"], 0) + 1
            self.last_hand_result = {
                "winners": [winner["name"]],
                "winner_indices": [
                    i for i, p in enumerate(self.players) if p["name"] == winner["name"]
                ],
                "pot": self.pot,
                "community_cards": [str(c) for c in self.community_cards],
                "winning_cards": [],
                "winning_hand_name": "Opponents Folded",
                "player_hands": {},  # No showdown, no need to reveal
            }
            # self.start_new_hand() -> Don't start automatically
            self.stage = HAND_OVER
            return

        # If 0 active players (all remaining are all-in or folded)
        if len(active) == 0:
            self._to_showdown_auto()
            return

        # Max bet on table
        max_bet = max(
            [
                pl["current_round_bet"]
                for pl in self.players
                if pl["status"] in ["active", "allin"]
            ]
            or [0]
        )
        bets = [p["current_round_bet"] for p in active]

        all_matched = all(b == max_bet for b in bets)
        all_acted = all(p.get("has_acted", False) for p in active)

        if all_matched and all_acted:
            self._next_stage()

    def _next_stage(self):
        # Clean up round bets
        for p in self.players:
            p["current_round_bet"] = 0
            p["has_acted"] = False

        curr_stage_idx = [PREFLOP, FLOP, TURN, RIVER, SHOWDOWN].index(self.stage)
        if self.stage == SHOWDOWN:
            self._resolve_hand_winner()
            return

        next_stage = [PREFLOP, FLOP, TURN, RIVER, SHOWDOWN][curr_stage_idx + 1]
        self.stage = next_stage

        if next_stage == FLOP:
            self.community_cards = self.deck.deal(3)
        elif next_stage in [TURN, RIVER]:
            self.community_cards.append(self.deck.deal(1)[0])
        elif next_stage == SHOWDOWN:
            self._resolve_hand_winner()
            return

        # Start of new stage: Action starts at first active player after Dealer
        self.min_raise = self.big_blind  # Reset min raise
        active_indices = [
            i for i, p in enumerate(self.players) if p["status"] == "active"
        ]
        if not active_indices:
            return

        # Find first active index after Dealer
        offset = (self.dealer_idx + 1) % len(self.players)
        for i in range(len(self.players)):
            idx = (offset + i) % len(self.players)
            if self.players[idx]["status"] == "active":
                self.current_player_idx = idx
                print(
                    f"[GAME] _next_stage: dealer_idx={self.dealer_idx}, setting current_player_idx={idx} ({self.players[idx]['name']})"
                )
                break

    def _to_showdown_auto(self):
        # Deal remaining cards
        while len(self.community_cards) < 5:
            self.community_cards.append(self.deck.deal(1)[0])
        self.stage = SHOWDOWN
        self._resolve_hand_winner()

    def _resolve_hand_winner(self):
        contestants = [p for p in self.players if p["status"] in ["active", "allin"]]
        if not contestants:
            return

        winners = []
        if len(contestants) == 1:
            winner_p = contestants[0]
            winner_p["chips"] += self.pot
            winners = [winner_p]
        else:
            best_rank = (-1, [])

            for p in contestants:
                full_hand = p["hand"] + self.community_cards
                # New evaluator returns (rank, kickers, core_str, kicker_str)
                eval_result = evaluate_hand(full_hand)
                rank_tuple = eval_result[:2]

                p["final_hand_rank"] = rank_tuple
                p["winning_core"] = eval_result[2]
                p["winning_kickers"] = eval_result[3]

                # Compare
                if not winners:
                    winners = [p]
                    best_rank = rank_tuple
                    continue

                if rank_tuple > best_rank:
                    winners = [p]
                    best_rank = rank_tuple
                elif rank_tuple == best_rank:
                    winners.append(p)

            if winners:
                share = self.pot // len(winners)
                for w in winners:
                    w["chips"] += share
                    self.wins[w["name"]] = self.wins.get(w["name"], 0) + 1

        # Save last hand result for UI
        winning_cards = []
        winning_kickers = []
        winning_hand_name = ""

        if winners and "winning_core" in winners[0]:
            winning_cards = winners[0]["winning_core"]

        if winners and len(winners) > 1 and "winning_kickers" in winners[0]:
            winning_kickers = winners[0]["winning_kickers"]

        if winners and "final_hand_rank" in winners[0]:
            strength = winners[0]["final_hand_rank"][0]
            # Ensure it is Enum for name access
            if isinstance(strength, int):
                try:
                    strength = HandStrength(strength)
                except ValueError:
                    pass

            if hasattr(strength, "name"):
                winning_hand_name = strength.name.replace("_", " ").title()

        self.last_hand_result = {
            "winners": [w["name"] for w in winners],
            "winner_indices": [
                i
                for i, p in enumerate(self.players)
                if any(w["name"] == p["name"] for w in winners)
            ],
            "pot": self.pot,
            "winning_cards": winning_cards,
            "winning_kickers": winning_kickers,
            "winning_hand_name": winning_hand_name,
            "community_cards": [str(c) for c in self.community_cards],
            "player_hands": {
                p["name"]: [str(c) for c in p["hand"]] for p in contestants
            },
        }

        # self.start_new_hand() -> Don't start automatically
        self.stage = HAND_OVER

    def is_game_over(self) -> bool:
        # Game over if only 1 player has chips
        active = [p for p in self.players if p["chips"] > 0]
        return len(active) <= 1

    def get_winner(self) -> str | None:
        if self.is_game_over() or getattr(self, "force_end", False):
            # Return player with most chips
            sorted_players = sorted(self.players, key=lambda p: p["chips"], reverse=True)
            return sorted_players[0]["name"] if sorted_players else None
        return None

    def get_winner_idx(self) -> int | None:
        """Returns the index of the winning player."""
        if self.is_game_over() or getattr(self, "force_end", False):
            # Sort to find winner, then find original index
            sorted_players = sorted(self.players, key=lambda p: p["chips"], reverse=True)
            if not sorted_players:
                return None
            winner_name = sorted_players[0]["name"]
            
            for i, p in enumerate(self.players):
                if p["name"] == winner_name:
                    return i
        return None
