import { EventEmitter } from '../Lib';
import type { FrameSchedulerBackend } from './FrameScheduler';
import type { MeasuredStats } from './StatsCollector';
/** 渲染后回调类型 */
export type PostRenderCallback = () => void;
/** 引擎运行模式：固定时间步长 / 无限制（插值）渲染 */
export type EngineMode = 'fixed' | 'unlimited';
/** 渲染回调类型 (alpha: 插值因子 0-1, deltaTime: 渲染增量时间) */
export type RenderCallback = (alpha: number, deltaTime: number) => void;
/** 更新回调类型 (timestep: 固定时间步长, currentTime: 当前时间) */
export type UpdateCallback = (timestep: number, currentTime: number) => void;
/** 引擎配置接口 */
export interface EngineConfig {
    /** 固定时间步长（毫秒），默认 1000/60 ≈ 16.67ms */
    timestep: number;
    /** 每帧最大物理更新次数，防止“死亡螺旋” */
    maxUpdates: number;
    /** alpha 插值因子钳制上限 */
    alphaClamp: number;
    /** 运行模式 */
    mode: EngineMode;
    /** 目标帧率（用于统计与固定模式帧预算） */
    targetFPS: number;
    /** 是否启用统计信息收集 */
    enableStats: boolean;
}
/** 引擎统计信息接口 */
export interface EngineStats extends MeasuredStats {
    targetFPS: number;
    accumulator: number;
    alpha: number;
    running: boolean;
    timestep: number;
    mode: EngineMode;
}
/** 回调集合接口 */
export interface CallbackSet {
    onUpdate?: UpdateCallback;
    onRender?: RenderCallback;
    onPostRender?: PostRenderCallback;
}
/** 详细统计信息接口 (扩展自 EngineStats) */
export interface DetailedStats extends EngineStats {
    frameBudget: string;
    physicsLoad: string;
    renderLoad: string;
    efficiency: string;
    timeScale: number;
}
/** 引擎生命周期事件集合 */
export interface EngineEvents {
    'start': undefined;
    'stop': undefined;
    'pause': undefined;
    'resume': undefined;
    'mode-changed': {
        mode: EngineMode;
        targetFPS: number;
    };
}
/**
 * 固定时间步长引擎
 *
 * 核心思路（来自 “Fix Your Timestep!”）：
 * 1. 使用累加器累计真实经过的时间；
 * 2. 物理/逻辑更新始终以固定时间步长执行，与渲染帧率解耦，
 *    从而修正高刷显示器上游戏被加速的问题；
 * 3. 渲染时用 alpha 插值因子在相邻两次物理状态之间插值，保证画面平滑。
 *
 * 架构：引擎由三个低耦合模块组合而成
 * - `FrameScheduler`：帧循环调度（rAF + fixed 限帧）；
 * - `FixedAccumulator`：固定时间步长累加（纯逻辑）；
 * - `StatsCollector`：性能统计收集（纯逻辑）。
 *
 * 两种模式：
 * - `fixed`：渲染不插值（alpha=0），画面严格对应最近的物理状态；
 * - `unlimited`：渲染按刷新率插值（alpha∈[0,1]），高刷下更平滑。
 */
export declare class Engine extends EventEmitter<EngineEvents> {
    /** 引擎配置（合并默认配置和用户配置） */
    private config;
    /** 回调函数引用 */
    private callbacks;
    private readonly accumulator;
    private readonly scheduler;
    private readonly stats;
    private readonly backend;
    private lastTime;
    private alpha;
    private timeScale;
    private paused;
    /**
     * 构造函数
     * @param userConfig 用户配置（可选）
     * @param backend 帧调度后端（可选，默认浏览器后端；测试可注入假后端脱离浏览器）
     */
    constructor(userConfig?: Partial<EngineConfig>, backend?: FrameSchedulerBackend);
    /**
     * 启动引擎（重置累加器与统计）
     * @fires Engine#start
     */
    start(): void;
    /**
     * 停止引擎（保留状态，可继续 resume）
     * @fires Engine#stop
     */
    stop(): void;
    /**
     * 暂停引擎（等同 stop，但标记暂停状态）
     * @fires Engine#pause
     */
    pause(): void;
    /**
     * 恢复运行（不重置累加器/统计，从暂停处继续）
     * @fires Engine#resume
     */
    resume(): void;
    /**
     * 手动推进若干次物理更新（用于暂停状态下的单步调试）
     * @param steps 执行步数
     */
    step(steps?: number): void;
    /**
     * 游戏主循环（由 FrameScheduler 驱动）
     * @param currentTime 当前时间戳（来自 requestAnimationFrame）
     */
    private frame;
    /** 执行渲染 */
    private executeRender;
    /** 计算渲染插值因子 alpha */
    private computeAlpha;
    /**
     * 切换引擎模式
     * @param mode 目标模式
     * @param targetFPS 目标帧率（可选）
     * @fires Engine#mode-changed
     */
    setMode(mode: EngineMode, targetFPS?: number): void;
    /** 设置目标帧率（fixed 模式限帧） */
    setTargetFPS(targetFPS: number): void;
    /** 设置每帧最大物理更新次数 */
    setMaxUpdates(maxUpdates: number): void;
    /**
     * 设置时间缩放
     * @param timeScale 缩放因子（0.1 - 5.0）
     */
    setTimeScale(timeScale: number): void;
    /** 设置回调函数 */
    setCallbacks(callbacks: CallbackSet): void;
    /**
     * 设置时间步长
     * @param timestep 新的时间步长（毫秒）
     */
    setTimestep(timestep: number): void;
    /** 获取详细统计信息 */
    getDetailedStats(): DetailedStats;
    /** 获取基础统计信息 */
    getStats(): EngineStats;
    /** 获取当前配置副本 */
    getConfig(): Required<EngineConfig>;
    /** 检查引擎是否运行中 */
    isRunning(): boolean;
    /** 检查引擎是否处于暂停状态 */
    isPaused(): boolean;
    /** 获取当前运行模式 */
    getMode(): EngineMode;
    /** 获取当前时间缩放因子 */
    getTimeScale(): number;
    /**
     * 安全执行回调（捕获错误）
     */
    private safeExecute;
    /** 销毁引擎 */
    destroy(): void;
}
