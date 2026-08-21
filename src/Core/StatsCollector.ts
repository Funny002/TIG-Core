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
export class StatsCollector {
  private readonly deltaHistory: number[];
  private historyIndex = 0;
  private historyFull = false;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private fps = 0;
  private minDelta = Infinity;
  private maxDelta = 0;
  private averageDelta = 0;
  private jitter = 0;
  private updatesPerFrame = 0;
  private frameTime = 0;
  private renderTime = 0;
  private physicsTime = 0;

  constructor(private readonly historySize = 120, private readonly fpsInterval = 500) {
    this.deltaHistory = new Array(historySize).fill(0);
  }

  /** 重置统计状态 */
  reset(now: number): void {
    this.historyIndex = 0;
    this.historyFull = false;
    this.frameCount = 0;
    this.lastFpsUpdate = now;
    this.fps = 0;
    this.minDelta = Infinity;
    this.maxDelta = 0;
    this.averageDelta = 0;
    this.jitter = 0;
    this.updatesPerFrame = 0;
    this.frameTime = 0;
    this.renderTime = 0;
    this.physicsTime = 0;
  }

  /** 记录一帧的统计 */
  record(
    deltaTime: number,
    now: number,
    frameTime: number,
    physicsTime: number,
    renderTime: number,
    updatesPerFrame: number,
  ): void {
    // 环形缓冲写入帧时间
    this.deltaHistory[this.historyIndex] = deltaTime;
    this.historyIndex = (this.historyIndex + 1) % this.historySize;
    if (this.historyIndex === 0) this.historyFull = true;

    this.minDelta = Math.min(this.minDelta, deltaTime);
    this.maxDelta = Math.max(this.maxDelta, deltaTime);
    this.frameTime = frameTime;
    this.physicsTime = physicsTime;
    this.renderTime = renderTime;
    this.updatesPerFrame = updatesPerFrame;

    this.frameCount += 1;
    if (now - this.lastFpsUpdate >= this.fpsInterval) {
      this.fps = (this.frameCount / (now - this.lastFpsUpdate)) * 1000;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.updateAverage();
    }
  }

  /** 输出统计快照（帧时间历史按时间顺序） */
  snapshot(): MeasuredStats {
    const count = this.historyFull ? this.historySize : this.historyIndex;
    const start = this.historyFull ? this.historyIndex : 0;
    const history = new Array(count);
    for (let i = 0; i < count; i += 1) {
      history[i] = this.deltaHistory[(start + i) % this.historySize];
    }

    return {
      fps: this.fps,
      frameCount: this.frameCount,
      lastFpsUpdate: this.lastFpsUpdate,
      deltaHistory: history,
      jitter: this.jitter,
      averageDelta: this.averageDelta,
      minDelta: this.minDelta === Infinity ? 0 : this.minDelta,
      maxDelta: this.maxDelta,
      updatesPerFrame: this.updatesPerFrame,
      frameTime: this.frameTime,
      renderTime: this.renderTime,
      physicsTime: this.physicsTime,
    };
  }

  /** 低频更新平均值与抖动（标准差） */
  private updateAverage(): void {
    const count = this.historyFull ? this.historySize : this.historyIndex;
    if (count < 2) {
      this.averageDelta = 0;
      this.jitter = 0;
      return;
    }

    let sum = 0;
    for (let i = 0; i < count; i += 1) sum += this.deltaHistory[i];
    const avg = sum / count;
    this.averageDelta = avg;

    let varSum = 0;
    for (let i = 0; i < count; i += 1) {
      const diff = this.deltaHistory[i] - avg;
      varSum += diff * diff;
    }
    this.jitter = Math.sqrt(varSum / count);
  }
}
