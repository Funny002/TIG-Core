/**
 * 固定时间步长累加器
 *
 * 纯逻辑实现，不依赖 requestAnimationFrame / DOM，便于单元测试与复用。
 * 负责：时间累积、固定步长触发、插值因子计算、死亡螺旋保护。
 */
export class FixedAccumulator {
  private accumulator = 0;
  private timestep: number;
  private maxUpdates: number;
  private alphaClamp: number;

  constructor(timestep: number, maxUpdates = 10, alphaClamp = 1) {
    this.timestep = timestep;
    this.maxUpdates = maxUpdates;
    this.alphaClamp = alphaClamp;
  }

  /**
   * 累加经过的时间，并以固定步长执行更新回调
   * @param deltaTime 本帧经过的时间（毫秒）
   * @param now 当前时间戳（由调用方传入，保持纯逻辑）
   * @param update 固定步长更新回调
   * @returns 实际执行的更新次数
   */
  advance(deltaTime: number, now: number, update: (timestep: number, now: number) => void): number {
    this.accumulator += deltaTime;
    let count = 0;

    while (this.accumulator >= this.timestep && count < this.maxUpdates) {
      update(this.timestep, now);
      this.accumulator -= this.timestep;
      count += 1;
    }

    // 死亡螺旋保护：达到最大更新次数仍未清空累加器，则丢弃剩余时间
    if (count === this.maxUpdates && this.accumulator >= this.timestep) {
      this.accumulator = 0;
    }

    return count;
  }

  /** 渲染插值因子（钳制在 [0, alphaClamp]） */
  get alpha(): number {
    return Math.min(Math.max(this.accumulator / this.timestep, 0), this.alphaClamp);
  }

  /** 当前累加器值（毫秒） */
  get value(): number {
    return this.accumulator;
  }

  set value(v: number) {
    this.accumulator = v;
  }

  /** 重置累加器 */
  reset(): void {
    this.accumulator = 0;
  }

  /** 调整时间步长（按比例换算累加值，保持进度） */
  setTimestep(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    this.accumulator = (this.accumulator / this.timestep) * ms;
    this.timestep = ms;
  }

  /** 调整每帧最大更新次数 */
  setMaxUpdates(max: number): void {
    if (Number.isFinite(max) && max >= 1) this.maxUpdates = max;
  }

  /** 调整插值因子钳制上限 */
  setAlphaClamp(clamp: number): void {
    if (Number.isFinite(clamp) && clamp >= 0) this.alphaClamp = clamp;
  }

  getTimestep(): number {
    return this.timestep;
  }
}
