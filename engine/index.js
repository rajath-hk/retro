const fs = require('fs');
const path = require('path');
const { Game } = require('./game');
const { renderFrame } = require('./render');
const { generateCommitScript } = require('./commit');

const STATE_FILE = path.join(__dirname, 'state.json');
const MAP_FILE = path.join(__dirname, 'map.json');
const OUTPUT_SCRIPT = 'commit.sh';
const SCREEN_DUMP = 'screen.txt';

async function main() {
    console.log("Loading Map...");
    const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

    let state = null;
    if (fs.existsSync(STATE_FILE)) {
        console.log("Loading State...");
        try {
            state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            console.error("State file corrupted, starting fresh.");
        }
    }

    const game = new Game(mapData, state);

    // Run Game Tick
    console.log("Running Game Tick...");
    game.tick();

    // Save New State
    console.log("Saving State...");
    fs.writeFileSync(STATE_FILE, JSON.stringify(game.getState(), null, 2));

    // Render
    console.log("Rendering Frame...");
    const pixels = renderFrame(game);

    // Dump Screen for Debug
    const screenStr = pixels.map(row => row.map(b => b === 0 ? ' ' : b === 1 ? '#' : b === 2 ? '.' : b === 4 ? 'C' : String(b)).join('')).join('\n');
    fs.writeFileSync(SCREEN_DUMP, screenStr);
    console.log("Screen:\n" + screenStr);

    // Generate Commit Script
    console.log("Generating Commit Script...");
    const scriptContent = generateCommitScript(pixels);
    fs.writeFileSync(OUTPUT_SCRIPT, scriptContent);
    // Determine OS and make executable if needed? 
    // Handled by runner usually.

    console.log("Done.");
}

main().catch(console.error);
