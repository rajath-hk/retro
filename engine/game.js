export const ENTITY = {
  EMPTY: 0,
  BODY: 1,
  FOOD: 2,
  HEAD: 3
};

const DIRECTIONS = {
  UP: [0, -1],
  DOWN: [0, 1],
  LEFT: [-1, 0],
  RIGHT: [1, 0]
};

const OPPOSITE_DIRECTION = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

function speedForLevel(level) {
  return Math.max(70, 200 - ((level - 1) * 15));
}

export class Game {
  constructor(boardConfig, state = null) {
    this.width = boardConfig.width;
    this.height = boardConfig.height;

    if (state) {
      this.state = state;
      this.ensureStateDefaults();
    } else {
      this.initNewGame();
    }
  }

  ensureStateDefaults() {
    this.state.score ??= 0;
    this.state.tick ??= 0;
    this.state.gameOver ??= false;
    this.state.win ??= false;
    this.state.snake ??= [];
    this.state.dir ??= 'RIGHT';
    this.state.intendedDir ??= this.state.dir;
    this.state.food ??= null;
    this.state.foodsEaten ??= 0;
    this.state.level ??= 1;
    this.state.speedMs ??= speedForLevel(this.state.level);
  }

  initNewGame() {
    const startX = Math.floor(this.width / 2);
    const startY = Math.floor(this.height / 2);

    this.state = {
      score: 0,
      tick: 0,
      gameOver: false,
      win: false,
      snake: [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ],
      dir: 'RIGHT',
      intendedDir: 'RIGHT',
      food: null,
      foodsEaten: 0,
      level: 1,
      speedMs: speedForLevel(1)
    };

    this.spawnFood();
  }

  tick() {
    if (this.state.gameOver) return;

    this.state.tick++;
    this.state.dir = this.state.intendedDir;

    const head = this.state.snake[0];
    const [dx, dy] = DIRECTIONS[this.state.dir];
    const nextHead = { x: head.x + dx, y: head.y + dy };

    if (!this.isInsideBoard(nextHead.x, nextHead.y)) {
      this.state.gameOver = true;
      this.state.win = false;
      return;
    }

    const isGrowing = this.state.food && nextHead.x === this.state.food.x && nextHead.y === this.state.food.y;
    const bodyToCheck = isGrowing ? this.state.snake : this.state.snake.slice(0, -1);

    if (bodyToCheck.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
      this.state.gameOver = true;
      this.state.win = false;
      return;
    }

    this.state.snake.unshift(nextHead);

    if (isGrowing) {
      this.state.score += 10;
      this.state.foodsEaten++;
      this.updateDifficulty();

      if (this.state.snake.length >= this.width * this.height) {
        this.state.food = null;
        this.state.gameOver = true;
        this.state.win = true;
        return;
      }

      this.spawnFood();
    } else {
      this.state.snake.pop();
    }
  }

  updateDifficulty() {
    this.state.level = 1 + Math.floor(this.state.foodsEaten / 5);
    this.state.speedMs = speedForLevel(this.state.level);
  }

  isInsideBoard(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  spawnFood() {
    const occupied = new Set(this.state.snake.map(seg => `${seg.x},${seg.y}`));
    const emptySpots = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!occupied.has(`${x},${y}`)) {
          emptySpots.push({ x, y });
        }
      }
    }

    if (emptySpots.length === 0) {
      this.state.food = null;
      this.state.gameOver = true;
      this.state.win = true;
      return;
    }

    const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    this.state.food = { x: spot.x, y: spot.y };
  }

  setIntendedDir(dir) {
    if (!DIRECTIONS[dir]) return;

    const isReverse = dir === OPPOSITE_DIRECTION[this.state.dir];
    if (isReverse && this.state.snake.length > 1) return;

    this.state.intendedDir = dir;
  }

  getState() {
    return this.state;
  }
}
