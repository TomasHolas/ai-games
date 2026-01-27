import json
import os
from typing import Dict, Any
from pathlib import Path

DATA_DIR = Path("data")
STATS_DIR = DATA_DIR / "stats"
GAMES_DIR = DATA_DIR / "games"

# Ensure dirs exist
STATS_DIR.mkdir(parents=True, exist_ok=True)
GAMES_DIR.mkdir(parents=True, exist_ok=True)


class StatsManager:
    @staticmethod
    def save_game_result(game_data: Dict[str, Any]):
        """
        Saves the full game log and updates aggregated stats for involved models.
        """
        # 0. Calculate Poker Metrics if applicable
        poker_metrics = {}
        if game_data.get("game_type") == "poker":
            poker_metrics = StatsManager._calculate_poker_metrics(
                game_data.get("log", []), game_data.get("players_list", [])
            )

            # Enrich model_stats with poker metrics before saving
            if "model_stats" in game_data:
                for mid, stats in game_data["model_stats"].items():
                    if mid in poker_metrics:
                        stats.update(poker_metrics[mid])

        # 1. Save Game Log
        match_id = game_data.get(
            "match_id", f"match_{int(game_data.get('timestamp', 0))}"
        )
        with open(GAMES_DIR / f"{match_id}.json", "w") as f:
            json.dump(game_data, f, indent=2)

        # 2. Update Model Stats
        # game_data expects:
        # {
        #   "winner": "gpt-4o",
        #   "players": {"gpt-4o": {...metrics}, "claude": {...metrics}},
        #   "timestamp": ...
        # }

        winner_id = game_data.get(
            "winner_model_id"
        )  # e.g., "gpt-4o" (or None for draw)
        error_model_id = game_data.get("error_model_id")
        player1_id = game_data.get("player1")

        # Calculate Poker Metrics if applicable
        poker_metrics = {}
        if game_data.get("game_type") == "poker":
            poker_metrics = StatsManager._calculate_poker_metrics(
                game_data.get("log", []), game_data.get("players_list", [])
            )

        for model_id, performance in game_data.get("model_stats", {}).items():
            is_starter = model_id == player1_id

            # Extract specific poker stats for this model
            p_stats = poker_metrics.get(model_id, {})

            StatsManager._update_model_stats(
                model_id,
                performance,
                winner_id,
                error_model_id,
                is_starter,
                poker_stats=p_stats,
            )

    @staticmethod
    def _calculate_poker_metrics(log: list, players: list) -> dict:
        """
        Analyzes game log to calculate VPIP, PFR, and Aggression stats per player.
        """
        stats = {
            p: {
                "poker_hands": 0,
                "poker_vpip_hands": 0,
                "poker_pfr_hands": 0,
                "poker_aggr_actions": 0,
                "poker_call_actions": 0,
            }
            for p in players
        }

        # Heuristic: a new hand starts when we see "New hand started" or "Poker Game started"
        # First hand is implicitly started.

        # Note: The log contains events. usage of "New hand started" message is good.
        # But for exactness, we can track "PREFLOP" stage transitions?

        # Easier: Scan for "New hand started" message to reset flags.
        # Also need to count the FIRST hand.

        # Let's treat the entire log as a sequence.

        # Initialize for first hand
        stats_per_hand = {p: {"vpip": False, "pfr": False} for p in players}
        hand_count = 1  # Start with 1 assumed

        for entry in log:
            msg = entry.get("message", "")

            # Detect New Hand
            if "New hand started" in msg:
                hand_count += 1
                # Reset flags for new hand
                stats_per_hand = {p: {"vpip": False, "pfr": False} for p in players}
                continue

            # Process Actions
            if "poker_action" in entry:
                player = entry.get("current_player")
                if not player or player not in stats:
                    # Try active_player_override
                    # But log key is usually "current_player" or implied?
                    # The log entry from match.py has "current_player": "Name" implicitly?
                    # match.py _notify calls send_json(state_data).
                    # state_data usually aggregates arguments.
                    # BaseGame._notify constructs payload.
                    # It puts `current_player` as name if provided?
                    # Let's check BaseGame. It uses active_player_override.name if present.
                    # PokerMatch passes active_player_override.
                    pass

                # In parsed log, 'current_player' key should be present
                if not player:
                    continue

                if player not in stats:
                    # Maybe "Human Red" vs "human" mapping issue?
                    # The stats keys are model_ids. The players in log are "Human Red".
                    # We need to map them if possible.
                    # BUT save_game_result receives 'model_stats' keyed by model_id.
                    # The log uses player names (e.g. "gpt-4o", "Human Red").
                    # If model_id == player_name (for AIs), it works.
                    # For Human, the log has "Human Red". The model_stats has "human" (maybe?).
                    # Main.py uses unique names for PokerGame.
                    # "poker_metrics" keys will be player names from log.
                    # We must reconcile this in save_game_result loop.
                    if player not in stats:
                        # Init if missing (e.g. System or weird name)
                        if player not in players:
                            continue
                        stats[player] = {
                            "poker_hands": 0,
                            "poker_vpip_hands": 0,
                            "poker_pfr_hands": 0,
                            "poker_aggr_actions": 0,
                            "poker_call_actions": 0,
                        }

                act = entry["poker_action"]
                a_type = act.get("type")
                stage = act.get("stage")

                # VPIP: Voluntarily put money? (Call, Raise, Bet, Allin)
                # Check is NOT VPIP. Fold is NOT VPIP.
                if a_type in ["call", "raise", "bet", "allin"]:
                    stats_per_hand[player]["vpip"] = True

                    if a_type in ["raise", "bet", "allin"]:
                        stats[player]["poker_aggr_actions"] += 1

                        # PFR: Raise in Preflop
                        if stage == "PREFLOP":
                            stats_per_hand[player]["pfr"] = True

                    elif a_type == "call":
                        stats[player]["poker_call_actions"] += 1

            # Update running totals for hands (we do this at end of hand or on the fly? warning: double counting)
            # Actually, calculating "per hand" flags is tricky if we don't know when hand ends.
            # "New hand started" marks START of NEXT.
            # So when we see "New hand started", we commit the stats from PREVIOUS hand.
            pass

        # Re-implementation of loop for correct committing

        # Reset
        final_stats = {
            p: {
                "poker_hands": 0,
                "poker_vpip_hands": 0,
                "poker_pfr_hands": 0,
                "poker_aggr_actions": 0,
                "poker_call_actions": 0,
            }
            for p in players
        }

        # Hand state
        current_hand_stats = {p: {"vpip": False, "pfr": False} for p in players}

        # We process the log. When "New hand started" -> commit current_hand_stats to final_stats, then reset.
        # At end of log -> commit one last time.

        for entry in log:
            msg = entry.get("message", "")
            if "New hand started" in msg:
                # Commit previous hand
                for p in players:
                    final_stats[p]["poker_hands"] += 1
                    if current_hand_stats[p]["vpip"]:
                        final_stats[p]["poker_vpip_hands"] += 1
                    if current_hand_stats[p]["pfr"]:
                        final_stats[p]["poker_pfr_hands"] += 1

                # Reset
                current_hand_stats = {p: {"vpip": False, "pfr": False} for p in players}
                continue

            if "poker_action" in entry:
                player = entry.get("current_player")
                # Map "Human Red" to "human" if needed?
                # Actually main.py passes `model_stats` with keys like "Human Red" for Poker?
                # Let's check main.py.
                # Line 199: model_stats[name] = ... where name is unique_player_names (e.g. "Human Red").
                # So keys matches log names. Good.

                if player not in players:
                    continue

                act = entry["poker_action"]
                a_type = act.get("type", "")
                stage = act.get("stage", "")

                if a_type in ["call", "raise", "bet", "allin"]:
                    current_hand_stats[player]["vpip"] = True

                    if a_type in ["raise", "bet", "allin"]:
                        final_stats[player]["poker_aggr_actions"] += 1
                        if stage == "PREFLOP":
                            current_hand_stats[player]["pfr"] = True
                    elif a_type == "call":
                        final_stats[player]["poker_call_actions"] += 1

        # Commit last hand
        for p in players:
            final_stats[p]["poker_hands"] += 1
            if current_hand_stats[p]["vpip"]:
                final_stats[p]["poker_vpip_hands"] += 1
            if current_hand_stats[p]["pfr"]:
                final_stats[p]["poker_pfr_hands"] += 1

        return final_stats

    @staticmethod
    def _update_model_stats(
        model_id: str,
        new_perf: Dict,
        winner_id: str,
        error_model_id: str = None,
        is_starter: bool = False,
        poker_stats: Dict = None,
    ):
        stats_file = STATS_DIR / f"{model_id}.json"

        if stats_file.exists():
            with open(stats_file, "r") as f:
                stats = json.load(f)
        else:
            stats = {
                "matches": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "errors": 0,
                "starts": 0,
                "total_latency_ms": 0,
                "total_tokens": 0,
                "invalid_moves": 0,
                # Poker specific checks
                "poker_hands": 0,
                "poker_vpip_hands": 0,
                "poker_pfr_hands": 0,
                "poker_aggr_actions": 0,
                "poker_call_actions": 0,
            }

        # Initialize new field if missing from old file
        for k in [
            "errors",
            "starts",
            "poker_hands",
            "poker_vpip_hands",
            "poker_pfr_hands",
            "poker_aggr_actions",
            "poker_call_actions",
        ]:
            if k not in stats:
                stats[k] = 0

        # Update Aggregates
        if error_model_id:
            # If the game ended in an error (invalid move/crash)
            if model_id == error_model_id:
                stats["errors"] += 1
            # Do NOT increment matches, wins, draws, losses, starts for anyone
        else:
            # Normal game conclusion
            stats["matches"] += 1
            if is_starter:
                stats["starts"] += 1

            if winner_id == model_id:
                stats["wins"] += 1
            elif winner_id is None:
                stats["draws"] += 1
            else:
                stats["losses"] += 1

        stats["total_latency_ms"] += new_perf.get("latency_sum", 0)
        stats["total_tokens"] += new_perf.get("tokens", 0)
        stats["invalid_moves"] += new_perf.get("invalid_moves", 0)

        # Poker Stats Update
        if poker_stats:
            stats["poker_hands"] += poker_stats.get("poker_hands", 0)
            stats["poker_vpip_hands"] += poker_stats.get("poker_vpip_hands", 0)
            stats["poker_pfr_hands"] += poker_stats.get("poker_pfr_hands", 0)
            stats["poker_aggr_actions"] += poker_stats.get("poker_aggr_actions", 0)
            stats["poker_call_actions"] += poker_stats.get("poker_call_actions", 0)

        with open(stats_file, "w") as f:
            json.dump(stats, f, indent=2)

    @staticmethod
    def get_history(limit: int = 50, game_type: str = None):
        records = []
        # sort by mod time desc
        files = sorted(GAMES_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)
        for f in files:
            if len(records) >= limit:
                break
            try:
                with open(f, "r") as r:
                    data = json.load(r)
                    # Filter by game_type if specified
                    if game_type and data.get("game_type") != game_type:
                        continue
                    records.append(
                        {
                            "match_id": data.get("match_id"),
                            "timestamp": data.get("timestamp"),
                            "game_type": data.get("game_type", "tictactoe"),
                            "player1": data.get("player1"),
                            "player2": data.get("player2"),
                            "winner_model_id": data.get("winner_model_id"),
                            "winner_index": data.get("winner_index"),
                            "error_model_id": data.get("error_model_id"),
                            "error_index": data.get("error_index"),
                            "players_list": data.get("players_list"),
                            "model_stats": data.get("model_stats", {}),
                        }
                    )
            except Exception:
                continue
        return records

    @staticmethod
    def get_game_details(match_id: str):
        path = GAMES_DIR / f"{match_id}.json"
        if not path.exists():
            return None
        with open(path, "r") as f:
            return json.load(f)

    @staticmethod
    def get_all_stats(game_type: str = None):
        """
        Returns aggregated statistics. If game_type is provided and not 'all',
        it aggregates stats on the fly from history records.
        """
        if not game_type or game_type == "all":
            results = []
            for f_path in STATS_DIR.glob("*.json"):
                with open(f_path, "r") as f:
                    data = json.load(f)
                    data["model_id"] = f_path.stem
                    # Calculate calculated metrics
                    total_games = data.get("matches", 0) + data.get("errors", 0)
                    if total_games > 0:
                        data["avg_latency"] = data["total_latency_ms"] / total_games
                    else:
                        data["avg_latency"] = 0

                    if data["matches"] > 0:
                        data["win_rate"] = (data["wins"] / data["matches"]) * 100
                    else:
                        data["win_rate"] = 0
                    results.append(data)
            return results

        # Aggregate on the fly for specific game type
        model_stats = {}

        for f_path in GAMES_DIR.glob("*.json"):
            try:
                with open(f_path, "r") as f:
                    game = json.load(f)
                    if game.get("game_type") != game_type:
                        continue

                    winner_id = game.get("winner_model_id")
                    error_model_id = game.get("error_model_id")
                    player1_id = game.get("player1")

                    for model_id, perf in game.get("model_stats", {}).items():
                        if model_id not in model_stats:
                            model_stats[model_id] = {
                                "model_id": model_id,
                                "matches": 0,
                                "wins": 0,
                                "draws": 0,
                                "losses": 0,
                                "errors": 0,
                                "starts": 0,
                                "total_latency_ms": 0,
                                "total_tokens": 0,
                                "invalid_moves": 0,
                                # New fields
                                "poker_hands": 0,
                                "poker_vpip_hands": 0,
                                "poker_pfr_hands": 0,
                                "poker_aggr_actions": 0,
                                "poker_call_actions": 0,
                            }

                        ms = model_stats[model_id]
                        if error_model_id:
                            if model_id == error_model_id:
                                ms["errors"] += 1
                        else:
                            ms["matches"] += 1
                            if model_id == player1_id:
                                ms["starts"] += 1

                            if winner_id == model_id:
                                ms["wins"] += 1
                            elif winner_id is None:
                                ms["draws"] += 1
                            else:
                                ms["losses"] += 1

                        ms["total_latency_ms"] += perf.get("latency_sum", 0)
                        ms["total_tokens"] += perf.get("tokens", 0)
                        ms["invalid_moves"] += perf.get("invalid_moves", 0)

                        # Add Poker Stats
                        ms["poker_hands"] += perf.get("poker_hands", 0)
                        ms["poker_vpip_hands"] += perf.get("poker_vpip_hands", 0)
                        ms["poker_pfr_hands"] += perf.get("poker_pfr_hands", 0)
                        ms["poker_aggr_actions"] += perf.get("poker_aggr_actions", 0)
                        ms["poker_call_actions"] += perf.get("poker_call_actions", 0)
            except Exception as e:
                print(f"Error processing {f_path}: {e}")
                continue

        # Finalize stats
        results = []
        for data in model_stats.values():
            total_games = data["matches"] + data["errors"]
            if total_games > 0:
                data["avg_latency"] = data["total_latency_ms"] / total_games
            else:
                data["avg_latency"] = 0

            if data["matches"] > 0:
                data["win_rate"] = (data["wins"] / data["matches"]) * 100
            else:
                data["win_rate"] = 0
            results.append(data)

        return results

    @staticmethod
    def get_model_stats_csv(game_type: str = None) -> str:
        """
        Generates a CSV string of all model statistics.
        """
        import io
        import csv
        from config.models import MODELS

        # Create a lookup for provider
        model_map = {m["id"]: m for m in MODELS}

        stats = StatsManager.get_all_stats(game_type=game_type)
        if not stats:
            return ""

        # Determine all field names from the first record + ensure priority ones come first
        fieldnames = [
            "model_id",
            "provider",
            "matches",
            "wins",
            "draws",
            "losses",
            "win_rate",
            "avg_latency",
            "total_tokens",
            "invalid_moves",
            "errors",
        ]

        # Add any extra keys that might exist
        all_keys = set()
        for s in stats:
            all_keys.update(s.keys())

        for k in all_keys:
            if k not in fieldnames:
                fieldnames.append(k)

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)

        writer.writeheader()
        for row in stats:
            # Flatten / Enrich
            formatted_row = row.copy()

            # Add Provider
            model_info = model_map.get(row["model_id"])
            formatted_row["provider"] = (
                model_info["provider"] if model_info else "Unknown"
            )

            # Format floats for better readability
            if "win_rate" in formatted_row:
                formatted_row["win_rate"] = f"{formatted_row['win_rate']:.2f}%"
            if "avg_latency" in formatted_row:
                formatted_row["avg_latency"] = f"{formatted_row['avg_latency']:.2f}"

            writer.writerow(formatted_row)

        return output.getvalue()

    @staticmethod
    def get_match_history_csv(game_type: str = None) -> str:
        """
        Generates a CSV string of raw match history.
        """
        import io
        import csv

        # Get raw records
        records = StatsManager.get_history(limit=10000, game_type=game_type)
        if not records:
            return ""

        fieldnames = [
            "match_id",
            "unix_timestamp",
            "date",
            "game_type",
            "player1",
            "player2",
            "winner",
            "error_by",
        ]

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for record in records:
            # Flatten structure for CSV
            row = {}
            row["match_id"] = record.get("match_id")
            row["unix_timestamp"] = record.get("timestamp")

            # Convert timestamp to readable date
            import datetime

            ts = record.get("timestamp")
            if ts:
                row["date"] = datetime.datetime.fromtimestamp(ts).strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

            row["game_type"] = record.get("game_type")
            row["player1"] = record.get("player1")
            row["player2"] = record.get("player2")
            row["winner"] = record.get("winner_model_id") or "Draw"
            row["error_by"] = record.get("error_model_id") or ""

            writer.writerow(row)

        return output.getvalue()

    @staticmethod
    def reset_all():
        for f in STATS_DIR.glob("*.json"):
            f.unlink()
        for f in GAMES_DIR.glob("*.json"):
            f.unlink()
        return True
