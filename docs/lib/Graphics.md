# 其他图形

> 下面的图形都是基于 `ShapeItem` 抽象类的，所以它们都有 `shape` 属性，可以用来设置图形的形状。
> 可能会重构 push 或一些方法

## Line 线段

```typescript
interface Line {
  // 点，线宽
  new(startPoint: Point, width = 1): void;

  push(point: Point): void; // 添加下一个子项

  width: number; // 线段宽度
}
```

## Rect 矩形

```typescript
interface Rect {
  // 点，宽度，高度
  new(point: Point, width: number, height: number): void;

  // 点，宽度，高度
  push(point: Point, width?: number, height?: number): void;

  height: number; // 矩形高度

  width: number; // 矩形宽度
}
```
