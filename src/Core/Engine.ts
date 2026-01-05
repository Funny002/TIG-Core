import { EngineLogger } from '../Logger';
import { Decimal } from 'decimal.js';

/** 渲染后回调类型 */
export type PostRenderCallback = () => void;

/** 引擎运行模式：固定时间步长或无限制模式 */
export type EngineMode = 'fixed' | 'unlimited';

/** 渲染回调类型 (alpha: 插值因子, deltaTime: 渲染增量时间) */
export type RenderCallback = (alpha: number, deltaTime: number) => void;

/** 更新回调类型 (timestep: 时间步长, currentTime: 当前时间) */
export type UpdateCallback = (timestep: Decimal, currentTime: number) => void;

/** 引擎配置接口 */
export interface EngineConfig {
  timestep: number;         // 基础时间步长(毫秒)
  maxUpdates: number;       // 每帧最大物理更新次数
  alphaClamp: number;       // alpha值钳制上限(用于插值)
  mode: EngineMode;         // 运行模式
  targetFPS: number;        // 目标帧率
  enableStats: boolean;     // 是否启用统计信息收集
}

/** 引擎统计信息接口 */
export interface EngineStats {
  fps: number;              // 当前帧率
  targetFPS: number;        // 目标帧率
  frameCount: number;       // 帧计数器
  lastFpsUpdate: number;    // 上次FPS更新时间
  deltaHistory: number[];   // 增量时间历史记录
  jitter: number;           // 帧时间抖动值
  averageDelta: number;     // 平均增量时间
  minDelta: number;         // 最小增量时间
  maxDelta: number;         // 最大增量时间
  updatesPerFrame: number;  // 每帧物理更新次数
  frameTime: number;        // 整帧耗时
  renderTime: number;       // 渲染耗时
  physicsTime: number;      // 物理更新耗时
  accumulator: number;      // 物理累加器值
  alpha: number;            // 渲染插值因子
  running: boolean;         // 引擎运行状态
  timestep: number;         // 当前时间步长
  mode: EngineMode;         // 当前运行模式
}

/** 回调集合接口 */
export interface CallbackSet {
  onUpdate?: UpdateCallback;      // 物理更新回调
  onRender?: RenderCallback;      // 渲染回调
  onPostRender?: PostRenderCallback; // 渲染后回调
}

/** 详细统计信息接口 (扩展自EngineStats) */
export interface DetailedStats extends EngineStats {
  frameBudget: string;     // 帧预算时间(字符串格式)
  physicsLoad: string;     // 物理负载百分比
  renderLoad: string;      // 渲染负载百分比
  efficiency: string;      // 效率百分比
  timeScale: number;       // 时间缩放因子
}

/** 引擎运行时状态 */
interface EngineState {
  running: boolean;
  lastTime: number;
  lastFrameTime: number;
  frameId: number | null;
  accumulator: Decimal;    // 使用Decimal保持精度
  alpha: number;
  timeScale: Decimal;      // 使用Decimal保持精度
  stats: EngineStats;
  historyIndex: number;    // 循环缓冲区索引
  historyFull: boolean;    // 循环缓冲区是否已满
}

/** 默认引擎配置 */
const DEFAULT_CONFIG: Required<EngineConfig> = {
  timestep: 1000 / 60,     // 60FPS对应的时间步长(约16.67ms)
  maxUpdates: 10,          // 每帧最多10次物理更新
  alphaClamp: 1.0,         // alpha最大值
  mode: 'fixed',           // 默认固定时间步长模式
  targetFPS: 60,           // 目标60FPS
  enableStats: true,       // 默认启用统计
};

const STATS_HISTORY_SIZE = 240;               // 统计历史数据大小
const STATS_FPS_WINDOW = 60;                  // FPS计算窗口大小
const MAX_PHYSICS_TIME_MS = 8;                // 物理更新最大时间(毫秒)
const MAX_ACCUMULATOR_OVERRUN = 10;           // 累加器最大溢出倍数
const FIXED_ACCUMULATOR_RESET_THRESHOLD = 5;  // 固定模式累加器重置阈值
const MAX_TIME_SCALE = 5.0;                   // 最大时间缩放
const MIN_TIME_SCALE = 0.1;                   // 最小时间缩放
const DETAILED_STATS_INTERVAL = 1000;         // 详细统计更新间隔(ms)

// ================== Engine 类 ==================

export class Engine {
  // 引擎配置 (合并默认配置和用户配置)
  private config: Required<EngineConfig>;
  // 运行时状态
  private state: EngineState;
  // 预计算的Decimal值 (优化性能)
  private precomputed: {
    timestep: Decimal;
    minFrameTime: Decimal;
    maxAccumulator: Decimal;
    fixedResetThreshold: Decimal;
    timestepTimes5: Decimal;
    timestepTimes2: Decimal;
  };
  // 回调函数引用
  private callbacks: CallbackSet = {};
  // 详细统计缓存
  private detailedStatsCache: DetailedStats | null = null;
  private lastDetailedStatsUpdate = 0;

  /**
   * 构造函数
   * @param userConfig 用户配置 (可选)
   */
  constructor(userConfig: Partial<EngineConfig> = {}) {
    // 合并默认配置
    this.config = { ...DEFAULT_CONFIG, ...userConfig };

    // 预计算Decimal值 (避免在热路径中重复创建)
    const timestep = new Decimal(this.config.timestep);
    const minFrameTime = new Decimal(1000).div(this.config.targetFPS);

    this.precomputed = {
      timestep: timestep,
      minFrameTime: minFrameTime,
      maxAccumulator: timestep.times(MAX_ACCUMULATOR_OVERRUN),
      fixedResetThreshold: timestep.times(FIXED_ACCUMULATOR_RESET_THRESHOLD),
      timestepTimes5: timestep.times(5),
      timestepTimes2: timestep.times(2),
    };

    // 初始化状态
    this.state = this.initState();
    EngineLogger.log(`引擎初始化 - 模式: ${this.config.mode}, 目标FPS: ${this.config.targetFPS}`);
  }

  /** 初始化状态 */
  private initState(): EngineState {
    return {
      running: false,
      lastTime: 0,
      lastFrameTime: 0,
      frameId: null,
      accumulator: new Decimal(0),
      alpha: 0,
      timeScale: new Decimal(1.0),
      stats: {
        fps: 0,
        targetFPS: this.config.targetFPS,
        frameCount: 0,
        lastFpsUpdate: 0,
        deltaHistory: new Array(STATS_HISTORY_SIZE).fill(0),
        jitter: 0,
        averageDelta: 0,
        minDelta: Infinity,
        maxDelta: 0,
        updatesPerFrame: 0,
        frameTime: 0,
        renderTime: 0,
        physicsTime: 0,
        accumulator: 0,
        alpha: 0,
        running: false,
        mode: this.config.mode,
        timestep: this.config.timestep,
      },
      historyIndex: 0,
      historyFull: false,
    };
  }

  /**
   * 启动引擎
   * @returns Promise<void>
   */
  async start(): Promise<void> {
    if (this.state.running) return;

    this.state.running = true;
    this.state.stats.running = true;
    this.state.lastTime = performance.now();
    this.state.lastFrameTime = this.state.lastTime;
    this.state.accumulator = new Decimal(0);

    // 启动动画循环
    this.state.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    EngineLogger.log(`引擎启动 - 模式: ${this.config.mode}`);
  }

  /** 停止引擎 */
  stop(): void {
    if (!this.state.running) return;

    this.state.running = false;
    this.state.stats.running = false;

    // 取消动画帧
    if (this.state.frameId) {
      cancelAnimationFrame(this.state.frameId);
      this.state.frameId = null;
    }

    EngineLogger.log('引擎停止');
  }

  /**
   * 游戏主循环
   * @param currentTime 当前时间戳 (来自requestAnimationFrame)
   */
  private gameLoop(currentTime: number): void {
    if (!this.state.running) return;

    const frameStart = performance.now();

    // 1. 计算增量时间
    const rawDeltaTime = currentTime - this.state.lastTime;
    this.state.lastTime = currentTime;

    // 2. 应用帧控制 (固定模式下限制帧率)
    const deltaTime = this.applyFrameControl(rawDeltaTime);

    // 3. 更新统计信息（低频）
    if (this.config.enableStats) {
      this.updateStats(deltaTime);
    }

    // 4. 应用时间缩放并累加
    const scaledDelta = new Decimal(deltaTime).times(this.state.timeScale);
    const clampedDelta = Decimal.min(scaledDelta, this.precomputed.timestepTimes5); // 限制最大增量
    this.state.accumulator = this.state.accumulator.plus(clampedDelta);
    this.state.stats.accumulator = this.state.accumulator.toNumber();

    // 5. 执行物理更新
    const physicsStart = performance.now();
    const updateCount = this.executePhysics(physicsStart);
    this.state.stats.physicsTime = performance.now() - physicsStart;
    this.state.stats.updatesPerFrame = updateCount;

    // 6. 计算渲染插值因子
    this.calculateAlpha();
    this.state.stats.alpha = this.state.alpha;

    // 7. 执行渲染
    const renderStart = performance.now();
    this.executeRender();
    this.state.stats.renderTime = performance.now() - renderStart;

    // 8. 执行渲染后回调（带错误处理）
    this.safeExecute(this.callbacks.onPostRender, 'onPostRender');

    // 9. 记录整帧耗时
    this.state.stats.frameTime = performance.now() - frameStart;

    // 10. 处理累加器溢出
    this.handleAccumulatorOverflow();

    // 11. 安排下一帧
    this.scheduleNextFrame();
  }

  /**
   * 执行物理更新
   * @param physicsStart 物理更新开始时间 (用于超时检测)
   * @returns 实际执行的更新次数
   */
  private executePhysics(physicsStart: number): number {
    let updateCount = 0;

    // 当累加器 >= 时间步长 且 未达最大更新次数 时循环更新
    while (this.state.accumulator.gte(this.precomputed.timestep) &&
    updateCount < this.config.maxUpdates) {
      // 执行更新回调（带错误处理）
      this.safeExecute(
          () => this.callbacks.onUpdate?.(this.precomputed.timestep, performance.now()),
          'onUpdate',
      );

      this.state.accumulator = this.state.accumulator.minus(this.precomputed.timestep);
      updateCount++;

      // 超时保护
      if (performance.now() - physicsStart > MAX_PHYSICS_TIME_MS) {
        EngineLogger.warn('物理更新超时，跳过剩余更新');
        break;
      }
    }

    return updateCount;
  }

  /** 执行渲染 */
  private executeRender(): void {
    if (!this.callbacks.onRender) return;

    if (this.config.mode === 'fixed') {
      // 固定模式：不使用插值
      this.safeExecute(() => this.callbacks.onRender!(0, this.config.timestep), 'onRender');
    } else {
      // 无限制模式：使用alpha插值
      const renderDelta = this.precomputed.timestep.toNumber() * this.state.alpha;
      this.safeExecute(() => this.callbacks.onRender!(this.state.alpha, renderDelta), 'onRender');
    }
  }

  /** 计算渲染插值因子 alpha */
  private calculateAlpha(): void {
    if (this.config.mode === 'fixed') {
      this.state.alpha = 0; // 固定模式不需要插值
      return;
    }

    // alpha = 累加器 / 时间步长 (0.0 - 1.0)
    const alphaDecimal = this.state.accumulator.div(this.precomputed.timestep);
    // 钳制在 [0, alphaClamp] 范围内
    const clampedAlpha = Decimal.max(0, Decimal.min(alphaDecimal, this.config.alphaClamp));
    this.state.alpha = clampedAlpha.toNumber();
  }

  /**
   * 应用帧控制 (仅固定模式)
   * @param deltaTime 原始增量时间
   * @returns 调整后的增量时间
   */
  private applyFrameControl(deltaTime: number): number {
    if (this.config.mode !== 'fixed') return deltaTime;

    const deltaDecimal = new Decimal(deltaTime);

    // 如果太快，强制等待到最小帧时间
    if (deltaDecimal.lt(this.precomputed.minFrameTime)) {
      return this.precomputed.minFrameTime.toNumber();
    }

    // 如果太慢，限制最大增量时间 (避免卡顿导致过大步长)
    if (deltaDecimal.gt(this.precomputed.minFrameTime.times(2))) {
      return this.precomputed.minFrameTime.times(1.5).toNumber();
    }

    return deltaTime;
  }

  /** 处理累加器溢出 */
  private handleAccumulatorOverflow(): void {
    if (this.config.mode === 'fixed' && this.state.accumulator.gt(this.precomputed.fixedResetThreshold)) {
      // 固定模式：累加器过大时重置 (避免追赶过多帧)
      this.state.accumulator = new Decimal(0);
      EngineLogger.warn('固定模式累积器重置');
    } else if (this.state.accumulator.gt(this.precomputed.maxAccumulator)) {
      // 无限制模式：限制最大累加器值 (避免追赶过多帧)
      this.state.accumulator = this.precomputed.timestepTimes2;
    }
  }

  /** 安排下一帧 */
  private scheduleNextFrame(): void {
    if (!this.state.running) return;

    if (this.config.mode === 'fixed') {
      // 固定模式：使用setTimeout控制帧率
      const now = performance.now();
      const elapsed = now - this.state.lastFrameTime;
      const waitTime = Math.max(0, this.precomputed.minFrameTime.toNumber() - elapsed);

      setTimeout(() => {
        if (this.state.running) {
          this.state.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
      }, waitTime);

      this.state.lastFrameTime = now + waitTime;
    } else {
      // 无限制模式：直接使用requestAnimationFrame
      this.state.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  /**
   * 更新统计信息
   * @param deltaTime 增量时间
   */
  private updateStats(deltaTime: number): void {
    const now = performance.now();
    const stats = this.state.stats;

    // 使用循环缓冲区存储增量时间历史
    stats.deltaHistory[this.state.historyIndex] = deltaTime;
    this.state.historyIndex = (this.state.historyIndex + 1) % STATS_HISTORY_SIZE;
    if (this.state.historyIndex === 0) this.state.historyFull = true;

    // 更新FPS (低频)
    stats.frameCount++;
    if (now - stats.lastFpsUpdate >= STATS_FPS_WINDOW) {
      const elapsed = now - stats.lastFpsUpdate;
      stats.fps = (stats.frameCount / elapsed) * 1000;
      stats.frameCount = 0;
      stats.lastFpsUpdate = now;
    }

    // 更新极值（每帧更新，但开销很小）
    stats.minDelta = Math.min(stats.minDelta, deltaTime);
    stats.maxDelta = Math.max(stats.maxDelta, deltaTime);

    // 低频更新详细统计（抖动、平均值等）
    if (now - this.lastDetailedStatsUpdate >= DETAILED_STATS_INTERVAL) {
      this.updateDetailedStats();
      this.lastDetailedStatsUpdate = now;
      this.detailedStatsCache = null; // 使缓存失效
    }
  }

  /** 更新详细统计（抖动、平均值等） */
  private updateDetailedStats(): void {
    const stats = this.state.stats;
    const history = stats.deltaHistory;
    const count = this.state.historyFull ? STATS_HISTORY_SIZE : this.state.historyIndex;

    if (count < STATS_FPS_WINDOW) return;

    // 计算平均值
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += history[i];
    }
    const avg = sum / count;
    stats.averageDelta = avg;

    // 计算标准差（抖动）
    let varianceSum = 0;
    for (let i = 0; i < count; i++) {
      const diff = history[i] - avg;
      varianceSum += diff * diff;
    }
    stats.jitter = Math.sqrt(varianceSum / count);
  }

  /**
   * 安全执行回调（捕获错误）
   * @param callback 回调函数
   * @param name 回调名称（用于错误日志）
   */
  private safeExecute(callback: (() => void) | undefined, name: string): void {
    if (!callback) return;
    try {
      callback();
    } catch (error) {
      EngineLogger.error(`回调 ${name} 执行错误:`, error);
    }
  }

  /**
   * 切换引擎模式
   * @param engineMode 目标模式
   * @param targetFPS 目标帧率 (可选)
   */
  setMode(engineMode: EngineMode, targetFPS: number = 60): void {
    const oldMode = this.config.mode;
    const oldTargetFPS = this.config.targetFPS;

    // 更新配置
    this.config.mode = engineMode;
    this.config.targetFPS = targetFPS;
    this.precomputed.minFrameTime = new Decimal(1000).div(targetFPS);
    this.state.stats.targetFPS = targetFPS;
    this.state.stats.mode = engineMode;

    // 重置状态（不停止引擎）
    this.state.accumulator = new Decimal(0);
    this.state.alpha = 0;
    this.state.lastTime = performance.now();
    this.state.lastFrameTime = this.state.lastTime;

    // 重置统计
    this.state.stats.minDelta = Infinity;
    this.state.stats.maxDelta = 0;
    this.state.historyIndex = 0;
    this.state.historyFull = false;
    this.detailedStatsCache = null;

    EngineLogger.log(`引擎模式从 ${oldMode}(${oldTargetFPS}FPS) 切换到 ${engineMode}(${targetFPS}FPS)`);
  }

  /**
   * 设置时间缩放
   * @param timeScale 缩放因子 (0.1 - 5.0)
   */
  setTimeScale(timeScale: number): void {
    // 钳制在合理范围内
    const clampedScale = Math.max(MIN_TIME_SCALE, Math.min(timeScale, MAX_TIME_SCALE));
    this.state.timeScale = new Decimal(clampedScale);
    EngineLogger.log(`时间缩放设置为: ${clampedScale}x`);
  }

  /** 设置回调函数 */
  setCallbacks(callbacks: CallbackSet): void {
    this.callbacks = { ...callbacks };
  }

  /**
   * 设置时间步长
   * @param timestepMs 新的时间步长(毫秒)
   */
  setTimestep(timestepMs: number): void {
    const oldTimestep = this.precomputed.timestep;
    this.config.timestep = timestepMs;
    this.state.stats.timestep = timestepMs;

    // 重新计算预计算值
    const newTimestep = new Decimal(timestepMs);
    this.precomputed.timestep = newTimestep;
    this.precomputed.timestepTimes5 = newTimestep.times(5);
    this.precomputed.timestepTimes2 = newTimestep.times(2);
    this.precomputed.maxAccumulator = newTimestep.times(MAX_ACCUMULATOR_OVERRUN);
    this.precomputed.fixedResetThreshold = newTimestep.times(FIXED_ACCUMULATOR_RESET_THRESHOLD);

    // 按比例转换累加器值 (保持进度比例)
    if (oldTimestep.gt(0)) {
      this.state.accumulator = this.state.accumulator.times(newTimestep).div(oldTimestep);
    }

    EngineLogger.log(`时间步长从 ${oldTimestep.toFixed(2)}ms 调整为 ${timestepMs.toFixed(2)}ms`);
  }

  /** 获取详细统计信息 */
  getDetailedStats(): DetailedStats {
    // 使用缓存避免重复计算
    if (this.detailedStatsCache) {
      return this.detailedStatsCache;
    }

    const frameBudget = this.precomputed.minFrameTime.toNumber();
    const stats = this.state.stats;

    // 计算负载百分比
    const physicsPercent = (stats.physicsTime / frameBudget * 100).toFixed(1);
    const renderPercent = (stats.renderTime / frameBudget * 100).toFixed(1);
    const efficiency = ((stats.frameTime / frameBudget) * 100).toFixed(1);

    this.detailedStatsCache = {
      ...stats,
      frameBudget: `${frameBudget.toFixed(2)}ms`,
      physicsLoad: `${physicsPercent}%`,
      renderLoad: `${renderPercent}%`,
      efficiency: `${efficiency}%`,
      timeScale: this.state.timeScale.toNumber(),
    };

    return this.detailedStatsCache;
  }

  /** 获取基础统计信息 */
  getStats(): EngineStats {
    // 返回副本防止外部修改
    return { ...this.state.stats };
  }

  /** 检查引擎是否运行中 */
  isRunning(): boolean {
    return this.state.running;
  }

  /** 获取当前运行模式 */
  getMode(): EngineMode {
    return this.config.mode;
  }

  /** 获取当前时间缩放因子 */
  getTimeScale(): number {
    return this.state.timeScale.toNumber();
  }

  /** 销毁引擎 */
  destroy(): void {
    this.stop();
    this.callbacks = {};
    this.state = this.initState();
    this.detailedStatsCache = null;
  }
}
