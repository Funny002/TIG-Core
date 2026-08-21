# TIG-Core 使用指南

## 核心概念

TIG-Core 是一个基于固定时间步长（Fixed Timestep）的 Canvas 游戏核心库。核心思路来自经典的
“Fix Your Timestep!” 模式：

1. 用**累加器**累计真实经过的时间；
2. 物理/逻辑更新始终以**固定时间步长**执行，与渲染帧率解耦 —— 修正在高刷显示器（144Hz 等）上游戏被加速的问题；
3. 渲染时用 **alpha 插值因子**在相邻两次物理状态之间插值，保证画面平滑。

### 两种模式

- `fixed`：按 `targetFPS` 限帧，渲染不插值（alpha=0），画面严格对应最近的物理状态；
- `unlimited`：按刷新率渲染并使用插值（alpha∈[0,1]），高刷下更平滑。

## 快速上手

```ts
import { Core, Shape } from 'tig-core';

const canvas = new Core.Canvas({ selectors: '.canvas', width: 600, height: 400, ratio: window.devicePixelRatio || 1 });
const ball = new Shape.Circle({ x: 100, y: 100, width: 40, height: 40, style: { fillStyle: '#4f8cff' } });

const engine = new Core.Engine({ mode: 'fixed' });
engine.setCallbacks({
  // 物理更新：固定步长触发
  onUpdate: (timestep) => {
    const dt = timestep / 1000;
    ball.x += 200 * dt; // 每秒 200px
  },
  // 渲染：alpha 用于插值
  onRender: (alpha) => {
    canvas.clear();
    ball.draw(canvas.context);
  },
});

engine.start();
```

更完整的示例见 [`example/`](../example/)，入口为 `example/index.html`（演练场）。

## 架构（低耦合模块）

```
Engine ── FrameScheduler（帧循环调度，可注入后端）
      ├── FixedAccumulator（固定步长累加，纯逻辑）
      └── StatsCollector（统计，纯逻辑）

Scene ── Engine
      ├── CollisionSystem ── QuadTree 空间索引 + 碰撞
      └── SceneRenderer ── zIndex 排序绘制

Canvas / Shape / QuadTree —— 独立基础组件
```

`FixedAccumulator` / `StatsCollector` / `FrameScheduler` 均可独立使用，且不依赖浏览器 API。
`Engine` 与 `FrameScheduler` 支持注入**调度后端**（`FrameSchedulerBackend`），可完全脱离浏览器测试。

## 引擎生命周期

```ts
engine.start();   // 启动（重置累加器与统计），触发 'start'
engine.pause();   // 暂停（保留状态），触发 'pause'
engine.resume();  // 恢复（不重置），触发 'resume'
engine.step(3);   // 暂停态下手动推进 3 步物理更新（单步调试）
engine.stop();    // 停止，触发 'stop'

engine.on('mode-changed', ({ mode, targetFPS }) => { /* ... */ });
```

## 单元测试

```bash
npm test   # 先构建再运行 node:test（注入假调度后端，无需浏览器）
```

测试见 [`tests/`](../tests/)。
