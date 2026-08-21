import { Polygon } from './Polygon';
import type { CanvasStyleConfig } from '../Lib';
/** 三角形选项接口 */
export interface TriangleOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    style: Partial<CanvasStyleConfig>;
}
/**
 * 三角形形状（等腰三角形）
 * 由宽度与高度自动推导三个顶点：顶部中点、右下角、左下角
 * @extends Polygon
 */
export declare class Triangle extends Polygon {
    readonly type = "triangle";
    constructor(config?: Partial<TriangleOptions>);
    /** 宽度可写，重新推导顶点 */
    set width(value: number);
    /** 高度可写，重新推导顶点 */
    set height(value: number);
    getState(): Record<string, any>;
}
