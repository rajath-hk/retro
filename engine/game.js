const fs = require('fs');
const path = require('path');

// Entity Types
const ENTITY = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER_PILLET: 3,
  PACMAN: 4,
  GHOST: 5
};

// Directions: [dx, dy]
const DIRECTIONS = {
  UP: [0, -1],
  DOWN: [0, 1],
  LEFT: [-1, 0],
  RIGHT: [1, 0]
};

class Game {
  constructor(mapData, state = null) {
    this.width = mapData.width;
    this.height = mapData.height;
    this.layout = JSON.parse(JSON.stringify(mapData.layout)); // Deep copy to modify
    
    if (state) {
      this.state = state;
      // Restore map state (dots eaten etc) if provided
      if (this.state.mapState) {
        this.layout = this.state.mapState;
      }
    } else {
      this.initNewGame();
    }
  }

  initNewGame() {
    this.state = {
      score: 0,
      lives: 3,
      tick: 0,
      gameOver: false,
      mapState: null,
      pacman: { x: 1, y: 1, dir: 'RIGHT' }, // Default, will find in map
      ghosts: []
    };
    
    // Find start positions
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.layout[y].length; x++) {
        if (this.layout[y][x] === ENTITY.PACMAN) {
          this.state.pacman = { x, y, dir: 'RIGHT' };
          this.layout[y][x] = ENTITY.EMPTY; // Clear start pos from map
        } else if (this.layout[y][x] === ENTITY.GHOST) { // Ghost Start
          this.state.ghosts.push({ x, y, dir: 'LEFT', id: this.state.ghosts.length });
          this.layout[y][x] = ENTITY.EMPTY;
        }
      }
    }
    
    // If no ghosts found (e.g. custom map issues), add defaults
    if (this.state.ghosts.length === 0) {
        this.state.ghosts.push({x: 12, y: 3, dir: 'LEFT', id: 0});
        this.state.ghosts.push({x: 14, y: 3, dir: 'RIGHT', id: 1});
    }
  }

  tick() {
    if (this.state.gameOver) return;

    this.state.tick++;
    
    // 1. Move Pacman
    this.movePacman();
    
    // 2. Move Ghosts
    this.moveGhosts();
    
    // 3. Check Collisions
    this.checkCollisions();
    
    // 4. Update Map State in state object for persistence
    this.state.mapState = this.layout;
  }

  movePacman() {
    const { x, y, dir } = this.state.pacman;
    const [dx, dy] = DIRECTIONS[dir];
    const nextX = x + dx;
    const nextY = y + dy;

    // Check bounds and walls
    if (this.isValidMove(nextX, nextY)) {
      this.state.pacman.x = nextX;
      this.state.pacman.y = nextY;
      
      // Eat Content
      const cell = this.layout[nextY][nextX];
      if (cell === ENTITY.DOT) {
        this.state.score += 10;
        this.layout[nextY][nextX] = ENTITY.EMPTY;
      } else if (cell === ENTITY.POWER_PILLET) {
        this.state.score += 50;
        this.layout[nextY][nextX] = ENTITY.EMPTY;
        // TODO: Implement Power Mode
      }
    } else {
        // Try to find a valid direction if blocked
        // Simple AI: stick to walls? Random? for now just stop or turn random.
        // Actually, let's just pick a random valid direction if blocked to keep it moving.
        const validDirs = Object.keys(DIRECTIONS).filter(d => {
            const [dx, dy] = DIRECTIONS[d];
            return this.isValidMove(x + dx, y + dy);
        });
        
        if (validDirs.length > 0) {
            this.state.pacman.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
    }
  }

  moveGhosts() {
    this.state.ghosts.forEach(ghost => {
      const { x, y, dir } = ghost;
      const [dx, dy] = DIRECTIONS[dir];
      const nextX = x + dx;
      const nextY = y + dy;

      // 80% chance to continue, 20% to turn at intersections?
      // Simple logic: if blocked, must turn.
      if (this.isValidMove(nextX, nextY) && Math.random() > 0.2) {
        ghost.x = nextX;
        ghost.y = nextY;
      } else {
        // Pick random valid new direction
         const validDirs = Object.keys(DIRECTIONS).filter(d => {
            const [dx, dy] = DIRECTIONS[d];
            return this.isValidMove(x + dx, y + dy);
        });
        
        if (validDirs.length > 0) {
            ghost.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            const [ndx, ndy] = DIRECTIONS[ghost.dir];
            ghost.x += ndx;
            ghost.y += ndy;
        }
      }
    });
  }

  isValidMove(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.layout[y][x] !== ENTITY.WALL;
  }

  checkCollisions() {
    const px = this.state.pacman.x;
    const py = this.state.pacman.y;

    this.state.ghosts.forEach(ghost => {
      if (ghost.x === px && ghost.y === py) {
        // Collision!
        this.state.lives--;
        if (this.state.lives <= 0) {
          this.state.gameOver = true;
          // Optionally reset game
          this.initNewGame(); 
        } else {
            // Reset positions
            // TODO: Better reset logic
            this.state.pacman.x = 1; 
            this.state.pacman.y = 1;
        }
      }
    });
  }

  getState() {
    return this.state;
  }
}

module.exports = { Game, ENTITY };
