// 四叉树 + 碰撞系统单元测试（纯 Node，用结构性假形状）
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QuadTree, CollisionSystem } from '../libs/index.mjs';

function mkShape(x, y, w, h) {
  return {
    get bounds() { return { left: x, top: y, right: x + w, bottom: y + h, width: w, height: h }; },
    collision() { return true; },
    getState() { return {}; },
  };
}

test('QuadTree：插入 / 查询 / 移除', () => {
  const qt = new QuadTree({ point: { x: 0, y: 0 }, size: { width: 100, height: 100 }, splitChildren: 4, minSize: 10, maxDepth: 5 });
  const shapes = [];
  for (let i = 0; i < 30; i += 1) {
    const s = mkShape((i * 7) % 90, (i * 5) % 90, 5, 5);
    shapes.push(s);
    qt.insert(s);
  }
  assert.equal(qt.getAllShapes().length, 30, '插入 30 个');

  for (let i = 0; i < 15; i += 1) qt.remove(shapes[i]);
  assert.equal(qt.getAllShapes().length, 15, '移除 15 个');

  // 精确查询：目标 (5,5,15,15) 只命中两个重叠形状
  const s1 = mkShape(5, 5, 5, 5);
  const s2 = mkShape(10, 10, 5, 5);
  const s3 = mkShape(80, 80, 5, 5);
  const q = new QuadTree({ point: { x: 0, y: 0 }, size: { width: 100, height: 100 }, splitChildren: 4, minSize: 10, maxDepth: 5 });
  [s1, s2, s3].forEach((s) => q.insert(s));
  const out = [];
  q.query(mkShape(5, 5, 15, 15), out);
  assert.equal(out.length, 2, '查询命中 2 个');
});

test('QuadTree：out 复用与清空', () => {
  const qt = new QuadTree({ point: { x: 0, y: 0 }, size: { width: 100, height: 100 }, splitChildren: 4, minSize: 10, maxDepth: 5 });
  const s1 = mkShape(5, 5, 5, 5);
  const s2 = mkShape(10, 10, 5, 5);
  qt.insert(s1);
  qt.insert(s2);

  const out = [];
  qt.query(mkShape(5, 5, 15, 15), out);
  assert.equal(out.length, 2);
  qt.query(mkShape(90, 90, 5, 5), out); // 复用 out，应清空并返回 0
  assert.equal(out.length, 0, '复用 out 清空后返回 0');

  qt.clear();
  assert.equal(qt.getAllShapes().length, 0, 'clear 清空');
});

test('CollisionSystem：重建 / 检测去重 / 边界更新', () => {
  const cs = new CollisionSystem({ point: { x: 0, y: 0 }, size: { width: 100, height: 100 }, splitChildren: 4, minSize: 10, maxDepth: 5 });
  const a = mkShape(0, 0, 20, 20);
  const b = mkShape(5, 5, 20, 20);
  const c = mkShape(80, 80, 10, 10);

  cs.rebuild([a, b, c]);
  let hits = 0;
  const count = cs.detect([a, b, c], () => { hits += 1; });
  assert.equal(count, 1, '检测到 1 对碰撞');
  assert.equal(hits, 1, '去重后回调只触发 1 次');

  cs.setBounds({ width: 200, height: 200 });
  cs.rebuild([a, b, c]);
  assert.equal(cs.detect([a, b, c], () => {}), 1, '边界更新后仍正确');
});
