"""
AI Games - FastAPI Backend
WebSocket-based game server for LLM vs LLM battles.
"""

import asyncio
import json
import logging
import os
import threading
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Core imports
from core.llm.proxy import ProxyLLM
from core.llm.gemini import GeminiLLM
from core.game.player import Player
from core.game.match import Match
from core.storage import StatsManager
from games.tictactoe.game import TicTacToe
from games.tictactoe.prompt import PROMPT_TICTACTOE
from games.tictactoe_plus.game import TicTacToePlus
from games.tictactoe_plus.prompt import PROMPT_TICTACTOE_PLUS
from games.poker.game import PokerGame
from games.poker.match import PokerMatch
from games.poker.prompt import PROMPT_POKER
from core.llm.human import HumanLLM
from config.models import get_enabled_models, is_gemini_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

app = FastAPI(
    title="AI Games API",
    description="WebSocket-based game server for LLM vs LLM battles",
    version="1.0.0",
)

# CORS configuration
# TODO: For production, restrict origins to specific domains
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_llm_instance(model_name: str):
    """Factory function to get appropriate LLM instance based on model name."""
    if model_name == "human":
        return HumanLLM()
    if is_gemini_model(model_name):
        return GeminiLLM(model_name=model_name)
    return ProxyLLM(model_name=model_name)


# === REST ENDPOINTS ===


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "AI Games API is running", "version": "1.0.0"}


@app.get("/api/models")
def get_models():
    """
    Returns list of available models.
    This is the single source of truth for model configuration.
    """
    return get_enabled_models()


@app.get("/api/stats")
def get_stats(game_type: str = None):
    """Returns aggregated statistics for all models, optionally filtered by game type."""
    return StatsManager.get_all_stats(game_type=game_type)


@app.post("/api/stats/reset")
def reset_stats():
    """Resets all statistics and game history."""
    StatsManager.reset_all()
    return {"status": "Stats reset"}


@app.get("/api/history")
def get_history(game_type: str = None):
    """Returns list of past games, optionally filtered by game type."""
    return StatsManager.get_history(game_type=game_type)


@app.get("/api/history/{match_id}")
def get_game_details(match_id: str):
    """Returns full details of a specific game."""
    game = StatsManager.get_game_details(match_id)
    if not game:
        return {"error": "Game not found"}
    return game


@app.get("/api/providers/status")
def get_providers_status():
    """Returns connectivity status for each LLM provider."""
    status = []

    # Azure OpenAI (Acting as Proxy for GPT, Claude, etc.)
    azure_key = os.getenv("OPENAI_API_KEY")
    azure_endpoint = os.getenv("OPENAI_BASE_URL")
    status.append(
        {
            "provider": "Azure AI Proxy",
            "ready": bool(azure_key and azure_endpoint),
            "details": "Provides GPT-4, Claude 3.5, Phi-4",
        }
    )

    # Google Gemini (Native)
    google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    status.append(
        {
            "provider": "Google Gemini",
            "ready": bool(google_key or google_creds),
            "details": "Provides Gemini 1.5/2.0 Models",
        }
    )

    return status


# === WEBSOCKET GAME HANDLER ===


@app.websocket("/ws/game/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: str):
    """
    WebSocket endpoint for real-time game updates.
    """
    await websocket.accept()

    try:
        # Wait for match configuration
        data = await websocket.receive_text()
        config = json.loads(data)

        logger.info(f"Starting match {match_id} with config: {config}")

        # Initialize game
        game_type = config.get("game_type", "tictactoe")

        match_instance = None
        players = []
        model_stats = {}

        if game_type == "poker":
            # Poker specific setup
            player_ids = config.get("players", [])
            # Fallback for 2-player simple mode if passed via old keys
            if not player_ids and "player1" in config:
                player_ids = [config["player1"], config["player2"]]

            if len(player_ids) < 2:
                await websocket.send_json(
                    {"error": "Poker requires at least 2 players"}
                )
                await websocket.close()
                return

            game = PokerGame(player_names=player_ids)
            sys_prompt = PROMPT_POKER

            for i, pid in enumerate(player_ids):
                # We use simple naming, could use P1, P2 etc.
                if pid == "human":
                    name = f"Human {i+1}"
                else:
                    name = pid

                p = Player(name=name, symbol=str(i), llm=get_llm_instance(pid))
                players.append(p)
                model_stats[name] = {"latency_sum": 0, "tokens": 0, "invalid_moves": 0}

            match_instance = PokerMatch(game, players, sys_prompt)

        else:
            # Existing logic for TicTacToe
            if game_type == "tictactoe_plus":
                game = TicTacToePlus()
                sys_prompt = PROMPT_TICTACTOE_PLUS
            else:
                game = TicTacToe()
                sys_prompt = (
                    PROMPT_TICTACTOE()
                    if callable(PROMPT_TICTACTOE)
                    else PROMPT_TICTACTOE
                )

            try:
                p1_model_id = config["player1"]
                p2_model_id = config["player2"]
                p1_name = "Human" if p1_model_id == "human" else p1_model_id
                p2_name = "Human" if p2_model_id == "human" else p2_model_id

                p1 = Player(
                    name=p1_name, symbol="X", llm=get_llm_instance(p1_model_id)
                )
                p2 = Player(
                    name=p2_name, symbol="O", llm=get_llm_instance(p2_model_id)
                )
                players = [p1, p2]

                model_stats[p1_model_id] = {
                    "latency_sum": 0,
                    "tokens": 0,
                    "invalid_moves": 0,
                }
                model_stats[p2_model_id] = {
                    "latency_sum": 0,
                    "tokens": 0,
                    "invalid_moves": 0,
                }

                match_instance = Match(game, players, sys_prompt)
            except Exception as e:
                logger.error(f"Error initializing players: {e}")
                await websocket.send_json({"error": str(e)})
                await websocket.close()
                return

        # Statistics tracking
        final_winner = None
        final_winner_idx = None
        final_error_by = None
        final_error_by_idx = None
        game_log = []

        # Get the running event loop for thread-safe callbacks
        loop = asyncio.get_running_loop()

        def on_update(state_data: dict):
            """Callback for game state updates."""
            nonlocal final_winner, final_error_by

            # Detect invalid moves
            is_invalid = "Invalid move" in str(state_data.get("message", ""))
            state_data["is_invalid"] = is_invalid

            # Update statistics
            if state_data.get("metrics"):
                m = state_data["metrics"]
                player_name = state_data.get("current_player")

                # Dynamic player stats usage
                if player_name in model_stats:
                    model_stats[player_name]["latency_sum"] += m.get("latency_ms", 0)
                    model_stats[player_name]["tokens"] += m.get("total_tokens", 0)
                    if is_invalid:
                        model_stats[player_name]["invalid_moves"] += 1

            if state_data.get("game_over"):
                final_winner = state_data.get("winner")
                final_error_by = state_data.get("error_by")

            # Append to log
            game_log.append(state_data)

            # Send to frontend (thread-safe)
            asyncio.run_coroutine_threadsafe(websocket.send_json(state_data), loop)

        # Run game in background thread
        game_thread = threading.Thread(target=match_instance.run, args=(on_update,))
        game_thread.start()

        # Keep websocket open while game runs and listen for human moves
        while game_thread.is_alive():
            try:
                # Use a small timeout to keep checking game_thread.is_alive()
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                msg = json.loads(data)

                # Check for human move
                if msg.get("type") == "human_move":
                    move = msg.get("move")
                    logger.info(f"Received human move: {move}")

                    # Fix for Poker "next" command
                    if move == "next" and hasattr(match_instance, "process_command"):
                        match_instance.process_command(move)
                        continue

                    # Update all Human players
                    for p in players:
                        if isinstance(p.llm, HumanLLM):
                            p.llm.set_move(move)

            except asyncio.TimeoutError:
                # Just loop back and check game_thread again
                continue
            except Exception as e:
                logger.error(f"WebSocket receive error: {e}")
                break

        await websocket.send_json({"message": "Session ended"})

        # Save statistics
        try:
            # Stats Manager expects explicit keys, but for generic N players we might need to adapt.
            # However, for now we can just flatten or store custom structure?
            # Existing schema is rigid. Let's dump what we can.

            p1_id = players[0].name if len(players) > 0 else "unknown"
            p2_id = players[1].name if len(players) > 1 else "unknown"

            StatsManager.save_game_result(
                {
                    "match_id": match_id,
                    "timestamp": time.time(),
                    "game_type": config.get("game_type", "tictactoe"),
                    "player1": p1_id,
                    "player2": p2_id,
                    "winner_model_id": final_winner,  # Assuming winner name is model name
                    "winner_index": final_winner_idx,
                    "error_model_id": final_error_by,
                    "error_index": final_error_by_idx,
                    "model_stats": model_stats,
                    "log": game_log,
                    "players_list": [
                        p.name for p in players
                    ],  # New field for multi-player
                }
            )
            logger.info(f"Stats saved for match {match_id}")
        except Exception as e:
            logger.error(f"Failed to save stats: {e}")

        await websocket.close()

    except WebSocketDisconnect:
        logger.info(f"Client disconnected {match_id}")
