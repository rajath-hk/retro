import { Game } from './engine/game.js';
import { renderFrame } from './engine/render.js';

const COLS = 53;
const ROWS = 7;

let game = null;
let gameInterval = null;
let isPlaying = false;
let isPaused = false;
let currentSpeedMs = 200;
let highScore = 0;

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playSound(frequency, duration, type = 'sine', volume = 0.08) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (_e) {
    // Ignore if Web Audio is unavailable.
  }
}

function playEat() { playSound(700, 0.07, 'square'); }
function playDeath() { playSound(180, 0.35, 'sawtooth'); }
function playWin() { playSound(1000, 0.3, 'triangle'); }

const gridEl = document.getElementById('contribution-graph');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const scoreEl = document.getElementById('score-display');
const lengthEl = document.getElementById('length-display');
const levelEl = document.getElementById('level-display');
const speedEl = document.getElementById('speed-display');
const highScoreEl = document.getElementById('high-score-display');
const statusEl = document.getElementById('status-display');

function initGrid() {
  gridEl.innerHTML = '';
  gridEl.style.gridAutoFlow = 'column';

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const el = document.createElement('div');
      el.className = 'pixel level-0';
      el.id = `px-${c}-${r}`;
      gridEl.appendChild(el);
    }
  }
}

function applyTickRate(ms) {
  currentSpeedMs = ms;
  if (!isPlaying) return;
  clearInterval(gameInterval);
  gameInterval = setInterval(tick, currentSpeedMs);
}

function updateDisplay() {
  if (!game) return;

  const pixels = renderFrame(game);
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const cell = document.getElementById(`px-${x}-${y}`);
      if (cell) {
        cell.className = `pixel level-${pixels[y][x]}`;
      }
    }
  }

  scoreEl.innerText = `Score: ${game.state.score}`;
  lengthEl.innerText = `Length: ${game.state.snake.length}`;
  levelEl.innerText = `Level: ${game.state.level}`;
  speedEl.innerText = `Speed: ${game.state.speedMs}ms`;
  if (statusEl) {
    statusEl.innerText = game.state.gameOver ? (game.state.win ? 'Status: You Win' : 'Status: Game Over') : (isPaused ? 'Status: Paused' : 'Status: Running');
  }
}

function tick() {
  if (!game || isPaused) return;

  const prevScore = game.state.score;
  const prevSpeed = game.state.speedMs;

  game.tick();

  if (game.state.score > prevScore) {
    playEat();
  }

  if (game.state.speedMs !== prevSpeed) {
    applyTickRate(game.state.speedMs);
  }

  updateDisplay();

  if (game.state.gameOver) {
    stopGame();

    if (game.state.score > highScore) {
      highScore = game.state.score;
      localStorage.setItem('snake-high-score', String(highScore));
      highScoreEl.innerText = `High Score: ${highScore}`;
    }

    if (game.state.win) {
      playWin();
      alert(`You filled the board! Score: ${game.state.score}`);
    } else {
      playDeath();
      alert(`Game Over! Score: ${game.state.score}`);
    }
  }
}

function startGame() {
  if (isPlaying || !game || game.state.gameOver) return;
  isPlaying = true;
  isPaused = false;
  pauseBtn.innerText = 'Pause';
  applyTickRate(game.state.speedMs);
  startBtn.innerText = 'Running...';
  updateDisplay();
}

function stopGame() {
  isPlaying = false;
  isPaused = false;
  clearInterval(gameInterval);
  startBtn.innerText = 'Start Game';
  pauseBtn.innerText = 'Pause';
  updateDisplay();
}

function pauseGame() {
  if (!isPlaying) return;
  isPaused = !isPaused;
  pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';
  updateDisplay();
}

function resetGame() {
  stopGame();
  game = new Game({ width: COLS, height: ROWS });
  updateDisplay();
}

function setupControls() {
  document.addEventListener('keydown', (e) => {
    if (!game) return;
    let dir = null;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dir = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dir = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dir = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dir = 'RIGHT';
        break;
      case 'p':
      case 'P':
        pauseGame();
        e.preventDefault();
        return;
      default:
        return;
    }

    game.setIntendedDir(dir);
    e.preventDefault();
  });

  startBtn.addEventListener('click', () => {
    if (isPlaying) {
      stopGame();
    } else if (game?.state.gameOver) {
      resetGame();
      startGame();
    } else {
      startGame();
    }
  });

  pauseBtn.addEventListener('click', pauseGame);
  resetBtn.addEventListener('click', resetGame);
}

function init() {
  initGrid();
  game = new Game({ width: COLS, height: ROWS });

  highScore = parseInt(localStorage.getItem('snake-high-score') || '0', 10) || 0;
  highScoreEl.innerText = `High Score: ${highScore}`;

  setupControls();
  updateDisplay();
}

init();
