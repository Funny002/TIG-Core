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

// ================== 常量定义 ==================

/** 默认引擎配置 */
const DEFAULT_CONFIG: Required<EngineConfig> = {
  timestep: 1000 / 60,     // 60FPS对应的时间步长(约16.67ms)
  maxUpdates: 10,          // 每帧最多10次物理更新
  alphaClamp: 1.0,         // alpha最大值
  mode: 'fixed',           // 默认固定时间步长模式
  targetFPS: 60,           // 目标60FPS
  enableStats: true,       // 默认启用统计
};

const STATS_HISTORY_SIZE = 240;    // 统计历史数据大小
const STATS_FPS_WINDOW = 60;       // FPS计算窗口大小
const MAX_PHYSICS_TIME_MS = 8;     // 物理更新最大时间(毫秒)
const MAX_ACCUMULATOR_OVERRUN = 10; // 累加器最大溢出倍数
const FIXED_ACCUMULATOR_RESET_THRESHOLD = 5; // 固定模式累加器重置阈值

// ================== Engine 类 ==================

export class Engine {
  // 引擎配置 (合并默认配置和用户配置)
  private config: Required<EngineConfig>;
  // 统计信息对象
  private readonly stats: EngineStats;
  // 引擎运行状态标志
  private running = false;
  // 物理累加器 (使用Decimal确保高精度)
  private accumulator = new Decimal(0);
  // 上次帧时间戳
  private lastTime = 0;
  // 上次实际帧时间 (用于固定模式帧控制)
  private lastFrameTime = 0;
  // 动画帧ID
  private frameId: number | null = null;
  // 最小帧时间 (1000ms / targetFPS)
  private minFrameTime: Decimal;
  // 时间缩放因子
  private timeScale = new Decimal(1.0);
  // 渲染插值因子 (0.0 - 1.0)
  private alpha = 0;

  // 回调函数引用
  private onUpdate: UpdateCallback | null = null;
  private onRender: RenderCallback | null = null;
  private onPostRender: PostRenderCallback | null = null;

  // 预计算的Decimal值 (优化性能)
  private timestepDecimal: Decimal;
  private maxAccumulatorDecimal: Decimal;
  private fixedResetThreshold: Decimal;

  /**
   * 构造函数
   * @param userConfig 用户配置 (可选)
   */
  constructor(userConfig: Partial<EngineConfig> = {}) {
    // 合并默认配置
    this.config = { ...DEFAULT_CONFIG, ...userConfig };

    // 预计算Decimal值 (避免重复创建对象)
    this.timestepDecimal = new Decimal(this.config.timestep);
    this.minFrameTime = new Decimal(1000).div(this.config.targetFPS);
    this.maxAccumulatorDecimal = this.timestepDecimal.times(MAX_ACCUMULATOR_OVERRUN);
    this.fixedResetThreshold = this.timestepDecimal.times(FIXED_ACCUMULATOR_RESET_THRESHOLD);

    // 初始化统计信息
    this.stats = this.initStats();
    EngineLogger.log(`引擎初始化 - 模式: ${this.config.mode}, 目标FPS: ${this.config.targetFPS}`);
  }

  /** 初始化统计信息对象 */
  private initStats(): EngineStats {
    return {
      fps: 0,
      targetFPS: this.config.targetFPS,
      frameCount: 0,
      lastFpsUpdate: 0,
      deltaHistory: [],
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
    };
  }

  /**
   * 启动引擎
   * @returns Promise<void>
   */
  async start(): Promise<void> {
    if (this.running) return; // 避免重复启动

    this.running = true;
    this.stats.running = true;
    this.lastTime = performance.now();
    this.lastFrameTime = this.lastTime;
    this.accumulator = new Decimal(0); // 重置累加器

    // 启动动画循环
    this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    EngineLogger.log(`引擎启动 - 模式: ${this.config.mode}`);
  }

  /** 停止引擎 */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.stats.running = false;

    // 取消动画帧
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    EngineLogger.log('引擎停止');
  }

  /**
   * 游戏主循环
   * @param currentTime 当前时间戳 (来自requestAnimationFrame)
   */
  private gameLoop(currentTime: number): void {
    if (!this.running) return;

    const frameStart = performance.now(); // 帧开始时间

    // 计算原始增量时间
    const rawDeltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 应用帧控制 (固定模式下限制帧率)
    let deltaTime = this.applyFrameControl(rawDeltaTime);
    this.updateStats(deltaTime); // 更新统计信息

    // 应用时间缩放
    const scaledDelta = new Decimal(deltaTime).times(this.timeScale);

    // 限制最大增量时间 (防止卡顿导致过大步长)
    const maxDelta = this.timestepDecimal.times(5);
    const clampedDelta = Decimal.min(scaledDelta, maxDelta);

    // 累加到物理累加器
    this.accumulator = this.accumulator.plus(clampedDelta);
    this.stats.accumulator = this.accumulator.toNumber();

    // 执行物理更新
    const physicsStart = performance.now();
    const updateCount = this.executePhysics(physicsStart);
    this.stats.physicsTime = performance.now() - physicsStart;
    this.stats.updatesPerFrame = updateCount;

    // 计算渲染插值因子
    this.calculateAlpha();
    this.stats.alpha = this.alpha;

    // 执行渲染
    const renderStart = performance.now();
    this.executeRender();
    this.stats.renderTime = performance.now() - renderStart;

    // 执行渲染后回调
    this.onPostRender?.();

    // 记录整帧耗时
    this.stats.frameTime = performance.now() - frameStart;

    // 处理累加器溢出
    this.handleAccumulatorOverflow();
    // 安排下一帧
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
    while (this.accumulator.gte(this.timestepDecimal) &&
    updateCount < this.config.maxUpdates) {
      // 执行更新回调
      this.onUpdate?.(this.timestepDecimal, performance.now());
      // 减去一个时间步长
      this.accumulator = this.accumulator.minus(this.timestepDecimal);
      updateCount++;

      // 超时保护 (防止卡顿导致长时间阻塞)
      if (performance.now() - physicsStart > MAX_PHYSICS_TIME_MS) {
        EngineLogger.warn('物理更新超时，跳过剩余更新');
        break;
      }
    }

    return updateCount;
  }

  /** 执行渲染 */
  private executeRender(): void {
    if (!this.onRender) return;

    if (this.config.mode === 'fixed') {
      // 固定模式：不使用插值
      this.onRender(0, this.config.timestep);
    } else {
      // 无限制模式：使用alpha插值
      const renderDelta = this.timestepDecimal.times(this.alpha).toNumber();
      this.onRender(this.alpha, renderDelta);
    }
  }

  /** 计算渲染插值因子 alpha */
  private calculateAlpha(): void {
    if (this.config.mode === 'fixed') {
      this.alpha = 0; // 固定模式不需要插值
      return;
    }

    // alpha = 累加器 / 时间步长 (0.0 - 1.0)
    const alphaDecimal = this.accumulator.div(this.timestepDecimal);
    // 钳制在 [0, alphaClamp] 范围内
    const clampedAlpha = Decimal.max(0, Decimal.min(alphaDecimal, this.config.alphaClamp));
    this.alpha = clampedAlpha.toNumber();
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
    if (deltaDecimal.lt(this.minFrameTime)) {
      return this.minFrameTime.toNumber();
    }

    // 如果太慢，限制最大增量时间 (避免卡顿导致过大步长)
    if (deltaDecimal.gt(this.minFrameTime.times(2))) {
      return this.minFrameTime.times(1.5).toNumber();
    }

    return deltaTime;
  }

  /** 处理累加器溢出 */
  private handleAccumulatorOverflow(): void {
    if (this.config.mode === 'fixed' && this.accumulator.gt(this.fixedResetThreshold)) {
      // 固定模式：累加器过大时重置 (避免追赶过多帧)
      this.accumulator = new Decimal(0);
      EngineLogger.warn('固定模式累积器重置');
    } else if (this.accumulator.gt(this.maxAccumulatorDecimal)) {
      // 无限制模式：限制最大累加器值 (避免追赶过多帧)
      this.accumulator = this.timestepDecimal.times(2);
    }
  }

  /** 安排下一帧 */
  private scheduleNextFrame(): void {
    if (!this.running) return;

    if (this.config.mode === 'fixed') {
      // 固定模式：使用setTimeout控制帧率
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      const waitTime = Math.max(0, this.minFrameTime.toNumber() - elapsed);

      setTimeout(() => {
        if (this.running) {
          this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
      }, waitTime);

      this.lastFrameTime = now + waitTime;
    } else {
      // 无限制模式：直接使用requestAnimationFrame
      this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  /**
   * 更新统计信息
   * @param deltaTime 增量时间
   */
  private updateStats(deltaTime: number): void {
    const now = performance.now();
    const history = this.stats.deltaHistory;

    // 更新增量时间历史
    history.push(deltaTime);
    if (history.length > STATS_HISTORY_SIZE) {
      history.shift(); // 保持历史数据大小
    }

    // 计算抖动和平均值 (需要足够数据)
    if (history.length >= STATS_FPS_WINDOW) {
      const sum = history.reduce((a, b) => a + b, 0);
      const avg = sum / history.length;

      // 计算方差和标准差
      const variance = history.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / history.length;
      this.stats.jitter = Math.sqrt(variance); // 抖动 = 标准差
      this.stats.averageDelta = avg;
      this.stats.minDelta = Math.min(this.stats.minDelta, deltaTime);
      this.stats.maxDelta = Math.max(this.stats.maxDelta, deltaTime);
    }

    // 更新FPS (每500ms更新一次)
    this.stats.frameCount++;
    if (now - this.stats.lastFpsUpdate >= 500) {
      const elapsed = now - this.stats.lastFpsUpdate;
      this.stats.fps = (this.stats.frameCount / elapsed) * 1000; // FPS = 帧数/时间 * 1000
      this.stats.frameCount = 0;
      this.stats.lastFpsUpdate = now;
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

    this.config.mode = engineMode;
    this.config.targetFPS = targetFPS;
    this.minFrameTime = new Decimal(1000).div(targetFPS); // 更新最小帧时间
    this.stats.targetFPS = targetFPS;
    this.stats.mode = engineMode;

    // 如果引擎正在运行，重启以应用新模式
    if (this.running) {
      this.stop();
      setTimeout(() => this.start(), 100);
    }

    EngineLogger.log(`引擎模式从 ${oldMode}(${oldTargetFPS}FPS) 切换到 ${engineMode}(${targetFPS}FPS)`);
  }

  /**
   * 设置时间缩放
   * @param timeScale 缩放因子 (0.1 - 5.0)
   */
  setTimeScale(timeScale: number): void {
    // 钳制在合理范围内 (0.1x - 5.0x)
    const clampedScale = Math.max(0.1, Math.min(timeScale, 5.0));
    this.timeScale = new Decimal(clampedScale);
    EngineLogger.log(`时间缩放设置为: ${this.timeScale.toNumber()}x`);
  }

  /** 设置回调函数 */
  setCallbacks(callbacks: CallbackSet): void {
    this.onUpdate = callbacks.onUpdate || null;
    this.onRender = callbacks.onRender || null;
    this.onPostRender = callbacks.onPostRender || null;
  }

  /**
   * 设置时间步长
   * @param timestepMs 新的时间步长(毫秒)
   */
  setTimestep(timestepMs: number): void {
    const oldTimestep = new Decimal(this.config.timestep);
    this.config.timestep = timestepMs;
    this.timestepDecimal = new Decimal(timestepMs);
    this.stats.timestep = timestepMs;

    // 重新计算相关Decimal值
    this.maxAccumulatorDecimal = this.timestepDecimal.times(MAX_ACCUMULATOR_OVERRUN);
    this.fixedResetThreshold = this.timestepDecimal.times(FIXED_ACCUMULATOR_RESET_THRESHOLD);

    // 按比例转换累加器值 (保持进度比例)
    if (!oldTimestep.equals(0)) {
      this.accumulator = this.accumulator.times(this.timestepDecimal).div(oldTimestep);
    }

    EngineLogger.log(`时间步长从 ${oldTimestep.toFixed(2)}ms 调整为 ${timestepMs.toFixed(2)}ms`);
  }

  /** 获取详细统计信息 */
  getDetailedStats(): DetailedStats {
    const frameBudget = this.minFrameTime.toNumber(); // 理论帧时间
    // 计算负载百分比 (实际耗时 / 帧预算 * 100)
    const physicsPercent = (this.stats.physicsTime / frameBudget * 100).toFixed(1);
    const renderPercent = (this.stats.renderTime / frameBudget * 100).toFixed(1);
    const efficiency = ((this.stats.frameTime / frameBudget) * 100).toFixed(1);

    return {
      ...this.stats,
      frameBudget: `${frameBudget.toFixed(2)}ms`,
      physicsLoad: `${physicsPercent}%`,
      renderLoad: `${renderPercent}%`,
      efficiency: `${efficiency}%`, // 效率 > 100% 表示超负荷
      timeScale: this.timeScale.toNumber(),
    };
  }

  /** 获取基础统计信息 */
  getStats(): EngineStats {
    return { ...this.stats };
  }

  /** 检查引擎是否运行中 */
  isRunning(): boolean {
    return this.running;
  }

  /** 获取当前运行模式 */
  getMode(): EngineMode {
    return this.config.mode;
  }

  /** 获取当前时间缩放因子 */
  getTimeScale(): number {
    return this.timeScale.toNumber();
  }

  /** 销毁引擎 (释放资源) */
  destroy(): void {
    this.stop();
    // 清除回调引用
    this.onUpdate = null;
    this.onRender = null;
    this.onPostRender = null;
    // 清理历史数据
    this.stats.deltaHistory = [];
  }
}
