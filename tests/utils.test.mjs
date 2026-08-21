// 工具单元测试：碰撞数学 / 贝塞尔 / 对象工具 / 事件
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  boundsIntersect, circleCollide, circleRectCollide, segmentIntersect, pointInPolygon,
  pointToSegmentDistance, computeBounds,
  linearBezier, quadraticBezier, cubicBezier, createBezierCurve,
  getType, shallowMerge, deepMerge, objectPick, objectOmit, debounce, throttle,
  EventEmitter,
} from '../libs/index.mjs';

test('碰撞数学：包围盒/圆/线段/多边形', () => {
  assert.equal(boundsIntersect(
    { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
    { left: 5, top: 5, right: 15, bottom: 15, width: 10, height: 10 },
  ), true);
  assert.equal(boundsIntersect(
    { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
    { left: 20, top: 20, right: 30, bottom: 30, width: 10, height: 10 },
  ), false);

  assert.equal(circleCollide(0, 0, 1, 1, 0, 1), true);
  assert.equal(circleCollide(0, 0, 1, 5, 0, 1), false);

  assert.equal(circleRectCollide(5, 5, 2, { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }), true);

  assert.equal(segmentIntersect({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }), true);
  assert.equal(segmentIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }), false);

  const tri = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }];
  assert.equal(pointInPolygon({ x: 0.5, y: 0.5 }, tri), true);
  assert.equal(pointInPolygon({ x: 5, y: 5 }, tri), false);

  assert.ok(pointToSegmentDistance({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 2 }) < 1e-9);

  assert.deepEqual(computeBounds([{ x: 5, y: 5 }, { x: 15, y: 20 }], { x: 0, y: 0 }), {
    top: 5, left: 5, right: 15, bottom: 20, width: 10, height: 15,
  });
});

test('贝塞尔曲线：线性/二次/三次', () => {
  assert.deepEqual(linearBezier({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5), { x: 5, y: 5 });
  assert.deepEqual(quadraticBezier({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }, 0.5), { x: 10, y: 5 });
  assert.deepEqual(cubicBezier({ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }, 0.5), { x: 5, y: 7.5 });

  assert.equal(createBezierCurve([{ x: 0, y: 0 }, { x: 10, y: 10 }]).constructor.name, 'LinearBezier');
  assert.equal(createBezierCurve([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }]).constructor.name, 'QuadraticBezier');
  assert.equal(createBezierCurve([{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }]).constructor.name, 'CubicBezier');
});

test('对象工具：类型/合并/选择/过滤', () => {
  assert.equal(getType([]), 'array');
  assert.equal(getType({}), 'object');
  assert.equal(getType(null), 'null');

  assert.deepEqual(shallowMerge({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
  assert.deepEqual(deepMerge({ a: { b: 1 } }, { a: { c: 2 } }), { a: { b: 1, c: 2 } });
  assert.deepEqual(objectPick({ a: 1, b: 2, c: 3 }, ['a', 'c']), { a: 1, c: 3 });
  assert.deepEqual(objectOmit({ a: 1, b: 2, c: 3 }, ['b']), { a: 1, c: 3 });
});

test('防抖/节流', async () => {
  let d = 0;
  const db = debounce(() => { d += 1; }, 20);
  db(); db(); db();
  assert.equal(d, 0);
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(d, 1, '防抖只执行最后一次');

  let t = 0;
  const th = throttle(() => { t += 1; }, 20);
  th(); th(); th();
  assert.equal(t, 1, '节流固定间隔只执行一次');
  await new Promise((r) => setTimeout(r, 40));
  th();
  assert.equal(t, 2, '间隔后节流恢复');
});

test('EventEmitter：on/once/off/emit', () => {
  class Emitter extends EventEmitter {}
  const e = new Emitter();
  let calls = 0;
  const handler = () => { calls += 1; };
  e.on('evt', handler);
  e.emit('evt', undefined);
  e.off('evt', handler);
  e.emit('evt', undefined);
  assert.equal(calls, 1, 'off 后不再触发');

  let once = 0;
  e.once('o', () => { once += 1; });
  e.emit('o', undefined);
  e.emit('o', undefined);
  assert.equal(once, 1, 'once 只触发一次');
});
