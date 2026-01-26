/**
 * Frontend configuration
 */

/// <reference types="vite/client" />

// API Configuration
export const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || `http://${window.location.hostname}:8000`;

export const API_ENDPOINTS = {
    models: `${API_BASE_URL}/api/models`,
    stats: `${API_BASE_URL}/api/stats`,
    statsReset: `${API_BASE_URL}/api/stats/reset`,
    providersStatus: `${API_BASE_URL}/api/providers/status`,
    history: `${API_BASE_URL}/api/history`,
} as const;

export const WS_BASE_URL = (import.meta.env?.VITE_WS_URL as string) || `ws://${window.location.hostname}:8000`;

export function getGameWebSocketUrl(matchId: string): string {
    return `${WS_BASE_URL}/ws/game/${matchId}`;
}

// Player Colors (Red, Blue, Green, Yellow) - Matching Tailwind config/TTT
export const PLAYER_COLORS = [
    '#ef4444', // Red (Secondary in TTT)
    '#3b82f6', // Blue (Primary in TTT)
    '#22c55e', // Green (Success)
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#f97316', // Orange
];

// Fallback model list (used if API is unavailable)
export const FALLBACK_MODELS = [
    // Azure OpenAI Models / Proxy (Verified)
    { id: "gpt-4o", name: "GPT-4o (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1", name: "GPT-4.1 (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-5", name: "GPT-5 (Azure Preview)", provider: "Azure", enabled: true },
    { id: "gpt-5-mini", name: "GPT-5 Mini (Azure Preview)", provider: "Azure", enabled: true },

    // Reasoning
    { id: "o3-mini", name: "o3 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "o4-mini", name: "o4 Mini (Azure)", provider: "Azure", enabled: true },

    // Phi Series
    { id: "phi4", name: "Phi-4 (Azure)", provider: "Azure", enabled: true },
    { id: "phi4-mini", "name": "Phi-4 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "phi4-multi", "name": "Phi-4 Multi (Azure)", provider: "Azure", enabled: true },

    // Claude
    { id: "bedrock-claude-3-5-sonnet", name: "Claude 3.5 Sonnet (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-3-7-sonnet", name: "Claude 3.7 Sonnet (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-haiku-4.5", name: "Claude Haiku 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-opus-4.5", name: "Claude Opus 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-sonnet-4", name: "Claude Sonnet 4 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-sonnet-4.5", name: "Claude Sonnet 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },

    // Gemini (Native Verified)
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Google)", provider: "Google", enabled: true },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Google)", provider: "Google", enabled: true },
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview (Google)", provider: "Google", enabled: true },
];
