import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';
/** 线段选项接口 */
export interface LineOptions {
    x: number;
    y: number;
    endPoint: Point;
    visible: boolean;
    style: Partial<CanvasStyleConfig>;
}
/**
 * 线段形状
 * @extends Shape
 */
export declare class Line extends Shape {
    readonly type = "line";
    private endPoint;
    readonly style: CanvasStyle;
    get endX(): number;
    get endY(): number;
    /** 起始点 */
    get start(): Point;
    /** 结束点 */
    get end(): Point;
    /** 线段尺寸（由起止点计算） */
    get size(): Size;
    /** 线段紧凑包围盒（由起止点计算，支持任意方向） */
    protected computeBounds(): Bounding;
    /** 宽度为只读，由起止点决定 */
    set width(_: number);
    /** 高度为只读，由起止点决定 */
    set height(_: number);
    constructor(config?: Partial<LineOptions>);
    /** 设置结束点 X 坐标 */
    set endX(value: number);
    /** 设置结束点 Y 坐标 */
    set endY(value: number);
    /** 设置起始点 */
    setStartPoint(x: number, y: number): void;
    /** 设置结束点 */
    setEndPoint(x: number, y: number): void;
    /** 同时设置起始点与结束点 */
    setPoint(start: Point, end: Point): void;
    /** 移动线段（同时平移起止点） */
    move(dx: number, dy: number): void;
    protected paint(ctx: CanvasRenderingContext2D): void;
    collision(other: Shape): boolean;
    getState(): Record<string, any>;
}
