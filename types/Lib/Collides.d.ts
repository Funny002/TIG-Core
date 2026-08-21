import type { Bounding, Point } from '../Core';
/**
 * 轴对齐包围盒（AABB）相交检测
 */
export declare function boundsIntersect(a: Bounding, b: Bounding): boolean;
/**
 * 圆与圆碰撞检测
 */
export declare function circleCollide(cx1: number, cy1: number, r1: number, cx2: number, cy2: number, r2: number): boolean;
/**
 * 圆与矩形（AABB）碰撞检测
 */
export declare function circleRectCollide(cx: number, cy: number, r: number, rect: Bounding): boolean;
/**
 * 点到线段的距离
 */
export declare function pointToSegmentDistance(p: Point, a: Point, b: Point): number;
/**
 * 线段与线段相交检测
 */
export declare function segmentIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean;
/**
 * 计算一组点的紧凑包围盒
 * @param points - 点集
 * @param fallback - 点集为空时的回退坐标
 */
export declare function computeBounds(points: Point[], fallback: Point): Bounding;
/**
 * 点是否在多边形内（射线法）
 * @param point - 目标点
 * @param vertices - 多边形顶点（按顺序）
 */
export declare function pointInPolygon(point: Point, vertices: Point[]): boolean;
