import React from 'react';
import { GameArena } from '../components/GameArena';
import { GameBoard } from '../components/GameBoard';
import type { GameState, ModelConfig } from '../types';

interface TicTacToeBoardProps {
    gameState: GameState | null;
    p1Model: string;
    p2Model: string;
    models: ModelConfig[];
    makeHumanMove: (move: string) => void;
    gameType?: string;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
    gameState, p1Model, p2Model, makeHumanMove, gameType = 'tictactoe'
}) => {
    // We purposefully intentionally pass an empty players array to GameArena
    // to hide the floating player icons, as requested.
    // The GameArena is still used for the consistent background and centering.

    return (
        <GameArena players={[]} fluid={true}>
            <div className="transform scale-150 lg:scale-[2.0]">
                <GameBoard
                    gameState={gameState}
                    gameType={gameType}
                    makeHumanMove={makeHumanMove}
                    p1Model={p1Model}
                    p2Model={p2Model}
                />
            </div>
        </GameArena>
    );
};
