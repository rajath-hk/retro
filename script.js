import { Game, ENTITY } from './engine/game.js';
import { renderFrame } from './engine/render.js';

// Configuration
const REPO_MAP_URL = './engine/map.json'; // We will likely need to adjust map size
// GitHub Graph Size: 53 columns x 7 rows
const COLS = 53;
const ROWS = 7;

let game = null;
let gameInterval = null;
let isPlaying = false;
let isPaused = false;
let mapData = null;
let highScore = 0;

// Sound functions
function playSound(frequency, duration, type = 'sine') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Ignore if Web Audio not supported
    }
}

function playEatDot() { playSound(800, 0.1); }
function playEatPower() { playSound(600, 0.2); }
function playEatGhost() { playSound(400, 0.3); }
function playDeath() { playSound(200, 0.5, 'sawtooth'); }
function playWin() { playSound(1000, 0.5); }

// DOM Elements
const gridEl = document.getElementById('contribution-graph');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const scoreEl = document.getElementById('score-display');
const livesEl = document.getElementById('lives-display');
const highScoreEl = document.getElementById('high-score-display');
const powerTimerEl = document.getElementById('power-timer-display');

// Initialize Grid
function initGrid() {
    gridEl.innerHTML = '';
    // We render column by column to match GitHub SVG structure usually, 
    // but CSS Grid flows Row by Row or Col by Col.
    // Our CSS grid-template-columns: repeat(53, 10px) means we just dump cells 
    // and they wrap? No, grid-auto-flow: column would be needed if we order by column.
    // Let's stick to simple row-major order:
    // Row 0: Col 0...52
    // Row 1: Col 0...52

    // Actually, GitHub graph is usually Column-Major (Days of week vertical).
    // Let's use grid-auto-flow: column; in CSS to make it vertical first?
    gridEl.style.gridAutoFlow = 'column';

    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
            const el = document.createElement('div');
            el.className = 'pixel level-0';
            el.id = `px-${c}-${r}`; // Col-Row
            gridEl.appendChild(el);
        }
    }
}

// Convert Map Data to Grid System
async function loadMap() {
    try {
        const response = await fetch('./engine/map.json');
        const data = await response.json();

        // Resize/Pad logic
        // We need 53 columns, map might be 28.
        const grid = [];
        const padLeft = Math.floor((COLS - data.width) / 2);

        for (let y = 0; y < ROWS; y++) {
            const row = new Array(COLS).fill(ENTITY.EMPTY); // Default empty
            // If row exists in data
            if (y < data.height) {
                // Copy data with padding
                for (let x = 0; x < data.width; x++) {
                    // Check if map data has this cell
                    if (data.layout[y] && data.layout[y][x] !== undefined) {
                        row[x + padLeft] = data.layout[y][x];
                    }
                }
            }
            grid.push(row);
        }

        return {
            width: COLS,
            height: ROWS,
            layout: grid
        };
    } catch (e) {
        console.error("Failed to load map, using fallback", e);
        // Fallback procedural map
        const map = { width: COLS, height: ROWS, layout: [] };
        for (let i = 0; i < ROWS; i++) map.layout.push(new Array(COLS).fill(ENTITY.WALL));
        for (let y = 1; y < ROWS - 1; y++) {
            for (let x = 1; x < COLS - 1; x++) map.layout[y][x] = ENTITY.DOT;
        }
        // Pacman Start
        map.layout[3][26] = ENTITY.PACMAN;
        // Ghost Start
        map.layout[3][24] = ENTITY.GHOST;
        return map;
    }
}

function updateDisplay() {
    if (!game) return;

    const pixels = renderFrame(game);
    // pixels is [Row][Col] (7 rows, N cols)

    for (let y = 0; y < pixels.length; y++) {
        for (let x = 0; x < pixels[y].length; x++) {
            const brightness = pixels[y][x];
            // Update DOM
            const cell = document.getElementById(`px-${x}-${y}`);
            if (cell) {
                cell.className = `pixel level-${brightness}`;
            }
        }
    }

    scoreEl.innerText = `Score: ${game.state.score}`;
    livesEl.innerText = `Lives: ${game.state.lives}`;
    powerTimerEl.innerText = `Power: ${Math.ceil(game.state.powerTicks / 5)}`; // Show seconds
}

function tick() {
    if (!game || isPaused) return;
    game.tick();
    updateDisplay();

    if (game.state.gameOver) {
        stopGame();
        if (game.state.score > highScore) {
            highScore = game.state.score;
            localStorage.setItem('pacman-high-score', highScore);
            highScoreEl.innerText = `High Score: ${highScore}`;
        }
        if (game.state.dotCount <= 0) {
            playWin();
            alert(`You Win! Score: ${game.state.score}`);
        } else {
            playDeath();
            alert(`Game Over! Score: ${game.state.score}`);
        }
    }
}

function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    gameInterval = setInterval(tick, 200); // 200ms tick
    startBtn.innerText = "Running...";
}

function stopGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    startBtn.innerText = "Start Game";
}

function pauseGame() {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "Resume" : "Pause";
}

async function init() {
    initGrid();
    mapData = await loadMap();
    game = new Game(mapData);
    updateDisplay(); // Render initial state

    // Load high score
    highScore = parseInt(localStorage.getItem('pacman-high-score')) || 0;
    highScoreEl.innerText = `High Score: ${highScore}`;

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!game) return;
        let dir = null;
        switch(e.key) {
            case 'ArrowUp': dir = 'UP'; break;
            case 'ArrowDown': dir = 'DOWN'; break;
            case 'ArrowLeft': dir = 'LEFT'; break;
            case 'ArrowRight': dir = 'RIGHT'; break;
        }
        if (dir) {
            game.setIntendedDir(dir);
            e.preventDefault();
        }
    });

    startBtn.addEventListener('click', () => {
        if (isPlaying) stopGame();
        else startGame();
    });

    pauseBtn.addEventListener('click', pauseGame);

    resetBtn.addEventListener('click', () => {
        stopGame();
        game = new Game(mapData);
        updateDisplay();
    });
}

init();
