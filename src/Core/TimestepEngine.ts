import { Logger } from '../Utils';

const logger = new Logger({ prefix: 'Engine' });

export type PostRenderCallback = () => void; // 渲染回调
export type EngineMode = 'fixed' | 'adaptive' | 'unlimited'; // 引擎模式
export type RenderCallback = (alpha: number, deltaTime: number) => void; // 物理更新回调
export type UpdateCallback = (timestep: number, currentTime: number) => void; // 物理更新回调

export interface EngineConfig {
  timestep: number;            // 固定时间步长（毫秒）
  maxUpdates: number;          // 最大追赶更新次数
  alphaClamp: number;          // 插值因子限制
  mode: EngineMode;            // 引擎模式
  targetFPS: number;           // 目标FPS（仅固定和自适应模式有效）
  useRAF: boolean;             // 是否使用 requestAnimationFrame
  useWorker: boolean;          // 是否使用 Web Worker
  enableStats: boolean;        // 是否启用性能统计
}

export interface EngineStats {
  fps: number;                  // FPS
  targetFPS: number;            // 目标FPS
  frameCount: number;           // 帧数
  lastFpsUpdate: number;        // 最后一次更新帧率
  deltaHistory: number[];       // 时间增量
  jitter: number;               // 时间抖动
  averageDelta: number;         // 平均时间增量
  minDelta: number;             // 最小时间增量
  maxDelta: number;             // 最大时间增量
  updatesPerFrame: number;      // 物理更新次数
  frameTime: number;            // 帧时间
  renderTime: number;           // 渲染时间
  physicsTime: number;          // 物理时间
  accumulator: number;          // 时间累积
  alpha: number;                // 插值因子
  running: boolean;             // 运行状态
  timestep: number;             // 时间步长
  mode: EngineMode;             // 引擎模式
}

export interface CallbackSet {
  onUpdate?: UpdateCallback;
  onRender?: RenderCallback;
  onPostRender?: PostRenderCallback;
}

export interface DetailedStats extends EngineStats {
  frameBudget: string;          // 帧预算
  physicsLoad: string;          // 物理加载
  renderLoad: string;           // 渲染加载
  efficiency: string;           // 效率
  timeScale: number;            // 时间缩放
}

export class TimestepEngine {
  // 私有属性
  private config: EngineConfig;
  private readonly stats: EngineStats;
  private running = false;
  private accumulator = 0;
  private lastTime = 0;
  private lastFrameTime = 0;
  private frameId: number | null = null;
  private minFrameTime: number;
  private timeScale = 1.0;
  private alpha = 0;

  // 回调函数
  private onUpdate: UpdateCallback | null = null;
  private onRender: RenderCallback | null = null;
  private onPostRender: PostRenderCallback | null = null;

  // 帧时间历史记录
  private frameTimes: number[] = [];
  private readonly frameWindowSize = 120;

  // Web Worker
  private worker: Worker | null = null;

  // 调试选项
  private debug = {
    showStats: true,
    logWarnings: true,
  };

  constructor(config: Partial<EngineConfig> = {}) {
    // 默认配置
    this.config = Object.assign({
      timestep: 1000 / 60,
      maxUpdates: 10,
      alphaClamp: 1.0,
      mode: 'adaptive',
      targetFPS: 60,
      useRAF: true,
      useWorker: false,
      enableStats: true,
    }, config);

    // 初始化统计
    this.stats = this.initStats();

    // 计算最小帧时间
    this.minFrameTime = 1000 / this.config.targetFPS;

    logger.log(`引擎初始化完成 - 模式: ${this.config.mode}, 目标FPS: ${this.config.targetFPS}`);
  }

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
   */
  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;
    this.stats.running = true;
    this.lastTime = performance.now();
    this.lastFrameTime = this.lastTime;
    this.accumulator = 0;

    // 初始化 Worker（如果启用）
    if (this.config.useWorker && typeof Worker !== 'undefined') {
      await this.initWorker();
    }

    // 根据配置启动游戏循环
    if (this.config.useRAF) {
      this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    } else {
      this.startFixedInterval();
    }

    logger.log(`引擎启动 - 模式: ${this.config.mode}`);
  }

  /**
   * 停止引擎
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.stats.running = false;

    if (this.config.useRAF) {
      if (this.frameId) {
        cancelAnimationFrame(this.frameId);
      }
    } else {
      // 如果是 setInterval，需要不同的停止方式
      if (this.frameId) {
        clearInterval(this.frameId as unknown as number);
      }
    }

    // 清理 Worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.frameId = null;
    logger.log('引擎停止');
  }

  /**
   * 主游戏循环
   */
  private async gameLoop(currentTime: number): Promise<void> {
    if (!this.running) return;

    const frameStart = performance.now();

    // 计算原始时间增量
    const rawDeltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 应用帧率控制
    let deltaTime = this.applyFrameControl(rawDeltaTime);

    // 更新时间统计
    this.updateStats(deltaTime, frameStart);

    // 应用时间缩放
    deltaTime *= this.timeScale;

    // 限制最大时间增量
    const maxDelta = this.config.timestep * 5;
    deltaTime = Math.min(deltaTime, maxDelta);

    // 累积时间
    this.accumulator += deltaTime;
    this.stats.accumulator = this.accumulator;

    // 执行物理更新
    const physicsStart = performance.now();
    const updateCount = this.config.useWorker && this.worker
        ? await this.executePhysicsWorker()
        : this.executePhysicsMain(physicsStart);

    this.stats.physicsTime = performance.now() - physicsStart;
    this.stats.updatesPerFrame = updateCount;

    // 计算插值因子
    this.calculateAlpha();
    this.stats.alpha = this.alpha;

    // 执行渲染
    const renderStart = performance.now();
    this.executeRender();
    this.stats.renderTime = performance.now() - renderStart;

    // 后处理回调
    if (this.onPostRender) {
      this.onPostRender();
    }

    // 处理累积器溢出
    this.handleAccumulatorOverflow();

    // 总帧时间
    this.stats.frameTime = performance.now() - frameStart;

    // 调度下一帧
    this.scheduleNextFrame();
  }

  /**
   * 执行物理更新（主线程）
   */
  private executePhysicsMain(physicsStart: number): number {
    let updateCount = 0;
    const updateTimestep = this.config.timestep;
    const maxPhysicsTime = 8; // 最多8ms物理计算

    while (this.accumulator >= updateTimestep && updateCount < this.config.maxUpdates) {
      if (this.onUpdate) {
        this.onUpdate(updateTimestep, performance.now());
      }

      this.accumulator -= updateTimestep;
      updateCount++;

      // 防止物理更新占用过多时间
      if (performance.now() - physicsStart > maxPhysicsTime) {
        if (this.debug.logWarnings) {
          logger.warn('物理更新超时，跳过剩余更新');
        }
        break;
      }
    }

    return updateCount;
  }

  /**
   * 执行物理更新（Worker线程）
   */
  private async executePhysicsWorker(): Promise<number> {
    if (!this.worker) return 0;

    return new Promise((resolve) => {
      const updateTimestep = this.config.timestep;
      let updateCount = 0;

      // 模拟 Worker 处理 - 实际应用中应该发送真实数据
      const processInterval = setInterval(() => {
        if (this.accumulator >= updateTimestep && updateCount < this.config.maxUpdates) {
          // 这里应该向 Worker 发送消息
          // this.worker?.postMessage({ type: 'update', timestep: updateTimestep });

          this.accumulator -= updateTimestep;
          updateCount++;
        } else {
          clearInterval(processInterval);
          resolve(updateCount);
        }
      }, 0);
    });
  }

  /**
   * 执行渲染
   */
  private executeRender(): void {
    if (!this.onRender) return;

    switch (this.config.mode) {
      case 'fixed':
        // 固定帧率渲染（无插值）
        this.onRender(0, this.config.timestep);
        break;

      case 'adaptive':
      case 'unlimited':
        // 自适应/无限帧率渲染（使用插值）
        const renderDelta = this.config.timestep * this.alpha;
        this.onRender(this.alpha, renderDelta);
        break;
    }
  }

  /**
   * 计算插值因子
   */
  private calculateAlpha(): void {
    if (this.config.mode === 'fixed') {
      this.alpha = 0;
    } else {
      this.alpha = this.accumulator / this.config.timestep;
      this.alpha = Math.min(Math.max(this.alpha, 0), this.config.alphaClamp);
    }
  }

  /**
   * 应用帧率控制
   */
  private applyFrameControl(deltaTime: number): number {
    switch (this.config.mode) {
      case 'fixed':
        return this.applyFixedFPSControl(deltaTime);
      case 'adaptive':
        return this.applyAdaptiveControl(deltaTime);
      case 'unlimited':
        return deltaTime;
      default:
        return deltaTime;
    }
  }

  /**
   * 应用固定FPS控制
   */
  private applyFixedFPSControl(deltaTime: number): number {
    // 如果帧太快，调整到目标帧时间
    if (deltaTime < this.minFrameTime) {
      const waitTime = this.minFrameTime - deltaTime;
      // 这里不实际等待，只是调整时间值
      deltaTime = this.minFrameTime;
    }
    // 如果帧太慢，应用限制
    else if (deltaTime > this.minFrameTime * 2) {
      deltaTime = this.minFrameTime * 1.5;
    }

    return deltaTime;
  }

  /**
   * 应用自适应控制
   */
  private applyAdaptiveControl(deltaTime: number): number {
    // 记录帧时间
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.frameWindowSize) {
      this.frameTimes.shift();
    }

    // 计算移动平均
    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    // 如果帧率过低，轻微降低质量
    if (avgDelta > this.minFrameTime * 1.5) {
      if (this.debug.logWarnings) {
        logger.warn(`帧率过低: ${(1000 / avgDelta).toFixed(1)}FPS，启动自适应降级`);
      }

      // 轻微压缩时间
      return Math.min(deltaTime, avgDelta * 0.9);
    }

    return deltaTime;
  }

  /**
   * 处理累积器溢出
   */
  private handleAccumulatorOverflow(): void {
    const maxAccumulator = this.config.timestep * 10;

    switch (this.config.mode) {
      case 'adaptive':
        if (this.accumulator > this.config.timestep * 3) {
          const catchUpFactor = 0.8;
          this.accumulator *= catchUpFactor;
          if (this.debug.logWarnings) {
            logger.warn(`累积器溢出，应用时间缩放: ${catchUpFactor}`);
          }
        }
        break;

      case 'fixed':
        if (this.accumulator > this.config.timestep * 5) {
          this.accumulator = 0;
          if (this.debug.logWarnings) {
            logger.warn('固定模式累积器重置');
          }
        }
        break;

      case 'unlimited':
        if (this.accumulator > maxAccumulator) {
          this.accumulator = this.config.timestep * 2;
        }
        break;
    }

    // 通用限制
    if (this.accumulator > maxAccumulator) {
      this.accumulator = maxAccumulator;
    }
  }

  /**
   * 调度下一帧
   */
  private scheduleNextFrame(): void {
    if (!this.config.useRAF || !this.running) return;

    if (this.config.mode === 'fixed') {
      // 固定帧率模式：使用 setTimeout 进行精确控制
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      const waitTime = Math.max(0, this.minFrameTime - elapsed);

      setTimeout(() => {
        if (this.running) {
          this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
      }, waitTime);

      this.lastFrameTime = now + waitTime;
    } else {
      // 自适应/无限模式：立即请求下一帧
      this.frameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  /**
   * 使用 setInterval 的固定帧率循环
   */
  private startFixedInterval(): void {
    if (this.config.mode === 'fixed') {
      const interval = 1000 / this.config.targetFPS;
      this.frameId = setInterval(() => {
        const timestamp = performance.now();
        this.gameLoop(timestamp);
      }, interval) as unknown as number;
    } else {
      // 自适应/无限模式
      const adaptiveLoop = () => {
        const timestamp = performance.now();
        this.gameLoop(timestamp);

        if (this.config.mode === 'adaptive' && this.running) {
          const nextDelay = Math.max(0, this.minFrameTime - this.stats.frameTime);
          setTimeout(adaptiveLoop, nextDelay);
        } else if (this.config.mode === 'unlimited' && this.running) {
          setImmediate(adaptiveLoop);
        }
      };

      adaptiveLoop();
    }
  }

  /**
   * 初始化 Web Worker
   */
  private async initWorker(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            if (e.data.type === 'update') {
              // 模拟物理计算
              const start = performance.now();
              while (performance.now() - start < 2) {}
              
              self.postMessage({
                type: 'updateComplete',
                timestamp: e.data.timestamp
              });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === 'updateComplete') {
            // 处理完成消息
          }
        };

        resolve();
      } catch (error) {
        logger.error('Worker初始化失败:', error);
        this.config.useWorker = false;
        resolve();
      }
    });
  }

  /**
   * 更新性能统计
   */
  private updateStats(deltaTime: number, frameStart: number): void {
    const now = performance.now();

    // 记录时间历史
    this.stats.deltaHistory.push(deltaTime);
    if (this.stats.deltaHistory.length > 240) {
      this.stats.deltaHistory.shift();
    }

    // 计算统计信息
    if (this.stats.deltaHistory.length >= 60) {
      const sum = this.stats.deltaHistory.reduce((a, b) => a + b, 0);
      const avg = sum / this.stats.deltaHistory.length;

      // 计算抖动（标准差）
      const variance = this.stats.deltaHistory.reduce((acc, val) => {
        return acc + Math.pow(val - avg, 2);
      }, 0) / this.stats.deltaHistory.length;

      this.stats.jitter = Math.sqrt(variance);
      this.stats.averageDelta = avg;
      this.stats.minDelta = Math.min(this.stats.minDelta, deltaTime);
      this.stats.maxDelta = Math.max(this.stats.maxDelta, deltaTime);
    }

    // 计算 FPS
    this.stats.frameCount++;
    if (now - this.stats.lastFpsUpdate >= 500) {
      const elapsed = now - this.stats.lastFpsUpdate;
      this.stats.fps = (this.stats.frameCount / elapsed) * 1000;
      this.stats.frameCount = 0;
      this.stats.lastFpsUpdate = now;
    }
  }

  /**
   * 设置引擎模式
   */
  setMode(mode: EngineMode, targetFPS: number = 60): void {
    const oldMode = this.config.mode;
    const oldTargetFPS = this.config.targetFPS;

    this.config.mode = mode;
    this.config.targetFPS = targetFPS;
    this.minFrameTime = 1000 / targetFPS;
    this.stats.targetFPS = targetFPS;
    this.stats.mode = mode;

    if (this.running) {
      // 重启引擎以应用新模式
      this.stop();
      setTimeout(() => this.start(), 100);
    }

    logger.log(`引擎模式从 ${oldMode}(${oldTargetFPS}FPS) 切换到 ${mode}(${targetFPS}FPS)`);
  }

  /**
   * 设置时间缩放
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(scale, 5.0));
    logger.log(`时间缩放设置为: ${this.timeScale}x`);
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: CallbackSet): void {
    if (callbacks.onUpdate) this.onUpdate = callbacks.onUpdate;
    if (callbacks.onRender) this.onRender = callbacks.onRender;
    if (callbacks.onPostRender) this.onPostRender = callbacks.onPostRender;
  }

  /**
   * 设置时间步长
   */
  setTimestep(ms: number): void {
    const oldTimestep = this.config.timestep;
    this.config.timestep = ms;
    this.stats.timestep = ms;
    this.accumulator = (this.accumulator / oldTimestep) * ms;
    logger.log(`时间步长从 ${oldTimestep.toFixed(2)}ms 调整为 ${ms.toFixed(2)}ms`);
  }

  /**
   * 获取详细统计信息
   */
  getDetailedStats(): DetailedStats {
    const frameBudget = this.minFrameTime;
    const physicsPercent = (this.stats.physicsTime / frameBudget * 100).toFixed(1);
    const renderPercent = (this.stats.renderTime / frameBudget * 100).toFixed(1);
    const efficiency = ((this.stats.frameTime / frameBudget) * 100).toFixed(1);

    return {
      ...this.stats,
      frameBudget: `${frameBudget.toFixed(2)}ms`,
      physicsLoad: `${physicsPercent}%`,
      renderLoad: `${renderPercent}%`,
      efficiency: `${efficiency}%`,
      timeScale: this.timeScale,
    };
  }

  /**
   * 获取引擎统计
   */
  getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * 获取当前模式
   */
  getMode(): EngineMode {
    return this.config.mode;
  }

  /**
   * 获取当前时间缩放
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * 销毁引擎，释放资源
   */
  destroy(): void {
    this.stop();
    this.onUpdate = null;
    this.onRender = null;
    this.onPostRender = null;
    this.frameTimes = [];
    this.stats.deltaHistory = [];
  }
}
