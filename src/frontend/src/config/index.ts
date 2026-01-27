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

// Re-exports
export * from './theme';
export * from './models';
export * from './games';

