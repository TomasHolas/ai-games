export const GAME_CATALOG = [
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        desc: '3x3 • Zero-sum',
        icons: ['X', 'O'],
        colors: ['#FF5555', '#50FA7B']
    },
    {
        id: 'tictactoe_plus',
        name: 'Tic-Tac-Toe Plus',
        desc: '9x9 • 5-in-a-row',
        icons: ['X', 'O', '+'],
        colors: ['#FF5555', '#50FA7B']
    },
    {
        id: 'poker',
        name: 'No-Limit Hold\'em',
        desc: '4 Players • Strategy',
        icons: ['♠', '♥'],
        colors: ['#FFB86C', '#BD93F9'],
        minPlayers: 4,
        maxPlayers: 8
    }
];
