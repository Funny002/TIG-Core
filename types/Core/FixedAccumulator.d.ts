/**
 * 固定时间步长累加器
 *
 * 纯逻辑实现，不依赖 requestAnimationFrame / DOM，便于单元测试与复用。
 * 负责：时间累积、固定步长触发、插值因子计算、死亡螺旋保护。
 */
export declare class FixedAccumulator {
    private accumulator;
    private timestep;
    private maxUpdates;
    private alphaClamp;
    constructor(timestep: number, maxUpdates?: number, alphaClamp?: number);
    /**
     * 累加经过的时间，并以固定步长执行更新回调
     * @param deltaTime 本帧经过的时间（毫秒）
     * @param now 当前时间戳（由调用方传入，保持纯逻辑）
     * @param update 固定步长更新回调
     * @returns 实际执行的更新次数
     */
    advance(deltaTime: number, now: number, update: (timestep: number, now: number) => void): number;
    /** 渲染插值因子（钳制在 [0, alphaClamp]） */
    get alpha(): number;
    /** 当前累加器值（毫秒） */
    get value(): number;
    set value(v: number);
    /** 重置累加器 */
    reset(): void;
    /** 调整时间步长（按比例换算累加值，保持进度） */
    setTimestep(ms: number): void;
    /** 调整每帧最大更新次数 */
    setMaxUpdates(max: number): void;
    /** 调整插值因子钳制上限 */
    setAlphaClamp(clamp: number): void;
    getTimestep(): number;
}
