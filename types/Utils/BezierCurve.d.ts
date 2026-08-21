import type { Point } from '../Core';
/** 一阶（线性）贝塞尔曲线 */
export declare function linearBezier(p0: Point, p1: Point, t: number): Point;
/** 二阶（二次）贝塞尔曲线 */
export declare function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point;
/** 三阶（三次）贝塞尔曲线 */
export declare function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point;
/** 贝塞尔曲线抽象基类 */
export declare abstract class BezierCurve {
    protected points: Point[];
    protected constructor(points: Point[]);
    /** 获取曲线上 t 位置的点（t ∈ [0, 1]） */
    abstract getPoint(t: number): Point;
}
/** 一阶（线性）贝塞尔曲线类 */
export declare class LinearBezier extends BezierCurve {
    constructor(points: Point[]);
    getPoint(t: number): Point;
}
/** 二阶（二次）贝塞尔曲线类 */
export declare class QuadraticBezier extends BezierCurve {
    constructor(points: Point[]);
    getPoint(t: number): Point;
}
/** 三阶（三次）贝塞尔曲线类 */
export declare class CubicBezier extends BezierCurve {
    constructor(points: Point[]);
    getPoint(t: number): Point;
}
/** 根据控制点数量创建对应阶数的贝塞尔曲线 */
export declare function createBezierCurve(points: Point[]): BezierCurve;
