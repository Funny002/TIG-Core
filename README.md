# TIG-Core

> TypeScript In Game is TIG acronym
>
> TIG-Core Library for the [TIG](https://github.com/Funny002/TIG) project.
>

## [更新记录](./UPDATE.md)

## 快速开始

```bash
npm install
npm run dev          # 启动开发服务器，打开 example/index.html
npm run build        # 类型检查 + 生成 types/ 声明 + 打包 libs/
npm test             # 运行单元测试（node:test，注入假调度后端，无需浏览器）
```

示例页面（`npm run dev` 打开 `example/index.html`）：

- `example/index.html` — Playground 演练场（图形绘制 + 固定时间步长动画，可切换 Circle / Rectangle / Line / Triangle）
- `example/shapes.html` — 图形展示（六种内置图形 + 样式：填充/描边/虚线/阴影/圆角/旋转）
- `example/bezier.html` — 贝塞尔曲线（线性/二次/三次，可拖拽控制点）
- `example/benchmark.html` — 性能基准（粒子数量可调 + 四叉树碰撞开关 + 5s 基准报告）
- `example/scene.html` — Scene 综合示例（三栏 UI：功能 / 画布 / 日志，四叉树碰撞、FPS 限帧与折线图、速度/大小调节、弹性碰撞开关、点击选中可编辑属性）

所有示例共用 `example/common.css` 的深色主题与顶栏导航。

## 文档与测试

- 使用指南：[`docs/guide.md`](./docs/guide.md)（核心概念、快速上手、架构、生命周期）
- API 参考：[`docs/api.md`](./docs/api.md)（Engine / Scene / Shape / Canvas / QuadTree 等）
- 单元测试：`npm test`（`tests/` 下，注入假调度后端，无需浏览器）

## chrome-devtools-mcp 浏览器监控

项目已内置 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)（MCP 服务器），可监控 Chrome 浏览器、截图、读取/修改页面内容、分析性能等。

### 方式一：接入你自己的 MCP 客户端

项目根目录提供了 [`.mcp.json`](./.mcp.json)，把它配置到你的 MCP 客户端（Claude / Cursor / Copilot 等）即可：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless", "--no-usage-statistics"]
    }
  }
}
```

### 方式二：命令行直接启动 MCP 服务器

```bash
npm run devtools:mcp
# 服务以 stdio 协议运行，headless 自动拉起 Chrome（需本机已安装 Chrome）
```

### 方式三：一键演示「监控 + 修改页面」

```bash
npm run dev            # 终端 1：启动 vite 开发服务器（http://127.0.0.1:5173）
npm run devtools:demo  # 终端 2：打开 scene.html -> 读统计 -> 截图 -> 通过 window.__tig 修改 -> 校验 -> 再截图
```

`devtools:demo` 默认目标为 `http://127.0.0.1:5173/example/scene.html`，通过页面暴露的 `window.__tig` 钩子操作三栏 UI（添加粒子、切换 FPS、弹性碰撞、速度、背景主题等），并生成 `shot-before.png` / `shot-after.png`（已加入 `.gitignore`）。

常用环境变量：`CHROME_PATH`（Chrome 可执行文件路径）、`TARGET_URL`（目标页面地址）。

`npm run serve` 提供通用的静态文件服务器（`tools/serve.mjs`），可按需用于预览构建产物。

### 代码结构

- `src/Core/` — `Engine`（固定时间步长引擎，提供生命周期事件/暂停恢复/单步调试）＋ `FrameScheduler`（帧循环调度，可注入后端脱离浏览器测试）＋ `FixedAccumulator`（固定步长累加，纯逻辑）＋ `StatsCollector`（统计，纯逻辑）＋ `Scene`（组合 `CollisionSystem` 空间索引碰撞 + `SceneRenderer` 渲染 + 引擎）＋ `Canvas` / `Shape` / `QuadTree`
- `src/Shape/` — `Circle` / `Rectangle` / `Line` / `Polygon` / `Triangle` / `Path`
- `src/Lib/` — `CanvasStyle` / `EventEmitter` / 碰撞数学
- `src/Utils/` — `Logger` / 贝塞尔 / 对象工具
- `tools/` — `serve.mjs`（静态服务器）、`devtools-client.mjs`（MCP 客户端演示）
