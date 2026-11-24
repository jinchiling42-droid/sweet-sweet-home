import computer from './assets/opening/computer.png';
import cake from './assets/opening/strawberry-cake.png';
import cakeLit from './assets/opening/strawberry-cake-lit.png';
import type { Text } from './game';

export type OpeningAction = 'start' | 'inspectCake';
export type OpeningObjectConfig = {
  id: string;
  action: OpeningAction;
  image: string;
  candleImage?: string;
  x: number;
  y: number;
  width: number;
  layer: number;
  opacity: number;
  imageRendering: 'auto' | 'pixelated';
  hoverBrightness: number;
  hitArea: { alphaThreshold: number };
  label: Text;
  candleLabel?: Text;
};

// All coordinates use this design canvas. The rendered scene scales as a unit.
export const openingScene = {
  width: 1200,
  height: 750,
  background: '#deded5',
};

// To replace the text title with a PNG, WebP or GIF, import it and assign `image`.
export const openingTitle: { lines: readonly string[]; x: number; y: number; width: number; image?: string } = {
  lines: ['Sweet', 'Sweet Home'],
  x: 105,
  y: 91,
  width: 660,
};

// Width sets the scale; height follows the actual image aspect ratio.
// Transparent pixels below alphaThreshold are excluded from mouse/touch hits.
export const openingObjects: readonly OpeningObjectConfig[] = [
  {
    id: 'computer', action: 'start', image: computer,
    x: 432, y: 230, width: 440, layer: 2, opacity: 1,
    imageRendering: 'pixelated', hoverBrightness: 1.1,
    hitArea: { alphaThreshold: 48 }, label: ['컴퓨터 켜기', '打开电脑'],
  },
  {
    id: 'cake', action: 'inspectCake', image: cake, candleImage: cakeLit,
    x: 922, y: 452, width: 160, layer: 3, opacity: 1,
    imageRendering: 'auto', hoverBrightness: 1.07,
    hitArea: { alphaThreshold: 48 }, label: ['케이크 살펴보기', '查看蛋糕'],
    candleLabel: ['촛불이 꽂힌 케이크 살펴보기', '查看插着蜡烛的蛋糕'],
  },
];
