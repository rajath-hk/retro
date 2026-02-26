
// Entity Types
export const ENTITY = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER_PILLET: 3,
  PACMAN: 4,
  GHOST: 5,
  FRUIT: 6
};

// Directions: [dx, dy]
const DIRECTIONS = {
  UP: [0, -1],
  DOWN: [0, 1],
  LEFT: [-1, 0],
  RIGHT: [1, 0]
};

export class Game {
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
      ghosts: [],
      intendedDir: 'RIGHT',
      powerTicks: 0,
      dotCount: 0,
      nextExtraLife: 10000
    };

    // Find start positions
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.layout[y].length; x++) {
        if (this.layout[y][x] === ENTITY.PACMAN) {
          this.state.pacman = { x, y, dir: 'RIGHT' };
          this.state.pacmanStart = { x, y };
          this.layout[y][x] = ENTITY.EMPTY; // Clear start pos from map
        } else if (this.layout[y][x] === ENTITY.GHOST) { // Ghost Start
          this.state.ghosts.push({ x, y, dir: 'LEFT', id: this.state.ghosts.length, startX: x, startY: y });
          this.layout[y][x] = ENTITY.EMPTY;
        }
      }
    }

    // If no ghosts found (e.g. custom map issues), add defaults
    if (this.state.ghosts.length === 0) {
      this.state.ghosts.push({ x: 12, y: 3, dir: 'LEFT', id: 0, startX: 12, startY: 3 });
      this.state.ghosts.push({ x: 14, y: 3, dir: 'RIGHT', id: 1, startX: 14, startY: 3 });
    }

    // Count dots
    this.state.dotCount = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.layout[y].length; x++) {
        if (this.layout[y][x] === ENTITY.DOT) {
          this.state.dotCount++;
        }
      }
    }
  }

  tick() {
    if (this.state.gameOver) return;

    this.state.tick++;

    // 1. Move Pacman
    this.movePacman();

    // 2. Move Ghosts
    this.moveGhosts();

    // 3. Update power mode
    if (this.state.powerTicks > 0) {
      this.state.powerTicks--;
    }

    // 4. Check Collisions
    this.checkCollisions();

    // 5. Spawn fruit periodically
    if (this.state.tick % 500 === 0) {
      this.spawnFruit();
    }

    // 6. Update Map State in state object for persistence
    this.state.mapState = this.layout;
  }

  movePacman() {
    const { x, y, dir } = this.state.pacman;
    let moveDir = dir;

    // Check if intended direction is valid
    if (this.state.intendedDir !== dir) {
      const [idx, idy] = DIRECTIONS[this.state.intendedDir];
      if (this.isValidMove(x + idx, y + idy)) {
        moveDir = this.state.intendedDir;
        this.state.pacman.dir = moveDir;
      }
    }

    const [dx, dy] = DIRECTIONS[moveDir];
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
        this.state.dotCount--;
        if (this.state.dotCount <= 0) {
          this.state.gameOver = true; // Win!
        }
      } else if (cell === ENTITY.POWER_PILLET) {
        this.state.score += 50;
        this.layout[nextY][nextX] = ENTITY.EMPTY;
        this.state.powerTicks = 100; // 10 seconds at 200ms/tick
      } else if (cell === ENTITY.FRUIT) {
        this.state.score += 100;
        this.layout[nextY][nextX] = ENTITY.EMPTY;
      }

      // Check for extra life milestones
      if (this.state.score >= this.state.nextExtraLife) {
        this.state.lives++;
        this.state.nextExtraLife += 10000; // Every 10,000 points
      }
    }
    // If blocked, do nothing (Pac-Man stops)
  }

  moveGhosts() {
    const px = this.state.pacman.x;
    const py = this.state.pacman.y;

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
        // Choose direction towards Pac-Man
        const validDirs = Object.keys(DIRECTIONS).filter(d => {
          const [dx, dy] = DIRECTIONS[d];
          return this.isValidMove(x + dx, y + dy);
        });

        if (validDirs.length > 0) {
          let bestDir = validDirs[0];
          let minDist = Infinity;
          validDirs.forEach(d => {
            const [dx, dy] = DIRECTIONS[d];
            const nx = x + dx;
            const ny = y + dy;
            const dist = Math.abs(nx - px) + Math.abs(ny - py);
            if (dist < minDist) {
              minDist = dist;
              bestDir = d;
            }
          });
          ghost.dir = bestDir;
          const [ndx, ndy] = DIRECTIONS[bestDir];
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
        if (this.state.powerTicks > 0) {
          // Eat ghost
          this.state.score += 200;
          ghost.x = ghost.startX;
          ghost.y = ghost.startY;
          ghost.dir = 'LEFT'; // Reset dir
        } else {
          // Lose life
          this.state.lives--;
          if (this.state.lives <= 0) {
            this.state.gameOver = true;
          } else {
            // Reset positions
            this.state.pacman.x = this.state.pacmanStart.x;
            this.state.pacman.y = this.state.pacmanStart.y;
            this.state.pacman.dir = 'RIGHT';
            this.state.ghosts.forEach(g => {
              g.x = g.startX;
              g.y = g.startY;
              g.dir = 'LEFT';
            });
          }
        }
      }
    });
  }

  spawnFruit() {
    // Find empty spots
    const emptySpots = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.layout[y][x] === ENTITY.EMPTY) {
          emptySpots.push({ x, y });
        }
      }
    }
    if (emptySpots.length > 0) {
      const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
      this.layout[spot.y][spot.x] = ENTITY.FRUIT;
    }
  }

  setIntendedDir(dir) {
    this.state.intendedDir = dir;
  }

  getState() {
    return this.state;
  }
}
