# TIG-Core API 参考

## Core

### Engine（固定时间步长引擎）

继承 `EventEmitter<EngineEvents>`，组合 `FrameScheduler` + `FixedAccumulator` + `StatsCollector`。

**构造**

```ts
new Engine(config?: Partial<EngineConfig>, backend?: FrameSchedulerBackend)
```

`EngineConfig`：`{ timestep, maxUpdates, alphaClamp, mode, targetFPS, enableStats }`。

**方法**

| 方法 | 说明 |
|---|---|
| `start()` / `stop()` | 启动（重置累加器/统计）/ 停止（保留状态） |
| `pause()` / `resume()` | 暂停 / 恢复（不重置状态） |
| `step(n = 1)` | 暂停态下手动推进 n 步物理更新 |
| `setCallbacks({ onUpdate, onRender, onPostRender })` | 设置回调 |
| `setMode(mode, targetFPS?)` | 切换 `fixed` / `unlimited` 与目标帧率 |
| `setTargetFPS(fps)` / `setMaxUpdates(n)` | 运行时调整配置 |
| `setTimestep(ms)` / `setTimeScale(s)` | 时间步长 / 时间缩放 |
| `getStats()` / `getDetailedStats()` / `getConfig()` | 统计 / 详细统计 / 配置副本 |
| `isRunning()` / `isPaused()` / `getMode()` / `getTimeScale()` | 状态查询 |
| `destroy()` | 停止并释放 |

**事件**：`start` / `stop` / `pause` / `resume` / `mode-changed`。

### FrameScheduler（帧循环调度）

```ts
new FrameScheduler(onFrame, mode?, targetFPS?, backend?)
```

`backend` 实现 `FrameSchedulerBackend`（`now / requestFrame / cancelFrame / setDelay / clearDelay`），
默认 `browserSchedulerBackend`。注入假后端即可脱离浏览器测试。

### FixedAccumulator（固定步长累加，纯逻辑）

```ts
new FixedAccumulator(timestep, maxUpdates?, alphaClamp?)
acc.advance(deltaTime, now, update) // → 返回执行步数
acc.alpha / acc.value / acc.reset() / acc.setTimestep(ms) / acc.setMaxUpdates(n)
```

### StatsCollector（统计，纯逻辑）

```ts
new StatsCollector(historySize?, fpsInterval?)
sc.reset(now)
sc.record(deltaTime, now, frameTime, physicsTime, renderTime, updatesPerFrame)
sc.snapshot() // → MeasuredStats
```

### Scene（场景编排）

```ts
new Scene({ canvas, engine?, quadtree?, onUpdate?, onRender?, onCollide? })
scene.add(shape) / remove(shape) / has(shape) / clear()
scene.start() / stop() / destroy()
scene.count / shapeList / collisionCount
scene.engine / collisionSystem / renderer
```

- `onUpdate(timestep, scene)`：物理更新（固定步长）。
- `onRender(alpha, scene)`：渲染（绘制图形之前）。
- `onCollide(a, b, scene)`：每对碰撞触发一次。

### CollisionSystem（空间索引 + 碰撞）

```ts
new CollisionSystem(quadtreeOptions?)
cs.setBounds(size, point?)
cs.rebuild(shapes)
cs.detect(shapes, onCollide?) // → 碰撞对数
```

### SceneRenderer（渲染）

```ts
new SceneRenderer(canvas)
renderer.draw(shapes) // 按 zIndex 排序绘制
```

### Canvas（画布封装）

```ts
new Canvas({ width, height, ratio?, selectors? })
canvas.width / height / ratio
canvas.clear() / draw(fn) / getBitmap() / destroy()
canvas.on('mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'contextmenu' | 'resize' | 'clear', cb)
```

### QuadTree（四叉树空间索引）

```ts
new QuadTree({ size, point?, minSize?, maxDepth?, splitChildren? })
qt.insert(shape) / remove(shape) / update(shape) / clear()
qt.query(shape, out?) // → 边界相交候选（可复用 out 数组）
qt.retrieve(shape, out?) / qt.collide(shape) / qt.getAllShapes()
```

## Shape

基类 `Shape extends EventEmitter<ShapeEvents>`，公共属性：`x / y / width / height / visible / zIndex / rotate / type / node`，访问器：`bounds / centerX / centerY / center / size`，方法：`move() / getState() / draw(ctx) / collision(other)`。

| 类 | 说明 |
|---|---|
| `Circle` | 圆形（椭圆），`radiusX / radiusY / radius` |
| `Rectangle` | 矩形，`rounds` 圆角 |
| `Line` | 线段，`start / end / endX / endY / setPoint / setStartPoint / setEndPoint` |
| `Triangle` | 三角形（继承 Polygon，宽高可写） |
| `Polygon` | 多边形，`vertices / absolutePoints` |
| `Path` | 路径（SVG 命令），`moveTo / lineTo / bezierCurveTo / quadraticCurveTo / closePath / clear` |

构造示例：

```ts
new Shape.Circle({ x, y, width, height, visible?, style? })
new Shape.Rectangle({ x, y, width, height, rounds?, visible?, style? })
new Shape.Line({ x, y, endPoint, visible?, style? })
new Shape.Triangle({ x, y, width, height, visible?, style? })
new Shape.Polygon({ x, y, vertices, visible?, style? })
new Shape.Path({ x, y, visible?, style? })
```

`style` 为 `Partial<CanvasStyleConfig>`（见下）。

## Lib

### CanvasStyle

```ts
const style = new CanvasStyle({ fillStyle, strokeStyle, lineWidth, lineDash, shadowColor, shadowBlur, opacity, fillOpacity, strokeOpacity, ... })
style.apply(ctx) / drawFill(ctx) / drawStroke(ctx)
style.setFill(c) / setStroke(c) / setShadow(...) / setLineDash([...]) / update({...}) / clone()
```

### EventEmitter / Listener

```ts
class Foo extends EventEmitter<{ 'x': number }> {}
const f = new Foo();
f.on('x', (n) => {}) / f.once / f.off / f.emit('x', 1) / f.clear()
```

### Collides（碰撞数学函数）

`boundsIntersect` / `circleCollide` / `circleRectCollide` / `segmentIntersect` / `pointInPolygon` / `pointToSegmentDistance` / `computeBounds`

## Utils

`linearBezier` / `quadraticBezier` / `cubicBezier` / `createBezierCurve` / `LinearBezier` / `QuadraticBezier` / `CubicBezier`、`Logger` / `LoggerLevel`、`debounce` / `throttle` / `getType` / `shallowMerge` / `deepMerge` / `objectPick` / `objectOmit`。
