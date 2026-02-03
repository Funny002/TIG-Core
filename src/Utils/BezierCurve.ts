import type { Point } from '../Core';

function validatePoint(point: Point) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`无效的点坐标: ${JSON.stringify(point)}`);
  }
}

function validateT(t: number) {
  if (!Number.isFinite(t)) {
    throw new Error(`无效的参数 t: ${t}`);
  }
}

export function linearBezier(p0: Point, p1: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * p0.x + t * p1.x,
    y: u * p0.y + t * p1.y,
  };
}

export function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number) {
  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  return {
    x: u2 * p0.x + 2 * u * t * p1.x + t2 * p2.x,
    y: u2 * p0.y + 2 * u * t * p1.y + t2 * p2.y,
  };
}

export function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

export abstract class BezierCurve {
  protected constructor(protected points: Point[]) {
    for (const point of points) {
      validatePoint(point);
    }
  }

  abstract getPoint(t: number): Point;
}

export class LinearBezier extends BezierCurve {
  constructor(points: Point[]) {
    super(points);
    if (points.length !== 2) {
      throw new Error('LinearBezier 构造函数参数错误，points.length 必须为 2');
    }
  }

  getPoint(t: number): Point {
    validateT(t);
    return linearBezier(this.points[0], this.points[1], t);
  }
}

export class QuadraticBezier extends BezierCurve {
  constructor(points: Point[]) {
    super(points);
    if (points.length !== 3) {
      throw new Error('QuadraticBezier 构造函数参数错误，points.length 必须为 3');
    }
  }

  getPoint(t: number): Point {
    validateT(t);
    return quadraticBezier(this.points[0], this.points[1], this.points[2], t);
  }
}

export class CubicBezier extends BezierCurve {
  constructor(points: Point[]) {
    super(points);
    if (points.length !== 4) {
      throw new Error('CubicBezier 构造函数参数错误，points.length 必须为 4');
    }
  }

  getPoint(t: number): Point {
    validateT(t);
    return cubicBezier(this.points[0], this.points[1], this.points[2], this.points[3], t);
  }
}

export function createBezierCurve(points: Point[]): BezierCurve {
  switch (points.length) {
    case 2:
      return new LinearBezier(points);
    case 3:
      return new QuadraticBezier(points);
    case 4:
      return new CubicBezier(points);
    default:
      throw new Error(`不支持 ${points.length} 个控制点的贝塞尔曲线`);
  }
}

export default {
  LinearBezier,
  QuadraticBezier,
  CubicBezier,
  //
  linearBezier,
  quadraticBezier,
  cubicBezier,
  createBezierCurve,
};
