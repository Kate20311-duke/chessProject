/**
 * 棋盘与棋子主题
 * 四种棋盘颜色：红、绿、蓝、黄
 * 两种棋子样式：符号（♔♕…）、字母（K Q R B N P）
 */
(function () {
  const STORAGE_BOARD = 'chess-theme-board';
  const STORAGE_PIECE = 'chess-theme-piece';

  const BOARD_THEMES = {
    red: {
      light: '#e8c4c4',
      dark: '#c47a7a',
      border: '#8b4545'
    },
    green: {
      light: '#c4e8c4',
      dark: '#7ac47a',
      border: '#458b45'
    },
    blue: {
      light: '#c4d4e8',
      dark: '#7aa0c4',
      border: '#45688b'
    },
    yellow: {
      light: '#e8e4c4',
      dark: '#c4b87a',
      border: '#8b8245'
    }
  };

  const PIECE_STYLES = {
    symbols: {
      white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
      black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }
    },
    letters: {
      white: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P' },
      black: { K: 'k', Q: 'q', R: 'r', B: 'b', N: 'n', P: 'p' }
    }
  };

  let currentBoardTheme = 'green';
  let currentPieceStyle = 'symbols';

  function getStoredBoard() {
    try {
      const v = localStorage.getItem(STORAGE_BOARD);
      return BOARD_THEMES[v] ? v : currentBoardTheme;
    } catch (e) {
      return currentBoardTheme;
    }
  }

  function getStoredPiece() {
    try {
      const v = localStorage.getItem(STORAGE_PIECE);
      return PIECE_STYLES[v] ? v : currentPieceStyle;
    } catch (e) {
      return currentPieceStyle;
    }
  }

  function setStoredBoard(v) {
    try {
      localStorage.setItem(STORAGE_BOARD, v);
    } catch (e) {}
  }

  function setStoredPiece(v) {
    try {
      localStorage.setItem(STORAGE_PIECE, v);
    } catch (e) {}
  }

  function getPieceSymbol(color, type) {
    const style = PIECE_STYLES[currentPieceStyle];
    return (style && style[color] && style[color][type]) ? style[color][type] : type;
  }

  function applyBoardTheme(name) {
    if (!BOARD_THEMES[name]) return;
    currentBoardTheme = name;
    setStoredBoard(name);
    const board = document.getElementById('chessboard');
    if (!board) return;
    board.setAttribute('data-board-theme', name);
    const t = BOARD_THEMES[name];
    board.style.setProperty('--board-light', t.light);
    board.style.setProperty('--board-dark', t.dark);
    board.style.setProperty('--board-border', t.border);
    updateBoardButtons();
  }

  function setPieceStyle(name) {
    if (!PIECE_STYLES[name]) return;
    currentPieceStyle = name;
    setStoredPiece(name);
    const board = document.getElementById('chessboard');
    if (board) board.setAttribute('data-piece-style', name);
    updatePieceButtons();
    refreshGameBoard();
  }

  function updateBoardButtons() {
    document.querySelectorAll('[data-theme-board]').forEach(btn => {
    const v = btn.getAttribute('data-theme-board');
    btn.classList.toggle('active', v === currentBoardTheme);
    });
  }

  function updatePieceButtons() {
    document.querySelectorAll('[data-theme-piece]').forEach(btn => {
      const v = btn.getAttribute('data-theme-piece');
      btn.classList.toggle('active', v === currentPieceStyle);
    });
  }

  function refreshGameBoard() {
    if (window.chessGame && typeof window.chessGame.render === 'function') {
      window.chessGame.render();
    }
  }

  function t(key) {
    if (typeof window.t === 'function') return window.t(key);
    const zh = {
      themeBoard: '棋盘',
      themePieces: '棋子',
      boardRed: '红',
      boardGreen: '绿',
      boardBlue: '蓝',
      boardYellow: '黄',
      pieceSymbols: '符号',
      pieceLetters: '字母'
    };
    return zh[key] || key;
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = '';
    container.className = 'theme-control';

    const row1 = document.createElement('div');
    row1.className = 'theme-row';
    const labelBoard = document.createElement('span');
    labelBoard.className = 'theme-label';
    labelBoard.setAttribute('data-i18n', 'themeBoard');
    labelBoard.textContent = t('themeBoard');
    row1.appendChild(labelBoard);
    ['red', 'green', 'blue', 'yellow'].forEach(name => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn theme-board';
      btn.setAttribute('data-theme-board', name);
      btn.style.setProperty('--theme-color', BOARD_THEMES[name].dark);
      btn.title = t('board' + name.charAt(0).toUpperCase() + name.slice(1));
      btn.addEventListener('click', () => applyBoardTheme(name));
      row1.appendChild(btn);
    });
    container.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'theme-row';
    const labelPiece = document.createElement('span');
    labelPiece.className = 'theme-label';
    labelPiece.setAttribute('data-i18n', 'themePieces');
    labelPiece.textContent = t('themePieces');
    row2.appendChild(labelPiece);
    ['symbols', 'letters'].forEach(name => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn theme-piece-btn';
      btn.setAttribute('data-theme-piece', name);
      btn.textContent = name === 'symbols' ? t('pieceSymbols') : t('pieceLetters');
      btn.addEventListener('click', () => setPieceStyle(name));
      row2.appendChild(btn);
    });
    container.appendChild(row2);

    currentBoardTheme = getStoredBoard();
    currentPieceStyle = getStoredPiece();
    applyBoardTheme(currentBoardTheme);
    setPieceStyle(currentPieceStyle);
  }

  function init() {
    const container = document.getElementById('theme-control');
    render(container);
    if (typeof window.applyLanguage === 'function') {
      const orig = window.applyLanguage;
      window.applyLanguage = function () {
        orig.apply(this, arguments);
        document.querySelectorAll('#theme-control [data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (key) el.textContent = t(key);
        });
        document.querySelectorAll('#theme-control [data-theme-piece]').forEach(btn => {
          const v = btn.getAttribute('data-theme-piece');
          btn.textContent = v === 'symbols' ? t('pieceSymbols') : t('pieceLetters');
        });
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.getPieceSymbol = getPieceSymbol;
  window.chessThemes = {
    applyBoardTheme,
    setPieceStyle,
    getPieceSymbol,
    refreshGameBoard
  };
})();
