/**
 * Core type definitions for AI Games
 */

export interface Metrics {
    latency_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface GameState {
    board: any;
    turn: number;
    message: string;
    current_player: string;
    current_symbol: string;
    is_thinking: boolean;
    game_over: boolean;
    winner: string | null;
    winner_index?: number | null;
    metrics?: Metrics | null;
    is_invalid?: boolean;
    raw_response?: string;
    thinking?: string;
    system_prompt?: string;
    user_prompt?: string;
}

export interface LogEntry {
    turn: number;
    player: string;
    move: string;
    metrics?: Metrics;
    timestamp: string;
    is_invalid?: boolean;
    raw_response?: string;
    thinking?: string;
    system_prompt?: string;
    user_prompt?: string;
    current_symbol?: string;
    player_index?: number;
    board?: string[][];
    folded_cards?: string[];
    hand_result?: any;
    is_hand_summary?: boolean;
}

export interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
}

export interface ProviderStatus {
    provider: string;
    ready: boolean;
    details: string;
}

export interface ModelStats {
    model_id: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    total_latency_ms: number;
    total_tokens: number;
    invalid_moves: number;
    errors: number;
    starts: number;
    avg_latency: number;
    win_rate: number;
}

export interface MetricsHistoryEntry {
    turn: number;
    latency_p1: number | null;
    latency_p2: number | null;
    latency?: number;
    player_idx?: number;
    cost?: number; // Adding cost as it was used in useGameWebSocket
    tokens: number;
    player: string;
}

export interface InvalidMoves {
    p1: number;
    p2: number;
}
