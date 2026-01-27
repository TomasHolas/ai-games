import { useState, useEffect } from 'react';

export type ViewType = 'dashboard' | 'games' | 'metrics' | 'match' | 'history' | 'replay';

// Helper to parse hash
const parseHash = (): { view: ViewType; matchId?: string } => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('replay/')) {
        return { view: 'replay', matchId: hash.replace('replay/', '') };
    }
    const validViews: ViewType[] = ['dashboard', 'games', 'metrics', 'history'];
    return { view: validViews.includes(hash as ViewType) ? (hash as ViewType) : 'dashboard' };
};

export function useAppNavigation() {
    // Parse initial state
    const initialState = parseHash();

    const [view, setView] = useState<ViewType>(initialState.view === 'replay' ? 'match' : initialState.view);
    const [inGame, setInGame] = useState(initialState.view === 'replay');
    const [isReviewing, setIsReviewing] = useState(initialState.view === 'replay');
    const [pendingReplayId, setPendingReplayId] = useState<string | null>(initialState.matchId || null);

    // Sync URL hash with view state
    useEffect(() => {
        if (isReviewing && pendingReplayId) { // Use pendingReplayId or a separate "activeReplayId" if needed? 
            // Actually, App.tsx used 'historyData.match_id' to sync hash.
            // If we decouple navigation from data, we might need to pass the ID in.
            // For now, let's just handle the OUTBOUND hash sync in the consumer (App.tsx) 
            // OR pass a "currentMatchId" to this hook?
            // Let's stick to the listener logic here, and let the consumer update the hash 
            // manually if it wants to force a specific ID, or we can expose a "setHash" helper.
        } else if (!inGame) {
            // Avoid overwriting replay hash if we are just switching internal states?
            // The original App.tsx used historyData to determine the hash.
            // Let's defer the "write to hash" part that depends on data to App.tsx, 
            // but handle the "read from hash" part here.
        }
    }, []); // Empty dependency? No, App.tsx had dependencies. 

    // Let's refine: The listener is cleaner.
    useEffect(() => {
        const handleHashChange = () => {
            const parsed = parseHash();
            if (parsed.view === 'replay' && parsed.matchId) {
                setPendingReplayId(parsed.matchId);
                setIsReviewing(true);
                setInGame(true);
                setView('match');
            } else if (!inGame || isReviewing) {
                // Only navigate away if we are not in an active live game (protect accidental back?)
                // Or if we ARE reviewing (allowing back from review)
                setView(parsed.view);
                setInGame(false);
                setIsReviewing(false);
                // setHistoryData(null); // This data clearing needs to happen in App.tsx
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [inGame, isReviewing]);

    return {
        view,
        setView,
        inGame,
        setInGame,
        isReviewing,
        setIsReviewing,
        pendingReplayId,
        setPendingReplayId,
    };
}
