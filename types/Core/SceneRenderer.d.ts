import type { Canvas } from './Canvas';
import type { Shape } from './Shape';
/**
 * 场景渲染器
 *
 * 负责按 zIndex 排序绘制图形集合，与场景编排、碰撞检测解耦。
 * 复用内部排序缓冲，避免每帧分配新数组。
 */
export declare class SceneRenderer {
    private readonly canvas;
    private readonly sorted;
    constructor(canvas: Canvas);
    /** 按 zIndex 升序绘制图形（不负责清屏） */
    draw(shapes: readonly Shape[]): void;
}
