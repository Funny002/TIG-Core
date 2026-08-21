import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';
/** 多边形选项接口 */
export interface PolygonOptions {
    x: number;
    y: number;
    vertices: Point[];
    visible: boolean;
    style: Partial<CanvasStyleConfig>;
}
/**
 * 多边形形状
 * @extends Shape
 */
export declare class Polygon extends Shape {
    readonly type: string;
    private points;
    readonly style: CanvasStyle;
    /** 紧凑包围盒（由绝对顶点计算） */
    protected computeBounds(): Bounding;
    /** 尺寸由顶点决定（只读） */
    get size(): Size;
    /** 中心点 X（紧凑包围盒中心） */
    get centerX(): number;
    /** 中心点 Y（紧凑包围盒中心） */
    get centerY(): number;
    /** 宽度为只读，由顶点决定 */
    set width(_: number);
    /** 高度为只读，由顶点决定 */
    set height(_: number);
    /** 获取顶点（相对坐标副本） */
    get vertices(): Point[];
    /** 设置顶点（相对坐标） */
    set vertices(value: Point[]);
    /** 获取绝对坐标顶点 */
    get absolutePoints(): Point[];
    constructor(config?: Partial<PolygonOptions>);
    /** 移动多边形（平移锚点即可，相对顶点不变） */
    protected paint(ctx: CanvasRenderingContext2D): void;
    collision(other: Shape): boolean;
    getState(): Record<string, any>;
}
