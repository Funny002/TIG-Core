import { EngineLogger } from '../Logger';
import { Polygon } from './Polygon';
import type { CanvasStyleConfig } from '../Lib';
import type { Point } from '../Core';

/** 三角形选项接口 */
export interface TriangleOptions {
  x: number;                         // 坐标
  y: number;                         // 坐标
  width: number;                     // 宽度
  height: number;                    // 高度
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

/**
 * 三角形形状（等腰三角形）
 * 由宽度与高度自动推导三个顶点：顶部中点、右下角、左下角
 * @extends Polygon
 */
export class Triangle extends Polygon {
  public readonly type = 'triangle';

  constructor(config: Partial<TriangleOptions> = {}) {
    const width = config.width ?? 0;
    const height = config.height ?? 0;
    super({
      x: config.x ?? 0,
      y: config.y ?? 0,
      vertices: buildVertices(width, height),
      visible: config.visible,
      style: config.style,
    });
  }

  /** 宽度可写，重新推导顶点 */
  set width(value: number) {
    if (!Number.isFinite(value) || value < 0) {
      EngineLogger.warn(`Triangle width 值无效: ${value}`);
      return;
    }
    this.vertices = buildVertices(value, this.height);
  }

  /** 高度可写，重新推导顶点 */
  set height(value: number) {
    if (!Number.isFinite(value) || value < 0) {
      EngineLogger.warn(`Triangle height 值无效: ${value}`);
      return;
    }
    this.vertices = buildVertices(this.width, value);
  }

  getState(): Record<string, any> {
    return {
      ...super.getState(),
      name: 'Triangle',
    };
  }
}

/** 根据宽高推导等腰三角形的三个顶点 */
function buildVertices(width: number, height: number): Point[] {
  return [
    { x: width / 2, y: 0 },   // 顶部中点
    { x: width, y: height },  // 右下角
    { x: 0, y: height },      // 左下角
  ];
}
