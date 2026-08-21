/** 引擎统计的测量值部分（配置字段由引擎合并） */
export interface MeasuredStats {
    fps: number;
    frameCount: number;
    lastFpsUpdate: number;
    deltaHistory: number[];
    jitter: number;
    averageDelta: number;
    minDelta: number;
    maxDelta: number;
    updatesPerFrame: number;
    frameTime: number;
    renderTime: number;
    physicsTime: number;
}
/**
 * 统计收集器
 *
 * 纯逻辑实现（时间戳由调用方传入），负责收集帧时间历史、FPS、抖动、平均值等统计。
 * 使用环形缓冲区存储帧时间历史，避免 push/shift 的 O(n) 开销。
 */
export declare class StatsCollector {
    private readonly historySize;
    private readonly fpsInterval;
    private readonly deltaHistory;
    private historyIndex;
    private historyFull;
    private frameCount;
    private lastFpsUpdate;
    private fps;
    private minDelta;
    private maxDelta;
    private averageDelta;
    private jitter;
    private updatesPerFrame;
    private frameTime;
    private renderTime;
    private physicsTime;
    constructor(historySize?: number, fpsInterval?: number);
    /** 重置统计状态 */
    reset(now: number): void;
    /** 记录一帧的统计 */
    record(deltaTime: number, now: number, frameTime: number, physicsTime: number, renderTime: number, updatesPerFrame: number): void;
    /** 输出统计快照（帧时间历史按时间顺序） */
    snapshot(): MeasuredStats;
    /** 低频更新平均值与抖动（标准差） */
    private updateAverage;
}
