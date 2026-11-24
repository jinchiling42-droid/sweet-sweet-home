import room from './assets/source/original-room.png';
import computerHotspot from './assets/opening/computer-hotspot.png';
import cake from './assets/opening/strawberry-cake.png';
import cakeLit from './assets/opening/strawberry-cake-lit.png';
import type { Text } from './game';

export type OpeningAction = 'start' | 'inspectCake';
export type OpeningObjectConfig = {
  id: string;
  action: OpeningAction;
  image: string;
  candleImage?: string;
  roomRegionHeight?: number;
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

// Positions and crop bounds are measured directly in the original room's pixels.
// Everything scales together inside the selected 16:9 area.
export const openingScene = {
  room: { image: room, width: 736, height: 736 },
  crop: { x: 8, y: 316, width: 352, height: 198 },
  background: '#ffffff',
};

// To replace the text title with a PNG, WebP or GIF, import it and assign `image`.
export const openingTitle: { lines: readonly string[]; x: number; y: number; width: number; image?: string } = {
  lines: ['Sweet', 'Sweet Home'],
  x: 18,
  y: 358,
  width: 94,
};

// Width sets the scale; height follows the actual image aspect ratio.
// Transparent pixels below alphaThreshold are excluded from mouse/touch hits.
export const openingObjects: readonly OpeningObjectConfig[] = [
  {
    // The computer is already painted into the room. This alpha image is its
    // visible silhouette and only exposes the matching room pixels on hover.
    id: 'computer', action: 'start', image: computerHotspot, roomRegionHeight: 121,
    x: 115, y: 337, width: 129, layer: 2, opacity: 1,
    imageRendering: 'pixelated', hoverBrightness: 1.1,
    hitArea: { alphaThreshold: 48 }, label: ['컴퓨터 켜기', '打开电脑'],
  },
  {
    id: 'cake', action: 'inspectCake', image: cake, candleImage: cakeLit,
    x: 246, y: 364, width: 37, layer: 3, opacity: 1,
    imageRendering: 'auto', hoverBrightness: 1.07,
    hitArea: { alphaThreshold: 48 }, label: ['케이크 살펴보기', '查看蛋糕'],
    candleLabel: ['촛불이 꽂힌 케이크 살펴보기', '查看插着蜡烛的蛋糕'],
  },
];
