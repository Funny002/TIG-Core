// 形状单元测试（纯 Node，无 DOM；draw 用假 ctx 冒烟）
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Circle, Rectangle, Line, Triangle, Polygon, Path } from '../libs/index.mjs';

const ctx = new Proxy({}, { get: () => () => {}, set: (t, k, v) => { t[k] = v; return true; } });

test('Shape 基类：坐标/尺寸访问器与包围盒缓存', () => {
  const c = new Circle({ x: 10, y: 20, width: 30, height: 40 });
  assert.equal(c.type, 'circle');
  assert.deepEqual(c.bounds, { top: 20, left: 10, right: 40, bottom: 60, width: 30, height: 40 });

  c.x = 50;
  assert.equal(c.bounds.left, 50, 'x 变更后包围盒更新');
  assert.equal(c.bounds.right, 80);
  c.width = 60;
  assert.equal(c.bounds.width, 60, 'width 变更后包围盒更新');
  assert.equal(c.centerX, 80, 'centerX = x + width/2');
});

test('Shape 事件：point-changed / size-changed / move', () => {
  const c = new Circle({ x: 0, y: 0, width: 10, height: 10 });
  let point = 0, size = 0, move = 0;
  c.on('point-changed', () => { point += 1; });
  c.on('size-changed', () => { size += 1; });
  c.on('move', () => { move += 1; });

  c.x = 5;
  c.width = 20;
  c.move(1, 1);
  assert.equal(point, 1, 'x setter 触发 point-changed');
  assert.equal(size, 1, 'width setter 触发 size-changed');
  assert.equal(move, 1, 'move 触发 move 事件');
});

test('Line：紧凑包围盒与起止点', () => {
  const l = new Line({ x: 100, y: 100, endPoint: { x: 50, y: 40 } });
  assert.deepEqual(l.bounds, { top: 40, left: 50, right: 100, bottom: 100, width: 50, height: 60 });
  l.endX = 200;
  assert.equal(l.bounds.right, 200, 'endX 变更后包围盒更新');
  l.setPoint({ x: 0, y: 0 }, { x: 10, y: 20 });
  assert.equal(l.endX, 10);
  assert.equal(l.endY, 20);
});

test('Polygon：顶点与紧凑包围盒、中心', () => {
  const p = new Polygon({
    x: 100, y: 100,
    vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }],
  });
  assert.equal(p.bounds.left, 100);
  assert.equal(p.bounds.right, 200);
  assert.equal(p.bounds.bottom, 200);
  assert.equal(p.absolutePoints.length, 3);
  p.vertices = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 25, y: 50 }];
  assert.equal(p.bounds.right, 150, 'vertices 变更后包围盒更新');
});

test('Triangle：宽高可写，重推导顶点', () => {
  const t = new Triangle({ x: 0, y: 0, width: 100, height: 100 });
  assert.equal(t.type, 'triangle');
  assert.equal(t.bounds.width, 100);
  t.width = 200;
  assert.equal(t.bounds.width, 200, 'width 变更后重推导顶点');
});

test('Path：命令与紧凑包围盒', () => {
  const p = new Path({ x: 0, y: 0 });
  p.lineTo({ x: 100, y: 0 });
  p.lineTo({ x: 50, y: 100 });
  assert.equal(p.bounds.right, 100);
  assert.equal(p.bounds.bottom, 100);
  assert.equal(p.commandList.length > 0, true);
});

test('碰撞：圆/矩形/线段', () => {
  const c1 = new Circle({ x: 0, y: 0, width: 20, height: 20 });   // 圆心 10,10 r=10
  const c2 = new Circle({ x: 5, y: 5, width: 20, height: 20 });   // 圆心 15,15 r=10
  assert.equal(c1.collision(c2), true, '圆-圆相交');

  const c3 = new Circle({ x: 80, y: 80, width: 10, height: 10 });
  assert.equal(c1.collision(c3), false, '圆-圆不相交');

  const r = new Rectangle({ x: 0, y: 0, width: 30, height: 30 });
  assert.equal(c1.collision(r), true, '圆-矩形相交');

  const l1 = new Line({ x: 0, y: 0, endPoint: { x: 20, y: 20 } });
  const l2 = new Line({ x: 0, y: 20, endPoint: { x: 20, y: 0 } });
  assert.equal(l1.collision(l2), true, '线段-线段交叉');
});

test('绘制冒烟：各图形 draw 不抛异常', () => {
  const shapes = [
    new Circle({ x: 0, y: 0, width: 20, height: 20 }),
    new Rectangle({ x: 0, y: 0, width: 20, height: 20, rounds: 5 }),
    new Line({ x: 0, y: 0, endPoint: { x: 20, y: 20 } }),
    new Triangle({ x: 0, y: 0, width: 20, height: 20 }),
    new Polygon({ x: 0, y: 0, vertices: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 10, y: 20 }] }),
    new Path({ x: 0, y: 0 }).lineTo({ x: 20, y: 20 }),
  ];
  for (const s of shapes) {
    s.draw(ctx); // 不抛异常即通过
  }
  // 旋转后绘制也应正常
  shapes[1].rotate = 0.5;
  shapes[1].draw(ctx);
  assert.ok(true);
});
