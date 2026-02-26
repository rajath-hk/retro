import { ENTITY } from './game.js';

// Brightness Levels
// 0: Empty/Wall-Negative
// 1: Wall/Path (Low)
// 2: Dot (Medium)
// 3: Power (Medium-High)
// 4: Actor (High)

const BRIGHTNESS = {
    EMPTY: 0,
    WALL: 3,
    DOT: 1,
    POWER: 2,
    ENTITY: 4
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
            } else if (cell === ENTITY.FRUIT) {
                brightness = 4; // Fruit - Bright Green
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
