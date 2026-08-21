// Scene 集成单元测试（需要最小 DOM / rAF shim 以实例化 Canvas）
function makeCtx() { return new Proxy({}, { get: () => () => {}, set: (t, k, v) => { t[k] = v; return true; } }); }
function makeCanvasEl() {
  return {
    style: {}, _w: 0, _h: 0,
    getContext: () => makeCtx(), addEventListener: () => {}, removeEventListener: () => {},
    set width(v) { this._w = v; }, get width() { return this._w; },
    set height(v) { this._h = v; }, get height() { return this._h; },
  };
}
globalThis.document = { createElement: () => makeCanvasEl(), querySelector: () => makeCanvasEl() };
globalThis.HTMLCanvasElement = class {};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now() + 16.67), 16.67);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Canvas, Scene, Shape } from '../libs/index.mjs';
const { Circle } = Shape;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('Scene：图形管理（add/remove/clear/has/count）', () => {
  const canvas = new Canvas({ width: 100, height: 100 });
  const scene = new Scene({ canvas });
  const a = new Circle({ x: 0, y: 0, width: 10, height: 10 });
  const b = new Circle({ x: 20, y: 20, width: 10, height: 10 });

  scene.add(a).add(b);
  assert.equal(scene.count, 2);
  assert.equal(scene.has(a), true);
  assert.equal(scene.shapeList.length, 2);

  scene.remove(b);
  assert.equal(scene.count, 1);
  assert.equal(scene.has(b), false);

  scene.clear();
  assert.equal(scene.count, 0);
});

test('Scene：碰撞检测（去重，每步仅报告一次）', async () => {
  const canvas = new Canvas({ width: 100, height: 100 });
  let collide = 0;
  const scene = new Scene({ canvas, engine: { mode: 'fixed' }, onCollide: () => { collide += 1; } });
  scene.add(new Circle({ x: 0, y: 0, width: 20, height: 20 }));
  scene.add(new Circle({ x: 5, y: 5, width: 20, height: 20 }));
  scene.add(new Circle({ x: 80, y: 80, width: 10, height: 10 }));

  scene.start();
  await sleep(300);
  scene.stop();

  assert.equal(scene.collisionCount, 1, '每步碰撞对数 = 1');
  assert.ok(collide > 0, 'onCollide 被调用');
  assert.equal(scene.count, 3);
});

test('Scene：暴露引擎/渲染器/碰撞系统，destroy 释放', () => {
  const canvas = new Canvas({ width: 100, height: 100 });
  const scene = new Scene({ canvas });
  assert.ok(scene.engine, '暴露 engine');
  assert.ok(scene.renderer, '暴露 renderer');
  assert.ok(scene.collisionSystem, '暴露 collisionSystem');
  scene.destroy();
  assert.equal(scene.engine.isRunning(), false);
});
