import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';
/** 路径选项接口 */
export interface PathOptions {
    x: number;
    y: number;
    visible: boolean;
    style: Partial<CanvasStyleConfig>;
}
/**
 * 路径形状（SVG 风格命令）
 * 支持 moveTo / lineTo / bezierCurveTo / quadraticCurveTo / closePath
 * @extends Shape
 */
export declare class Path extends Shape {
    readonly type = "path";
    private commands;
    readonly style: CanvasStyle;
    /** 紧凑包围盒（由路径点计算） */
    protected computeBounds(): Bounding;
    /** 尺寸由路径命令决定（只读） */
    get size(): Size;
    /** 中心点 X（紧凑包围盒中心） */
    get centerX(): number;
    /** 中心点 Y（紧凑包围盒中心） */
    get centerY(): number;
    /** 宽度为只读，由路径命令决定 */
    set width(_: number);
    /** 高度为只读，由路径命令决定 */
    set height(_: number);
    /** 获取路径命令副本 */
    get commandList(): (string | number)[];
    constructor(config?: Partial<PathOptions>);
    /** 移动画笔到指定点 */
    moveTo(point: Point): this;
    /** 画直线到指定点 */
    lineTo(point: Point): this;
    /** 画三次贝塞尔曲线 */
    bezierCurveTo(cp1: Point, cp2: Point, point: Point): this;
    /** 画二次贝塞尔曲线 */
    quadraticCurveTo(cp: Point, point: Point): this;
    /** 闭合路径 */
    closePath(): this;
    /** 清空路径并回到起点 */
    clear(): this;
    /** 获取路径上的所有点（含贝塞尔控制点），用于计算包围盒 */
    private getAllPoints;
    protected paint(ctx: CanvasRenderingContext2D): void;
    collision(other: Shape): boolean;
    getState(): Record<string, any>;
}
