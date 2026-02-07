/**
 * 国际象棋 - 基本功能实现
 * 棋盘坐标: [row][col], 0-7, 白方在 0-1 行, 黑方在 6-7 行
 */

const I18N = {
  zh: {
    langLabel: '语言',
    title: '国际象棋',
    modeLabel: '模式：',
    modePvp: '双人对战',
    modeAi: '人机对战',
    sideLabel: '执棋：',
    sideWhite: '白方（先手）',
    sideBlack: '黑方（后手）',
    difficultyLabel: '难度：',
    diffEasy: '简单',
    diffMedium: '中等',
    diffHard: '困难',
    btnReset: '重新开始',
    gameOver: '游戏结束',
    whiteWins: '白方胜（将死）',
    blackWins: '黑方胜（将死）',
    draw: '和棋',
    whiteTurn: '白方回合',
    blackTurn: '黑方回合',
    check: '将军！',
    aiThinking: '（电脑思考中…）',
    musicOn: '背景音乐 开',
    musicOff: '背景音乐 关',
    musicVolume: '音量'
  },
  en: {
    langLabel: 'Language',
    title: 'Chess',
    modeLabel: 'Mode: ',
    modePvp: 'Two Player',
    modeAi: 'vs Computer',
    sideLabel: 'Play as: ',
    sideWhite: 'White (first)',
    sideBlack: 'Black (second)',
    difficultyLabel: 'Difficulty: ',
    diffEasy: 'Easy',
    diffMedium: 'Medium',
    diffHard: 'Hard',
    btnReset: 'New Game',
    gameOver: 'Game Over',
    whiteWins: 'White wins (checkmate)',
    blackWins: 'Black wins (checkmate)',
    draw: 'Draw',
    whiteTurn: "White's turn",
    blackTurn: "Black's turn",
    check: 'Check!',
    aiThinking: ' (Thinking...)',
    musicOn: 'Music on',
    musicOff: 'Music off',
    musicVolume: 'Volume'
  }
};

const LANG_KEY = 'chess-lang';

function getLang() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  return (stored && I18N[stored]) ? stored : 'zh';
}

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) ? I18N[lang][key] : key;
}
if (typeof window !== 'undefined') window.t = t;

function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && el.tagName !== 'OPTION') el.textContent = t(key);
  });
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
  if (window.chessGame) window.chessGame.updateStatus();
}

const PIECES = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }
};

// 标准朝向：白方在下方(第6-7行)，黑方在上方(第0-1行)
const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// 大写=白方, 小写=黑方
function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
}

function getPieceType(piece) {
  if (!piece) return null;
  return piece.toUpperCase();
}

// 棋子价值（用于 AI 评估）
const PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

class ChessGame {
  constructor() {
    this.board = INITIAL_BOARD.map(row => [...row]);
    this.turn = 'white';
    this.selected = null;
    this.validMoves = [];
    this.gameOver = false;
    this.check = null;
    window.chessGame = this;
    this.readModeFromDOM();
    this.initBoard();
    this.bindEvents();
    this.updateStatus();
    this.maybeTriggerAI();
  }

  readModeFromDOM() {
    const modeEl = document.querySelector('input[name="mode"]:checked');
    const sideEl = document.querySelector('input[name="side"]:checked');
    const diffEl = document.querySelector('input[name="difficulty"]:checked');
    this.gameMode = (modeEl && modeEl.value) || 'pvp';
    this.humanColor = (sideEl && sideEl.value) || 'white';
    this.aiDifficulty = (diffEl && diffEl.value) || 'easy';
    this.aiColor = this.gameMode === 'ai' ? (this.humanColor === 'white' ? 'black' : 'white') : null;
    const panel = document.querySelector('.setup-panel');
    if (panel) panel.classList.toggle('mode-ai', this.gameMode === 'ai');
  }

  initBoard() {
    const boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        sq.dataset.row = r;
        sq.dataset.col = c;
        const piece = this.board[r][c];
        if (piece) {
          const color = getPieceColor(piece);
          const type = getPieceType(piece);
          const symbol = PIECES[color][type];
          sq.innerHTML = `<span class="piece">${symbol}</span>`;
        }
        boardEl.appendChild(sq);
      }
    }
  }

  getValidMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    const color = getPieceColor(piece);
    if (color !== this.turn) return [];
    const type = getPieceType(piece);
    const moves = [];
    const add = (r, c, captureOnly = false) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return;
      const target = this.board[r][c];
      if (target) {
        if (getPieceColor(target) !== color) moves.push({ row: r, col: c, capture: true });
        return;
      }
      if (!captureOnly) moves.push({ row: r, col: c, capture: false });
    };

    switch (type) {
      case 'K': {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (dr || dc) add(row + dr, col + dc);
        break;
      }
      case 'Q':
      case 'R':
      case 'B': {
        const rays = type === 'R' ? [[0,1],[0,-1],[1,0],[-1,0]] :
                     type === 'B' ? [[1,1],[1,-1],[-1,1],[-1,-1]] :
                     [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of rays) {
          for (let step = 1; step <= 7; step++) {
            const r = row + dr * step, c = col + dc * step;
            if (r < 0 || r > 7 || c < 0 || c > 7) break;
            const target = this.board[r][c];
            if (target) {
              if (getPieceColor(target) !== color) moves.push({ row: r, col: c, capture: true });
              break;
            }
            moves.push({ row: r, col: c, capture: false });
          }
        }
        break;
      }
      case 'N': {
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) add(row + dr, col + dc);
        break;
      }
      case 'P': {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        if (!this.board[row + dir][col]) {
          moves.push({ row: row + dir, col, capture: false });
          if (row === startRow && !this.board[row + 2 * dir][col])
            moves.push({ row: row + 2 * dir, col, capture: false });
        }
        if (col > 0 && this.board[row + dir][col - 1] && getPieceColor(this.board[row + dir][col - 1]) !== color)
          moves.push({ row: row + dir, col: col - 1, capture: true });
        if (col < 7 && this.board[row + dir][col + 1] && getPieceColor(this.board[row + dir][col + 1]) !== color)
          moves.push({ row: row + dir, col: col + 1, capture: true });
        break;
      }
    }

    return moves.filter(m => !this.wouldBeInCheck(row, col, m.row, m.col));
  }

  wouldBeInCheck(fromR, fromC, toR, toC) {
    const piece = this.board[fromR][fromC];
    const captured = this.board[toR][toC];
    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;
    const inCheck = this.isKingInCheck(this.turn);
    this.board[fromR][fromC] = piece;
    this.board[toR][toC] = captured;
    return inCheck;
  }

  findKing(color) {
    const king = color === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (this.board[r][c] === king) return [r, c];
    return null;
  }

  isKingInCheck(color) {
    const pos = this.findKing(color);
    if (!pos) return false;
    const [kr, kc] = pos;
    const opponent = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p || getPieceColor(p) !== opponent) continue;
        const moves = this.getValidMovesIgnoringCheck(r, c, p);
        if (moves.some(m => m.row === kr && m.col === kc)) return true;
      }
    }
    return false;
  }

  getValidMovesIgnoringCheck(row, col, piece) {
    const color = getPieceColor(piece);
    const type = getPieceType(piece);
    const moves = [];
    const add = (r, c, captureOnly = false) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return;
      const target = this.board[r][c];
      if (target) {
        if (getPieceColor(target) !== color) moves.push({ row: r, col: c });
        return;
      }
      if (!captureOnly) moves.push({ row: r, col: c });
    };
    switch (type) {
      case 'K':
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (dr || dc) add(row + dr, col + dc);
        break;
      case 'Q':
      case 'R':
      case 'B': {
        const rays = type === 'R' ? [[0,1],[0,-1],[1,0],[-1,0]] :
                     type === 'B' ? [[1,1],[1,-1],[-1,1],[-1,-1]] :
                     [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of rays) {
          for (let step = 1; step <= 7; step++) {
            const r = row + dr * step, c = col + dc * step;
            if (r < 0 || r > 7 || c < 0 || c > 7) break;
            const target = this.board[r][c];
            if (target) {
              if (getPieceColor(target) !== color) moves.push({ row: r, col: c });
              break;
            }
            moves.push({ row: r, col: c });
          }
        }
        break;
      }
      case 'N': {
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) add(row + dr, col + dc);
        break;
      }
      case 'P': {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        if (!this.board[row + dir][col]) {
          moves.push({ row: row + dir, col });
          if (row === startRow && !this.board[row + 2 * dir][col])
            moves.push({ row: row + 2 * dir, col });
        }
        if (col > 0 && this.board[row + dir][col - 1] && getPieceColor(this.board[row + dir][col - 1]) !== color)
          moves.push({ row: row + dir, col: col - 1 });
        if (col < 7 && this.board[row + dir][col + 1] && getPieceColor(this.board[row + dir][col + 1]) !== color)
          moves.push({ row: row + dir, col: col + 1 });
        break;
      }
    }
    return moves;
  }

  hasAnyValidMove(color) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && getPieceColor(p) === color && this.getValidMoves(r, c).length > 0)
          return true;
      }
    return false;
  }

  /** 获取当前回合方的所有合法着法 */
  getAllLegalMoves() {
    const moves = [];
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const list = this.getValidMoves(r, c);
        for (const m of list) moves.push({ fromR: r, fromC: c, toR: m.row, toC: m.col });
      }
    return moves;
  }

  /** 仅更新棋盘与回合状态（用于 AI 模拟），不渲染 */
  doMove(fromR, fromC, toR, toC) {
    const piece = this.board[fromR][fromC];
    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;
    const type = getPieceType(piece);
    const color = getPieceColor(piece);
    const promoRow = color === 'white' ? 0 : 7;
    if (type === 'P' && toR === promoRow) this.board[toR][toC] = color === 'white' ? 'Q' : 'q';
    this.turn = this.turn === 'white' ? 'black' : 'white';
    this.check = this.isKingInCheck(this.turn) ? this.turn : null;
    if (this.check && !this.hasAnyValidMove(this.turn)) this.gameOver = true;
  }

  move(fromR, fromC, toR, toC) {
    this.doMove(fromR, fromC, toR, toC);
    this.selected = null;
    this.validMoves = [];
    this.render();
    this.updateStatus();
    this.maybeTriggerAI();
  }

  render() {
    const squares = document.querySelectorAll('#chessboard .square');
    squares.forEach((sq, i) => {
      const r = Math.floor(i / 8), c = i % 8;
      const piece = this.board[r][c];
      sq.classList.remove('selected', 'valid-move', 'valid-capture', 'check');
      const isSelected = this.selected && this.selected.row === r && this.selected.col === c;
      const valid = this.validMoves.find(m => m.row === r && m.col === c);
      const isCheck = this.check && piece && getPieceType(piece) === 'K' && getPieceColor(piece) === this.check;
      if (isSelected) sq.classList.add('selected');
      if (valid) sq.classList.add(valid.capture ? 'valid-capture' : 'valid-move');
      if (isCheck) sq.classList.add('check');
      if (piece) {
        const color = getPieceColor(piece);
        const symbol = PIECES[color][getPieceType(piece)];
        sq.innerHTML = `<span class="piece">${symbol}</span>`;
      } else sq.innerHTML = '';
    });
  }

  updateStatus() {
    const turnEl = document.getElementById('turn-indicator');
    const statusEl = document.getElementById('game-status');
    if (this.gameOver) {
      turnEl.textContent = t('gameOver');
      statusEl.textContent = this.check
        ? t(this.turn === 'white' ? 'blackWins' : 'whiteWins')
        : t('draw');
      return;
    }
    let turnText = this.turn === 'white' ? t('whiteTurn') : t('blackTurn');
    if (this.gameMode === 'ai' && this.turn === this.aiColor) turnText += t('aiThinking');
    turnEl.textContent = turnText;
    statusEl.textContent = this.check ? t('check') : '';
  }

  /** 局面评估：正数对白方有利，负数对黑方有利 */
  evaluateBoard() {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) continue;
        const type = getPieceType(p);
        const val = PIECE_VALUE[type] || 0;
        const sign = getPieceColor(p) === 'white' ? 1 : -1;
        score += sign * val;
        const centerBonus = (3 - Math.abs(r - 3.5)) * 0.1 + (3 - Math.abs(c - 3.5)) * 0.1;
        score += sign * centerBonus;
      }
    }
    return score;
  }

  saveState() {
    return {
      board: this.board.map(row => [...row]),
      turn: this.turn,
      check: this.check,
      gameOver: this.gameOver
    };
  }

  restoreState(s) {
    this.board = s.board.map(row => [...row]);
    this.turn = s.turn;
    this.check = s.check;
    this.gameOver = s.gameOver;
  }

  /** 简单：随机合法着法 */
  aiEasy() {
    const moves = this.getAllLegalMoves();
    return moves[Math.floor(Math.random() * moves.length)];
  }

  /** 中等：1 层搜索，选评估值最佳的一步（AI 为己方最大化） */
  aiMedium() {
    const moves = this.getAllLegalMoves();
    if (moves.length === 0) return null;
    const state = this.saveState();
    let bestScore = this.aiColor === 'white' ? -Infinity : Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      this.doMove(m.fromR, m.fromC, m.toR, m.toC);
      const score = this.evaluateBoard();
      this.restoreState(state);
      const better = this.aiColor === 'white' ? score > bestScore : score < bestScore;
      if (better) {
        bestScore = score;
        bestMove = m;
      }
    }
    return bestMove;
  }

  /** 困难：2 层极小极大搜索 */
  aiHard() {
    const moves = this.getAllLegalMoves();
    if (moves.length === 0) return null;
    const state = this.saveState();
    let bestScore = this.aiColor === 'white' ? -Infinity : Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      this.doMove(m.fromR, m.fromC, m.toR, m.toC);
      const score = this.minimax(1, false);
      this.restoreState(state);
      const better = this.aiColor === 'white' ? score > bestScore : score < bestScore;
      if (better) {
        bestScore = score;
        bestMove = m;
      }
    }
    return bestMove;
  }

  minimax(depth, isAITurn) {
    if (this.gameOver) {
      if (this.check) return (this.turn === this.aiColor ? -1000 : 1000) * (depth + 1);
      return 0;
    }
    if (depth >= 2) return this.evaluateBoard();
    const moves = this.getAllLegalMoves();
    if (moves.length === 0) return this.evaluateBoard();
    const state = this.saveState();
    const maximize = (this.aiColor === 'white' && isAITurn) || (this.aiColor === 'black' && !isAITurn);
    let best = maximize ? -Infinity : Infinity;
    for (const m of moves) {
      this.doMove(m.fromR, m.fromC, m.toR, m.toC);
      const score = this.minimax(depth + 1, !isAITurn);
      this.restoreState(state);
      if (maximize) best = Math.max(best, score);
      else best = Math.min(best, score);
    }
    return best;
  }

  getAIMove() {
    if (this.aiDifficulty === 'easy') return this.aiEasy();
    if (this.aiDifficulty === 'medium') return this.aiMedium();
    return this.aiHard();
  }

  maybeTriggerAI() {
    if (this.gameOver || this.gameMode !== 'ai' || this.turn !== this.aiColor) return;
    const delay = this.aiDifficulty === 'hard' ? 600 : 400;
    setTimeout(() => {
      if (this.gameOver || this.turn !== this.aiColor) return;
      const m = this.getAIMove();
      if (m) this.move(m.fromR, m.fromC, m.toR, m.toC);
    }, delay);
  }

  bindEvents() {
    document.getElementById('chessboard').addEventListener('click', (e) => {
      if (this.gameOver) return;
      const sq = e.target.closest('.square');
      if (!sq) return;
      const row = parseInt(sq.dataset.row, 10);
      const col = parseInt(sq.dataset.col, 10);
      if (row < 0 || row > 7 || col < 0 || col > 7) return;
      const valid = this.validMoves.find(m => m.row === row && m.col === col);
      if (valid) {
        this.move(this.selected.row, this.selected.col, row, col);
        return;
      }
      const piece = this.board[row][col];
      if (piece && getPieceColor(piece) === this.turn) {
        this.selected = { row, col };
        this.validMoves = this.getValidMoves(row, col);
      } else {
        this.selected = null;
        this.validMoves = [];
      }
      this.render();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
      this.readModeFromDOM();
      this.board = INITIAL_BOARD.map(row => [...row]);
      this.turn = 'white';
      this.selected = null;
      this.validMoves = [];
      this.gameOver = false;
      this.check = null;
      this.initBoard();
      this.updateStatus();
      this.maybeTriggerAI();
    });

    document.querySelectorAll('input[name="mode"]').forEach(el => {
      el.addEventListener('change', () => this.readModeFromDOM());
    });

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        const lang = langSelect.value;
        if (I18N[lang]) {
          try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
          applyLanguage();
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  new ChessGame();
});
