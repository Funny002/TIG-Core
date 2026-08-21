/** 帧调度模式 */
export type FrameSchedulerMode = 'fixed' | 'unlimited';
/**
 * 帧调度后端接口
 *
 * 抽象时间源与帧调度原语，使 FrameScheduler 与浏览器 API 解耦：
 * - 默认实现 `browserSchedulerBackend` 基于 requestAnimationFrame / setTimeout / performance.now；
 * - 测试或自定义环境可注入替代后端（如手动时钟、虚拟帧队列）。
 */
export interface FrameSchedulerBackend {
    /** 当前时间戳（毫秒） */
    now(): number;
    /** 请求下一帧，返回句柄 */
    requestFrame(callback: (timestamp: number) => void): number;
    /** 取消帧请求 */
    cancelFrame(handle: number): void;
    /** 延迟调度（用于 fixed 模式限帧），返回句柄 */
    setDelay(callback: () => void, ms: number): number;
    /** 取消延迟调度 */
    clearDelay(handle: number): void;
}
/** 浏览器默认调度后端 */
export declare const browserSchedulerBackend: FrameSchedulerBackend;
/**
 * 帧调度器
 *
 * 负责游戏循环的帧调度（requestFrame + fixed 模式的延迟限帧），
 * 与物理逻辑完全解耦，内置防重入保护，避免模式切换导致的双重循环。
 * 通过 `backend` 参数注入调度后端，可完全脱离浏览器运行。
 */
export declare class FrameScheduler {
    private readonly onFrame;
    private running;
    private frameId;
    private timeoutId;
    private lastFrameTime;
    private minFrameTime;
    private mode;
    private readonly backend;
    constructor(onFrame: (timestamp: number) => void, mode?: FrameSchedulerMode, targetFPS?: number, backend?: FrameSchedulerBackend);
    /** 启动帧循环 */
    start(): void;
    /** 停止帧循环 */
    stop(): void;
    /** 切换调度模式（运行中会立即按新模式重新调度） */
    setMode(mode: FrameSchedulerMode): void;
    /** 设置目标帧率（fixed 模式限帧用） */
    setTargetFPS(fps: number): void;
    get isRunning(): boolean;
    /** 取消待定的帧请求 / 延迟 */
    private cancelPending;
    /** 调度下一帧 */
    private scheduleNext;
    /** 帧回调：执行 onFrame 后继续调度下一帧 */
    private frame;
}
