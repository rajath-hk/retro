# GitHub Contribution Graph Pac-Man

This repository hosts a self-playing Pac-Man game that renders its display on your GitHub Contribution Graph!

## How it works
1. **The Screen**: Your GitHub profile's contribution graph is treated as a 7x28 pixel grid.
2. **The Output**: "Pixels" are drawn by creating varying numbers of git commits on specific past dates.
   - 0 commits = Empty
   - 1-2 commits = Wall
   - 4 commits = Dot
   - 15+ commits = Character
3. **The Engine**: A Node.js script (`engine/`) runs every 30 minutes via GitHub Actions.
   - Loads the previous game state.
   - Moves Pac-Man and Ghosts.
   - Saves the new state to `main` branch.
   - Generates a batch of commits representing the new frame.
   - Force-pushes these commits to a `display-layer` branch.

## Setup
1. **Fork/Clone** this repository.
2. **Enable Actions**: Go to `Settings > Actions > General` and ensure Read and write permissions are enabled for workflows.
3. **Profile Settings**: Ensure your GitHub profile is set to show contributions from "All" or specifically includes the `display-layer` branch if that option exists (usually "Include private contributions" covers it if the repo is private, or "Show contributions from private repositories").
   - *Note*: Since this writes to a branch in *this* repo, as long as this repo is public, it should show up. If private, ensure you have "Private contributions" enabled on your profile.

## Usage
The game runs automatically on a schedule.
- To reset the game, delete `engine/state.json` and commit.
- To modify the map, edit `engine/map.json`.

## Structure
- `engine/`: content of the game engine.
- `.github/workflows/`: The automation runner.
- `display-layer`: A transient branch where the "visuals" live. Do not check out this branch manually unless debugging.

## Disclaimer
This project uses `git push --force` on the `display-layer` branch. This is by design. It creates a large number of dummy commits.
