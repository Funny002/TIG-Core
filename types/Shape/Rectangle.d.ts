import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
/** 矩形选项接口 */
export interface RectangleOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    rounds: number | number[];
    style: Partial<CanvasStyleConfig>;
}
/**
 * 矩形形状
 * @extends Shape
 */
export declare class Rectangle extends Shape {
    readonly type = "rectangle";
    readonly style: CanvasStyle;
    private __rounds;
    /** 获取圆角半径 */
    get rounds(): number | number[];
    /** 设置圆角半径（校验并规范化） */
    set rounds(value: number | number[]);
    constructor(config?: Partial<RectangleOptions>);
    /** 获取规范化后的四角圆角半径数组 */
    private getNormalizedRounds;
    protected paint(ctx: CanvasRenderingContext2D): void;
    collision(other: Shape): boolean;
    getState(): Record<string, any>;
}
