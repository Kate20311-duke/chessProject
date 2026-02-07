# Chess

A browser-based chess game built with plain HTML, CSS, and JavaScript.

## Features

- **Standard board and pieces**: 8×8 board with King, Queen, Rook, Bishop, Knight, and Pawn; White at the bottom, Black at the top
- **Legal moves**: All pieces move and capture according to standard chess rules
- **Turn-based play**: White moves first, then players alternate
- **Check and checkmate**: Detects check; game ends when there is no legal move (checkmate or stalemate)
- **Pawn promotion**: Pawns promote to a Queen when reaching the opposite end
- **No moving into check**: Moves that leave your own King in check are not allowed
- **New game**: Restart the game at any time

## How to play

1. Open `index.html` in your browser
2. Click a piece to select it, then click a highlighted square to move or capture
3. Click "New Game" to start over

## Files

- `index.html` — Page structure
- `style.css` — Board and UI styles
- `chess.js` — Board state and move logic
