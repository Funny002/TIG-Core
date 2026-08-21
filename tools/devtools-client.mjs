// chrome-devtools-mcp 客户端演示
// 用法：先启动 vite 开发服务器 `npm run dev`，再运行 `npm run devtools:demo`
// 演示内容：打开 scene.html -> 等待页面就绪 -> 读取统计(监控) -> 截图 -> 通过 window.__tig 修改 -> 校验 -> 再截图
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'node:path';

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.env.TARGET_URL || 'http://127.0.0.1:5173/example/scene.html';
const SERVER_BIN = resolve(process.cwd(), 'node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js');

function textOf(result) {
  if (!result || !result.content) return '';
  return result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
}

const transport = new StdioClientTransport({
  command: process.execPath, // node
  args: [
    SERVER_BIN,
    '--headless',
    '--isolated',
    '--no-usage-statistics',
    '--allow-unrestricted-paths',
    '--executablePath', CHROME_PATH,
    '--viewport', '1400x900',
  ],
  cwd: process.cwd(),
  stderr: 'inherit',
});

const client = new Client({ name: 'tig-devtools-demo', version: '1.0.0' });

let failed = false;
try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log(`[devtools] 可用工具 (${tools.length}):`, tools.map((t) => t.name).join(', '));

  // 1. 打开 scene.html
  await client.callTool({ name: 'navigate_page', arguments: { url: TARGET_URL } });
  console.log('[devtools] 已导航:', TARGET_URL);

  // 2. 等待页面模块就绪（window.__tig 出现）
  const ready = textOf(await client.callTool({
    name: 'evaluate_script',
    arguments: {
      function: `async () => {
        for (let i = 0; i < 60; i++) {
          if (window.__tig) return 'ready (loop ' + i + ')';
          await new Promise((r) => setTimeout(r, 250));
        }
        return 'timeout';
      }`,
    },
  }));
  console.log('[就绪]', JSON.stringify(ready));

  // 3. 监控：读取粒子数量与实时统计
  const count0 = textOf(await client.callTool({ name: 'evaluate_script', arguments: { function: '() => window.__tig.count' } }));
  const stats0 = textOf(await client.callTool({ name: 'evaluate_script', arguments: { function: '() => document.getElementById("stats").textContent' } }));
  console.log('[监控] 粒子数 =', JSON.stringify(count0));
  console.log('[监控] 统计 =', JSON.stringify(stats0));

  // 4. 监控：截图（修改前）
  const before = resolve(process.cwd(), 'shot-before.png');
  await client.callTool({ name: 'take_screenshot', arguments: { filePath: before, format: 'png' } });
  console.log('[监控] 截图 ->', before);

  // 5. 修改：通过 window.__tig 操作三栏 UI
  await client.callTool({ name: 'evaluate_script', arguments: { function: '() => { window.__tig.addBalls(20); return window.__tig.count; }' } });
  await client.callTool({ name: 'evaluate_script', arguments: { function: '() => { window.__tig.setFps(120); return "fps=120"; }' } });
  await client.callTool({ name: 'evaluate_script', arguments: { function: '() => { window.__tig.setElastic(false); return "elastic=off"; }' } });
  await client.callTool({ name: 'evaluate_script', arguments: { function: '() => { window.__tig.setSpeed(1.5); return "speed=1.5x"; }' } });
  await client.callTool({ name: 'evaluate_script', arguments: { function: '() => { window.__tig.setTheme("navy"); return "theme=navy"; }' } });
  console.log('[修改] 已添加 20 个粒子、FPS→120、弹性碰撞关闭、速度 1.5x、主题 navy');

  // 6. 校验：读取修改后的粒子数、开关状态与统计
  const count1 = textOf(await client.callTool({ name: 'evaluate_script', arguments: { function: '() => window.__tig.count' } }));
  const elasticState = textOf(await client.callTool({ name: 'evaluate_script', arguments: { function: '() => document.getElementById("elastic").checked' } }));
  const stats1 = textOf(await client.callTool({ name: 'evaluate_script', arguments: { function: '() => document.getElementById("stats").textContent' } }));
  console.log('[校验] 粒子数(修改后) =', JSON.stringify(count1));
  console.log('[校验] 弹性碰撞 checked =', JSON.stringify(elasticState));
  console.log('[校验] 统计(修改后) =', JSON.stringify(stats1));

  // 7. 修改后再截图
  const after = resolve(process.cwd(), 'shot-after.png');
  await client.callTool({ name: 'take_screenshot', arguments: { filePath: after, format: 'png' } });
  console.log('[监控] 截图 ->', after);

  console.log('DEVTOOLS DEMO DONE');
} catch (e) {
  failed = true;
  console.error('[devtools] 失败:', e);
} finally {
  try {
    await client.close();
  } catch (e) {
    console.error('[devtools] close 错误:', e);
  }
}

process.exit(failed ? 1 : 0);
