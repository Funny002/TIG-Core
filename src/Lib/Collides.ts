import type { Bounding, Point } from '../Core';

/**
 * 轴对齐包围盒（AABB）相交检测
 */
export function boundsIntersect(a: Bounding, b: Bounding): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

/**
 * 圆与圆碰撞检测
 */
export function circleCollide(
  cx1: number, cy1: number, r1: number,
  cx2: number, cy2: number, r2: number,
): boolean {
  const dx = cx1 - cx2;
  const dy = cy1 - cy2;
  const r = r1 + r2;
  return dx * dx + dy * dy <= r * r;
}

/**
 * 圆与矩形（AABB）碰撞检测
 */
export function circleRectCollide(cx: number, cy: number, r: number, rect: Bounding): boolean {
  const closestX = Math.max(rect.left, Math.min(cx, rect.right));
  const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

/**
 * 点到线段的距离
 */
export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const len2 = abx * abx + aby * aby;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2));
  const px = a.x + t * abx;
  const py = a.y + t * aby;
  return Math.hypot(p.x - px, p.y - py);
}

/** 二维向量叉积 */
function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** 判断点 c 是否在线段 ab 上（假设共线） */
function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y)
  );
}

/**
 * 线段与线段相交检测
 */
export function segmentIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  // 共线情况
  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

/**
 * 计算一组点的紧凑包围盒
 * @param points - 点集
 * @param fallback - 点集为空时的回退坐标
 */
export function computeBounds(points: Point[], fallback: Point): Bounding {
  if (points.length === 0) {
    return { top: fallback.y, left: fallback.x, right: fallback.x, bottom: fallback.y, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return {
    top: minY,
    left: minX,
    right: maxX,
    bottom: maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 点是否在多边形内（射线法）
 * @param point - 目标点
 * @param vertices - 多边形顶点（按顺序）
 */
export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  const n = vertices.length;
  if (n < 3) return false;

  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}
