import { ENTITY } from './game.js';

const LEVEL = {
  EMPTY: 0,
  FOOD: 2,
  BODY: 3,
  HEAD: 4
};

export function renderFrame(game) {
  const pixels = [];

  for (let y = 0; y < game.height; y++) {
    pixels.push(new Array(game.width).fill(LEVEL.EMPTY));
  }

  const { snake, food } = game.state;

  if (food && food.y >= 0 && food.y < game.height && food.x >= 0 && food.x < game.width) {
    pixels[food.y][food.x] = LEVEL.FOOD;
  }

  snake.forEach((segment, index) => {
    if (segment.y < 0 || segment.y >= game.height || segment.x < 0 || segment.x >= game.width) return;
    pixels[segment.y][segment.x] = index === 0 ? LEVEL.HEAD : LEVEL.BODY;
  });

  return pixels;
}
