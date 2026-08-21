import { EngineLogger } from '../Logger';
import { EventEmitter } from '../Lib';
import { FixedAccumulator } from './FixedAccumulator';
import { browserSchedulerBackend, FrameScheduler } from './FrameScheduler';
import type { FrameSchedulerBackend } from './FrameScheduler';
import { StatsCollector } from './StatsCollector';
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
  targetFPS: number;        // 目标帧率
  accumulator: number;      // 物理累加器值
  alpha: number;            // 渲染插值因子
  running: boolean;         // 引擎运行状态
  timestep: number;         // 当前时间步长
  mode: EngineMode;         // 当前运行模式
}

/** 回调集合接口 */
export interface CallbackSet {
  onUpdate?: UpdateCallback;        // 物理更新回调
  onRender?: RenderCallback;        // 渲染回调
  onPostRender?: PostRenderCallback; // 渲染后回调
}

/** 详细统计信息接口 (扩展自 EngineStats) */
export interface DetailedStats extends EngineStats {
  frameBudget: string;     // 帧预算时间（字符串格式）
  physicsLoad: string;     // 物理负载百分比
  renderLoad: string;      // 渲染负载百分比
  efficiency: string;      // 效率百分比
  timeScale: number;       // 时间缩放因子
}

/** 引擎生命周期事件集合 */
export interface EngineEvents {
  'start': undefined;
  'stop': undefined;
  'pause': undefined;
  'resume': undefined;
  'mode-changed': { mode: EngineMode; targetFPS: number };
}

/** 默认引擎配置 */
const DEFAULT_CONFIG: Required<EngineConfig> = {
  timestep: 1000 / 60,     // 60FPS 对应的时间步长（约 16.67ms）
  maxUpdates: 10,          // 每帧最多 10 次物理更新
  alphaClamp: 1.0,         // alpha 最大值
  mode: 'fixed',           // 默认固定时间步长模式
  targetFPS: 60,           // 目标 60FPS
  enableStats: true,       // 默认启用统计
};

const MAX_TIME_SCALE = 5.0;       // 最大时间缩放
const MIN_TIME_SCALE = 0.1;       // 最小时间缩放

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
export class Engine extends EventEmitter<EngineEvents> {
  /** 引擎配置（合并默认配置和用户配置） */
  private config: Required<EngineConfig>;

  /** 回调函数引用 */
  private callbacks: CallbackSet = {};

  // 组合的模块
  private readonly accumulator: FixedAccumulator;
  private readonly scheduler: FrameScheduler;
  private readonly stats = new StatsCollector();
  private readonly backend: FrameSchedulerBackend;

  // 运行时状态
  private lastTime = 0;
  private alpha = 0;
  private timeScale = 1.0;
  private paused = false;

  /**
   * 构造函数
   * @param userConfig 用户配置（可选）
   * @param backend 帧调度后端（可选，默认浏览器后端；测试可注入假后端脱离浏览器）
   */
  constructor(
    userConfig: Partial<EngineConfig> = {},
    backend: FrameSchedulerBackend = browserSchedulerBackend,
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...userConfig };
    this.backend = backend;

    this.accumulator = new FixedAccumulator(
      this.config.timestep,
      this.config.maxUpdates,
      this.config.alphaClamp,
    );
    this.scheduler = new FrameScheduler(
      (timestamp) => this.frame(timestamp),
      this.config.mode,
      this.config.targetFPS,
      backend,
    );

    EngineLogger.log(`引擎初始化 - 模式: ${this.config.mode}, 目标FPS: ${this.config.targetFPS}`);
  }

  /**
   * 启动引擎（重置累加器与统计）
   * @fires Engine#start
   */
  start(): void {
    if (this.scheduler.isRunning) return;

    this.paused = false;
    this.lastTime = this.backend.now();
    this.accumulator.reset();
    this.alpha = 0;
    this.stats.reset(this.lastTime);

    this.scheduler.start();
    this.emit('start', undefined);
    EngineLogger.log(`引擎启动 - 模式: ${this.config.mode}`);
  }

  /**
   * 停止引擎（保留状态，可继续 resume）
   * @fires Engine#stop
   */
  stop(): void {
    if (!this.scheduler.isRunning) return;

    this.scheduler.stop();
    this.paused = false;
    this.emit('stop', undefined);
    EngineLogger.log('引擎停止');
  }

  /**
   * 暂停引擎（等同 stop，但标记暂停状态）
   * @fires Engine#pause
   */
  pause(): void {
    if (!this.scheduler.isRunning) return;

    this.paused = true;
    this.scheduler.stop();
    this.emit('pause', undefined);
    EngineLogger.log('引擎暂停');
  }

  /**
   * 恢复运行（不重置累加器/统计，从暂停处继续）
   * @fires Engine#resume
   */
  resume(): void {
    if (this.scheduler.isRunning) return;

    this.paused = false;
    this.lastTime = this.backend.now();
    this.scheduler.start();
    this.emit('resume', undefined);
    EngineLogger.log('引擎恢复');
  }

  /**
   * 手动推进若干次物理更新（用于暂停状态下的单步调试）
   * @param steps 执行步数
   */
  step(steps = 1): void {
    const n = Math.max(0, Math.floor(steps));
    for (let i = 0; i < n; i += 1) {
      this.safeExecute(
        () => this.callbacks.onUpdate?.(this.config.timestep, this.backend.now()),
        'onUpdate',
      );
    }
  }

  /**
   * 游戏主循环（由 FrameScheduler 驱动）
   * @param currentTime 当前时间戳（来自 requestAnimationFrame）
   */
  private frame(currentTime: number): void {
    const frameStart = this.backend.now();

    // 1. 计算增量时间（毫秒）
    const rawDeltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 2. 应用时间缩放，并限制最大增量（避免切后台后过度追赶）
    const scaledDelta = rawDeltaTime * this.timeScale;
    const deltaTime = Math.min(scaledDelta, this.config.timestep * 5);

    // 3. 固定时间步长物理更新（由累加器驱动）
    const physicsStart = this.backend.now();
    const updatesPerFrame = this.accumulator.advance(deltaTime, this.backend.now(), (timestep, now) => {
      this.safeExecute(() => this.callbacks.onUpdate?.(timestep, now), 'onUpdate');
    });
    const physicsTime = this.backend.now() - physicsStart;

    // 4. 计算渲染插值因子
    this.alpha = this.computeAlpha();

    // 5. 执行渲染
    const renderStart = this.backend.now();
    this.executeRender();
    const renderTime = this.backend.now() - renderStart;

    // 6. 渲染后回调
    this.safeExecute(this.callbacks.onPostRender, 'onPostRender');

    // 7. 统计
    const frameTime = this.backend.now() - frameStart;
    if (this.config.enableStats) {
      this.stats.record(deltaTime, this.backend.now(), frameTime, physicsTime, renderTime, updatesPerFrame);
    }
  }

  /** 执行渲染 */
  private executeRender(): void {
    if (!this.callbacks.onRender) return;
    const alpha = this.alpha;
    this.safeExecute(() => this.callbacks.onRender!(alpha, alpha * this.config.timestep), 'onRender');
  }

  /** 计算渲染插值因子 alpha */
  private computeAlpha(): number {
    if (this.config.mode === 'fixed') return 0; // 固定模式不使用插值
    return this.accumulator.alpha;
  }

  /**
   * 切换引擎模式
   * @param mode 目标模式
   * @param targetFPS 目标帧率（可选）
   * @fires Engine#mode-changed
   */
  setMode(mode: EngineMode, targetFPS: number = this.config.targetFPS): void {
    const oldMode = this.config.mode;
    const oldTargetFPS = this.config.targetFPS;

    this.config.mode = mode;
    this.config.targetFPS = targetFPS;
    this.scheduler.setMode(mode);
    this.scheduler.setTargetFPS(targetFPS);

    // 重置运行时状态（不重置统计）
    this.accumulator.reset();
    this.alpha = 0;
    this.lastTime = this.backend.now();

    this.emit('mode-changed', { mode, targetFPS });
    EngineLogger.log(`引擎模式从 ${oldMode}(${oldTargetFPS}FPS) 切换到 ${mode}(${targetFPS}FPS)`);
  }

  /** 设置目标帧率（fixed 模式限帧） */
  setTargetFPS(targetFPS: number): void {
    if (!Number.isFinite(targetFPS) || targetFPS <= 0) {
      EngineLogger.error(`目标帧率无效: ${targetFPS}`);
      return;
    }
    this.config.targetFPS = targetFPS;
    this.scheduler.setTargetFPS(targetFPS);
  }

  /** 设置每帧最大物理更新次数 */
  setMaxUpdates(maxUpdates: number): void {
    if (!Number.isFinite(maxUpdates) || maxUpdates < 1) {
      EngineLogger.error(`最大更新次数无效: ${maxUpdates}`);
      return;
    }
    this.config.maxUpdates = maxUpdates;
    this.accumulator.setMaxUpdates(maxUpdates);
  }

  /**
   * 设置时间缩放
   * @param timeScale 缩放因子（0.1 - 5.0）
   */
  setTimeScale(timeScale: number): void {
    this.timeScale = Math.max(MIN_TIME_SCALE, Math.min(timeScale, MAX_TIME_SCALE));
    EngineLogger.log(`时间缩放设置为: ${this.timeScale}x`);
  }

  /** 设置回调函数 */
  setCallbacks(callbacks: CallbackSet): void {
    this.callbacks = { ...callbacks };
  }

  /**
   * 设置时间步长
   * @param timestep 新的时间步长（毫秒）
   */
  setTimestep(timestep: number): void {
    if (!Number.isFinite(timestep) || timestep <= 0) {
      EngineLogger.error(`时间步长无效: ${timestep}`);
      return;
    }
    this.config.timestep = timestep;
    this.accumulator.setTimestep(timestep);
    EngineLogger.log(`时间步长调整为 ${timestep.toFixed(2)}ms`);
  }

  /** 获取详细统计信息 */
  getDetailedStats(): DetailedStats {
    const frameBudget = 1000 / this.config.targetFPS;
    const s = this.getStats();

    return {
      ...s,
      frameBudget: `${frameBudget.toFixed(2)}ms`,
      physicsLoad: `${((s.physicsTime / frameBudget) * 100).toFixed(1)}%`,
      renderLoad: `${((s.renderTime / frameBudget) * 100).toFixed(1)}%`,
      efficiency: `${((s.frameTime / frameBudget) * 100).toFixed(1)}%`,
      timeScale: this.timeScale,
    };
  }

  /** 获取基础统计信息 */
  getStats(): EngineStats {
    return {
      ...this.stats.snapshot(),
      targetFPS: this.config.targetFPS,
      accumulator: this.accumulator.value,
      alpha: this.alpha,
      running: this.scheduler.isRunning,
      timestep: this.config.timestep,
      mode: this.config.mode,
    };
  }

  /** 获取当前配置副本 */
  getConfig(): Required<EngineConfig> {
    return { ...this.config };
  }

  /** 检查引擎是否运行中 */
  isRunning(): boolean {
    return this.scheduler.isRunning;
  }

  /** 检查引擎是否处于暂停状态 */
  isPaused(): boolean {
    return this.paused;
  }

  /** 获取当前运行模式 */
  getMode(): EngineMode {
    return this.config.mode;
  }

  /** 获取当前时间缩放因子 */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * 安全执行回调（捕获错误）
   */
  private safeExecute(callback: (() => void) | undefined, name: string): void {
    if (!callback) return;
    try {
      callback();
    } catch (error) {
      EngineLogger.error(`回调 ${name} 执行错误:`, error);
    }
  }

  /** 销毁引擎 */
  destroy(): void {
    this.stop();
    this.callbacks = {};
    this.clear(); // 清除事件监听
  }
}
