// 引擎单元测试（纯 Node，无浏览器/DOM 依赖，通过注入假调度后端驱动）
// 运行：npm test  （需先 npm run build 生成 libs/index.mjs）
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Core } from '../libs/index.mjs';

/**
 * 创建可手动驱动的假调度后端
 * 模拟时间源 + 帧队列 + 延迟队列，用于完全脱离浏览器测试 FrameScheduler / Engine
 */
function createFakeBackend() {
  const state = { now: 0, frames: [], delays: [] };

  const backend = {
    now: () => state.now,
    requestFrame: (cb) => { state.frames.push(cb); return state.frames.length - 1; },
    cancelFrame: (id) => { state.frames[id] = null; },
    setDelay: (cb, ms) => { state.delays.push({ cb, at: state.now + ms }); return state.delays.length - 1; },
    clearDelay: (id) => { state.delays[id] = null; },
  };

  return {
    backend,
    /** 推进时间，并触发到点的延迟 */
    advance(ms) {
      state.now += ms;
      state.delays.forEach((d, i) => {
        if (d && d.at <= state.now) {
          d.cb();
          state.delays[i] = null;
        }
      });
    },
    /** 触发一帧（以当前时间戳调用帧回调），返回是否触发了帧 */
    pumpFrame() {
      const idx = state.frames.findIndex((f) => f);
      if (idx === -1) return false;
      const cb = state.frames[idx];
      state.frames[idx] = null;
      cb(state.now);
      return true;
    },
    pendingFrames() {
      return state.frames.filter(Boolean).length;
    },
  };
}

test('FixedAccumulator：固定步长累加与插值因子', () => {
  const acc = new Core.FixedAccumulator(10, 5, 1);
  let updates = 0;

  assert.equal(acc.advance(25, 0, () => { updates += 1; }), 2, '25ms 应执行 2 步');
  assert.equal(updates, 2);
  assert.ok(Math.abs(acc.alpha - 0.5) < 1e-9, 'alpha 应为 0.5');

  // 死亡螺旋保护
  updates = 0;
  assert.equal(acc.advance(100, 0, () => { updates += 1; }), 5, '100ms 触达上限 5 步');
  assert.equal(acc.value, 0, '死亡螺旋后累加器重置');

  acc.setTimestep(20);
  assert.equal(acc.getTimestep(), 20, 'setTimestep 生效');
});

test('StatsCollector：统计快照', () => {
  const sc = new Core.StatsCollector();
  sc.reset(0);
  sc.record(16.7, 0, 16.7, 5, 10, 1);
  sc.record(16.7, 100, 16.7, 5, 10, 2);

  const s = sc.snapshot();
  assert.equal(s.deltaHistory.length, 2);
  assert.equal(s.updatesPerFrame, 2);
  assert.equal(s.frameTime, 16.7);
});

test('FrameScheduler：假后端驱动帧循环', () => {
  const f = createFakeBackend();
  let frames = 0;
  const sched = new Core.FrameScheduler(() => { frames += 1; }, 'unlimited', 60, f.backend);

  sched.start();
  assert.equal(f.pendingFrames(), 1, '启动后请求 1 帧');

  f.pumpFrame();
  assert.equal(frames, 1, '帧已执行');
  assert.equal(f.pendingFrames(), 1, '帧执行后自动请求下一帧');

  sched.stop();
  assert.equal(sched.isRunning, false, '停止后不再运行');
});

test('Engine：假后端运行固定步长更新', () => {
  const f = createFakeBackend();
  let updates = 0;
  const engine = new Core.Engine({ mode: 'unlimited', timestep: 16 }, f.backend);
  engine.setCallbacks({ onUpdate: () => { updates += 1; } });

  engine.start();
  for (let i = 0; i < 6; i += 1) {
    f.advance(16);
    f.pumpFrame();
  }
  engine.stop();

  assert.equal(updates, 6, '6 帧 × 16ms 应执行 6 次更新');
  assert.equal(engine.isRunning(), false);
});

test('Engine：生命周期事件与暂停/恢复/单步', () => {
  const f = createFakeBackend();
  const engine = new Core.Engine({ mode: 'unlimited', timestep: 16 }, f.backend);

  let start = 0, pause = 0, resume = 0, modeChanged = 0, updates = 0;
  engine.on('start', () => { start += 1; });
  engine.on('pause', () => { pause += 1; });
  engine.on('resume', () => { resume += 1; });
  engine.on('mode-changed', () => { modeChanged += 1; });
  engine.setCallbacks({ onUpdate: () => { updates += 1; } });

  engine.start();
  f.advance(16);
  f.pumpFrame();
  assert.equal(updates, 1);

  engine.pause();
  assert.equal(engine.isPaused(), true);
  const before = updates;
  engine.step(3);
  assert.equal(updates, before + 3, 'step(3) 手动推进 3 步');

  engine.resume();
  f.advance(16);
  f.pumpFrame();
  assert.equal(updates, before + 3 + 1, '恢复后继续更新');

  engine.setMode('unlimited', 120);
  assert.equal(engine.getConfig().targetFPS, 120, 'setMode 更新目标帧率');
  engine.stop();

  assert.equal(start, 1);
  assert.equal(pause, 1);
  assert.equal(resume, 1);
  assert.equal(modeChanged, 1);
});
