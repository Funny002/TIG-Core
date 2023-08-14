import { Shape, Point } from '../core/Shape';
import { Color } from '../style/color';

export function getPixel(bitmap: ImageData, x: number, y: number) {
  const index = (y * bitmap.width + x) * 4;
  return bitmap.data.slice(index, index + 4);
}

export function getColor(bitmap: ImageData, x: number, y: number) {
  const [r, g, b, a] = getPixel(bitmap, x, y);
  return new Color(`rgba(${ r }, ${ g }, ${ b }, ${ a })`);
}

// 盒检测
export function boxCollide(p1: Shape, p2: Shape) {
  return (p1.left < p2.left + p2.size.width && p1.left + p1.size.width > p2.left && p1.top < p2.top + p2.size.height && p1.top + p1.size.height > p2.top);
}

// 圆检测
function circleCollide(p1: Shape, p2: Shape) {
  if (!boxCollide(p1, p2)) return false;
  const [x1, y1, r1] = [p1.left + p1.size.width / 2, p1.top + p1.size.height / 2, p1['radius']];
  const [x2, y2, r2] = [p2.left + p2.size.width / 2, p2.top + p2.size.height / 2, p2['radius']];
  const [x, y] = [x1 - x2, y1 - y2];
  return (r1 + r2) > Math.sqrt(x * x + y * y);
}

// 多边形检测
function polygonCollide(p1: Shape, p2: Shape) {
  if (!boxCollide(p1, p2)) return false;
  const p1_points = [...p1.children as Point[]].map(v => ({ x: v.x + p1.left, y: v.y + p1.top }));
  const p2_points = [...p2.children as Point[]].map(v => ({ x: v.x + p2.left, y: v.y + p2.top }));
  // 坐标修正
  const [p1_length, p2_length] = [p1_points.length, p2_points.length];
  for (let i = 0; i < p1_length; i++) {
    const [p1_point, p1_next_point] = [p1_points[i], p1_points[(i + 1) % p1_length]];
    for (let j = 0; j < p2_length; j++) {
      const [p2_point, p2_next_point] = [p2_points[j], p2_points[(j + 1) % p2_length]];
      const [p1_x, p1_y, p2_x, p2_y] = [p1_point.x, p1_point.y, p2_point.x, p2_point.y];
      const [p1_next_x, p1_next_y, p2_next_x, p2_next_y] = [p1_next_point.x, p1_next_point.y, p2_next_point.x, p2_next_point.y];
      const [p1_x1, p1_y1, p2_x1, p2_y1] = [p1_next_x - p1_x, p1_next_y - p1_y, p2_next_x - p2_x, p2_next_y - p2_y];
      const [p1_x2, p1_y2, p2_x2, p2_y2] = [p2_x - p1_x, p2_y - p1_y, p1_x - p2_x, p1_y - p2_y];
      if ((p1_x1 * p1_y2 - p1_x2 * p1_y1) * (p2_x1 * p2_y2 - p2_x2 * p2_y1) > 0) continue;
      if ((p1_x1 * p2_y2 - p1_x2 * p2_y1) * (p2_x1 * p1_y2 - p2_x2 * p1_y1) > 0) continue;
      return true;
    }
  }
  return false;
}

// 像素检测
export function bitmapCollide(p1: Shape, p2: Shape) {
  if (!boxCollide(p1, p2)) return false;
  const [p1_bit, p2_bit] = [p1.bitmap, p2.bitmap];
  if (!p1_bit || !p2_bit) return false;
  const box = {
    top: Math.max(p1.top, p2.top),
    left: Math.max(p1.left, p2.left),
    height: Math.min(p1.top + p1.size.height, p2.top + p2.size.height) - Math.max(p1.top, p2.top),
    width: Math.min(p1.left + p1.size.width, p2.left + p2.size.width) - Math.max(p1.left, p2.left),
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
