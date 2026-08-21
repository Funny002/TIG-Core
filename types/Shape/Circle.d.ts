import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
/** 圆形（椭圆）选项接口 */
export interface CircleOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    style: Partial<CanvasStyleConfig>;
}
/**
 * 圆形（支持椭圆）形状
 * @extends Shape
 */
export declare class Circle extends Shape {
    readonly type = "circle";
    readonly style: CanvasStyle;
    /** X 轴半径 */
    get radiusX(): number;
    /** Y 轴半径 */
    get radiusY(): number;
    /** 近似半径（用于碰撞检测，取两轴半径均值） */
    get radius(): number;
    constructor(config?: Partial<CircleOptions>);
    protected paint(ctx: CanvasRenderingContext2D): void;
    collision(other: Shape): boolean;
    getState(): Record<string, any>;
}
