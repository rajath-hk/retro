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
let mapData = null;

// DOM Elements
const gridEl = document.getElementById('contribution-graph');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const scoreEl = document.getElementById('score-display');
const livesEl = document.getElementById('lives-display');

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
}

function tick() {
    if (!game) return;
    game.tick();
    updateDisplay();

    if (game.state.gameOver) {
        stopGame();
        alert(`Game Over! Score: ${game.state.score}`);
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

async function init() {
    initGrid();
    mapData = await loadMap();
    game = new Game(mapData);
    updateDisplay(); // Render initial state

    startBtn.addEventListener('click', () => {
        if (isPlaying) stopGame();
        else startGame();
    });

    resetBtn.addEventListener('click', () => {
        stopGame();
        game = new Game(mapData);
        updateDisplay();
    });
}

init();
