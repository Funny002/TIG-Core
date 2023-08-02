import { Shape } from '@core/Shape';

export function getPixel(bitmap: ImageData, x: number, y: number): Uint8ClampedArray {
  const index = (y * bitmap.width + x) * 4;
  return bitmap.data.slice(index, index + 4);
}

export function boxCrash(p1: Shape, p2: Shape) {
  return (p1.left < p2.left + p2.size.width && p1.left + p1.size.width > p2.left && p1.top < p2.top + p2.size.height && p1.top + p1.size.height > p2.top);
}

export function bitmapCrash(p1: Shape, p2: Shape) {
  const [p1_bit, p2_bit] = [p1.bitmap, p2.bitmap];
  if (!p1_bit || !p2_bit) return false;
  const [p1_box, p2_box] = [{ left: p1.left, top: p1.top, ...p1.size }, { left: p2.left, top: p2.top, ...p2.size }];
  const box = {
    top: Math.max(p1_box.top, p2_box.top),
    left: Math.max(p1_box.left, p2_box.left),
    height: Math.min(p1_box.top + p1_box.height, p2_box.top + p2_box.height) - Math.max(p1_box.top, p2_box.top),
    width: Math.min(p1_box.left + p1_box.width, p2_box.left + p2_box.width) - Math.max(p1_box.left, p2_box.left),
  };
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const pixel1 = getPixel(p1_bit, x + box.left - p1.left, y + box.top - p1.top);
      const pixel2 = getPixel(p2_bit, x + box.left - p2.left, y + box.top - p2.top);
      if (pixel1[3] !== 0 && pixel2[3] !== 0) {
        return true;
      }
    }
  }
  return false;
}
