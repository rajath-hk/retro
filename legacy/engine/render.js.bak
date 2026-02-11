import { ENTITY } from './game.js';

// Brightness Levels
// 0: Empty/Wall-Negative
// 1: Wall/Path (Low)
// 2: Dot (Medium)
// 3: Power (Medium-High)
// 4: Actor (High)

const BRIGHTNESS = {
    EMPTY: 0,
    WALL: 0, // Using negative space for walls for better contrast? Or 1? Let's try 1 for Retro Green monitor look.
    // Actually, on GitHub, empty is background color. 
    // If we want the maze to look "lit", we should maybe make walls 0 and paths 1? 
    // Or Walls 1 and Paths 0?
    // Classic Pacman: Black bg, Blue walls.
    // GitHub: White/Dark bg, Green pixels.
    // Let's make Walls = 2 (visible), Paths = 0 (empty), Dots = 1, Pacman/Ghost = 4.
    // Wait, typically paths are black, dots are white.
    // Let's try:
    // Background (Path/Empty): 0
    // Wall: 1
    // Dot: 2
    // Power: 3
    // Ghost/Pacman: 4
};

export function renderFrame(game) {
    const layout = game.layout;
    const { pacman, ghosts } = game.state;
    const pixels = [];

    for (let y = 0; y < game.height; y++) {
        const row = [];
        for (let x = 0; x < game.width; x++) {
            let brightness = 0;
            const cell = layout[y][x];

            // Base Map
            if (cell === ENTITY.WALL) {
                brightness = 3; // Wall - Dark Green 
            } else if (cell === ENTITY.DOT) {
                brightness = 1; // Dot - Light Green
            } else if (cell === ENTITY.POWER_PILLET) {
                brightness = 2; // Power - Medium Green
            } else {
                brightness = 0; // Empty path
            }

            // Entities overlap
            if (pacman.x === x && pacman.y === y) {
                brightness = 4; // Max brightness
            }

            ghosts.forEach(g => {
                if (g.x === x && g.y === y) {
                    brightness = 4; // Max brightness
                }
            });

            row.push(brightness);
        }
        pixels.push(row);
    }
    return pixels;
}
