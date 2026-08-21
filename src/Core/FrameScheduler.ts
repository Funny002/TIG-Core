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
export const browserSchedulerBackend: FrameSchedulerBackend = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
  setDelay: (callback, ms) => setTimeout(callback, ms),
  clearDelay: (handle) => clearTimeout(handle),
};

/**
 * 帧调度器
 *
 * 负责游戏循环的帧调度（requestFrame + fixed 模式的延迟限帧），
 * 与物理逻辑完全解耦，内置防重入保护，避免模式切换导致的双重循环。
 * 通过 `backend` 参数注入调度后端，可完全脱离浏览器运行。
 */
export class FrameScheduler {
  private running = false;
  private frameId: number | null = null;
  private timeoutId: number | null = null;
  private lastFrameTime = 0;
  private minFrameTime: number;
  private mode: FrameSchedulerMode;
  private readonly backend: FrameSchedulerBackend;

  constructor(
    private readonly onFrame: (timestamp: number) => void,
    mode: FrameSchedulerMode = 'unlimited',
    targetFPS = 60,
    backend: FrameSchedulerBackend = browserSchedulerBackend,
  ) {
    this.mode = mode;
    this.minFrameTime = 1000 / targetFPS;
    this.backend = backend;
  }

  /** 启动帧循环 */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = this.backend.now();
    this.scheduleNext();
  }

  /** 停止帧循环 */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.cancelPending();
  }

  /** 切换调度模式（运行中会立即按新模式重新调度） */
  setMode(mode: FrameSchedulerMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (this.running) {
      this.cancelPending();
      this.scheduleNext();
    }
  }

  /** 设置目标帧率（fixed 模式限帧用） */
  setTargetFPS(fps: number): void {
    if (!Number.isFinite(fps) || fps <= 0) return;
    this.minFrameTime = 1000 / fps;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** 取消待定的帧请求 / 延迟 */
  private cancelPending(): void {
    if (this.frameId !== null) {
      this.backend.cancelFrame(this.frameId);
      this.frameId = null;
    }
    if (this.timeoutId !== null) {
      this.backend.clearDelay(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /** 调度下一帧 */
  private scheduleNext(): void {
    if (!this.running) return;
    // 已有待定调度则跳过，避免重复循环
    if (this.frameId !== null || this.timeoutId !== null) return;

    if (this.mode === 'fixed') {
      const elapsed = this.backend.now() - this.lastFrameTime;
      const wait = Math.max(0, this.minFrameTime - elapsed);
      this.timeoutId = this.backend.setDelay(() => {
        this.timeoutId = null;
        if (!this.running) return;
        this.frameId = this.backend.requestFrame((timestamp) => this.frame(timestamp));
      }, wait);
      this.lastFrameTime = this.backend.now() + wait;
    } else {
      this.frameId = this.backend.requestFrame((timestamp) => this.frame(timestamp));
    }
  }

  /** 帧回调：执行 onFrame 后继续调度下一帧 */
  private frame(timestamp: number): void {
    this.frameId = null;
    this.onFrame(timestamp);
    this.scheduleNext();
  }
}
