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

        for model_id, performance in game_data.get("model_stats", {}).items():
            is_starter = model_id == player1_id
            StatsManager._update_model_stats(
                model_id, performance, winner_id, error_model_id, is_starter
            )

    @staticmethod
    def _update_model_stats(
        model_id: str,
        new_perf: Dict,
        winner_id: str,
        error_model_id: str = None,
        is_starter: bool = False,
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
            }

        # Initialize new field if missing from old file
        if "errors" not in stats:
            stats["errors"] = 0
        if "starts" not in stats:
            stats["starts"] = 0

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
            formatted_row["provider"] = model_info["provider"] if model_info else "Unknown"

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
            "error_by"
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
                row["date"] = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
            
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
