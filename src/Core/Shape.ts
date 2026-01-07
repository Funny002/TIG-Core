// TODO: 点
export type Point = { x: number, y: number; };

// TODO: 图形
export type ShapeListener = { graphics: Shape, value?: number }

// TODO: 图形键
type ShapeTypes = 'top' | 'left' | 'update' | 'rotate';
export type ShapeKeys = 'click' | 'contextmenu' | 'dblclick' | 'mousemove' | 'mousedown' | 'mouseup';

// TODO: 图形 - 父级
class ShapeParent {
  // TODO: 目标
  private target: { parent: any, index: number }[] = [];

  // TODO: 添加
  add(parent: any, index: number) {
    this.target.push({ parent, index });
  }

  // TODO: 改变索引
  setIndex(parent: any, index: number) {
    const target = this.target.find(item => item.parent === parent);
    if (target) target.index = index;
  }

  // TODO: 移除
  remove(parent: any) {
    const target = this.target.find(item => item.parent === parent);
    if (target) this.target.splice(this.target.indexOf(target), 1);
  }

  // TODO: 获取
  getAll() {
    return this.target;
  }

  // TODO: 销毁
  destroy() {
    for (const item of this.target) {
      if (item.parent.hasOwnProperty('removeChild')) {
        item.parent['removeChild'](item.index);
      }
    }
  }
}

// TODO: 图形 - 旋转
class ShapeRotate {
  // TODO: 角度
  @Watch<number>(function () {
    this['update']();
  }) angle: number = 0;

  // TODO: 缓冲区
  private buffer: CanvasItem | undefined = undefined;

  // TODO: 图形
  private graphs: CanvasItem | undefined = undefined;

  // TODO: 定时器
  private timeout: NodeJS.Timeout | undefined = undefined;

  // TODO: 大小
  public size: { width: number, height: number } | undefined = undefined;

  constructor(graphs: CanvasItem) {
    this.graphs = graphs;
  }

  // TODO: 获取大小
  private getSize(width: number, height: number) {
    const radian = Math.abs(this.angle) * Math.PI / 180;
    const [sin, cos] = [Math.sin(radian), Math.cos(radian)];
    const newWidth = Math.round(width * cos + height * sin);
    const newHeight = Math.round(width * sin + height * cos);
    return { width: newWidth, height: newHeight };
  }

  // TODO: 更新
  update() {
    if (!this.buffer) return undefined;
    const { width, height } = this.buffer;

    // TODO: 改变画布大小
    const size = this.getSize(width, height);
    this.graphs.height = size.height;
    this.graphs.width = size.width;
    this.size = size;

    // TODO: 旋转画布
    this.graphs.context.save();
    this.graphs.context.translate(size.width / 2, size.height / 2);
    this.graphs.context.rotate(this.angle * Math.PI / 180);
    this.graphs.context.drawImage(this.buffer.canvas, -width / 2, -height / 2);
    this.graphs.context.restore();
  }

  // TODO: 创建
  create(graphs: CanvasItem) {
    this.timeout && clearTimeout(this.timeout);
    const { width, height } = graphs;
    this.graphs = graphs;

    if (this.buffer) {
      this.buffer.width = width;
      this.buffer.height = height;
    } else {
      this.buffer = new CanvasItem(width, height);
    }

    this.buffer.context.drawImage(graphs.canvas, 0, 0);

    this.update();
  }

  // TODO: 销毁
  destroy() {
    if (!this.buffer) return undefined;
    this.size = undefined;
    this.timeout = setTimeout(() => {
      this.buffer?.destroy();
      this.buffer = undefined;
      this.timeout = undefined;
    }, 1000);
  }
}

// TODO: 图形
export abstract class Shape {
  // TODO: 旋转
  private rotate: ShapeRotate;

  // TODO: 可见
  public visible: boolean = true;

  // TODO: 可选
  public selected: boolean = true;

  // TODO: 父级
  public parent: ShapeParent = new ShapeParent();

  // TODO: 位置 - X
  @Watch<number>(function (value) {
    this['listener']?.publish('left', { graphics: this, value });
  }) public left: number = 0;

  // TODO: 位置 - Y
  @Watch<number>(function (value) {
    this['listener']?.publish('top', { graphics: this, value });
  }) public top: number = 0;

  // TODO: 图形
  protected graphs: CanvasItem = new CanvasItem(0, 0);

  // TODO: 监听器
  protected listener: Listener<ShapeListener | MouseEvent> = new Listener();

  constructor() {
    this.rotate = new ShapeRotate(this.graphs);
    Object.defineProperty(this, 'listener', { enumerable: false });
  }

  // TODO: 旋转角度
  get rotateAngle() {
    return this.rotate.angle;
  }

  set rotateAngle(value: number) {
    this.rotate.angle = value % 360;
  }

  // TODO: 画布 - 元素
  get canvas() {
    return this.graphs.canvas;
  }

  // TODO: 画布 - 上下文
  get context() {
    return this.graphs.context;
  }

  // TODO: 位图
  get bitmap() {
    return this.graphs.getBitmap();
  }

  // TODO: 大小
  abstract get size(): { width: number, height: number } ;

  // TODO: 图形边界
  get bounding() {
    const { top, left, size, rotate } = this;
    const { width, height } = rotate.size || size;
    return { top, left, width, height, right: left + width, bottom: top + height };
  }

  // TODO: 通知
  public publish(key: ShapeKeys, event: MouseEvent) {
    this.listener.publish(key, event);
  }

  // TODO: 监听
  public on(key: ShapeTypes | ShapeKeys, listener: (value: any) => void) {
    this.listener.subscribe(key, listener);
  }

  // TODO: 取消监听
  public off(key: ShapeTypes | ShapeKeys, listener: (value: any) => void) {
    this.listener.unsubscribe(key, listener);
  }

  // TODO: 更新旋转画布
  public updateRotate() {
    if (this.rotateAngle !== 0) {
      this.rotate.create(this.graphs);
    } else {
      this.rotate.destroy();
    }
  }

  // TODO: 刷新画布
  public update() {
    const { width, height } = this.size;
    this.graphs.width = width;
    this.graphs.height = height;
    this.draw(this.graphs.context);
    // TODO: 旋转缓冲区
    this.updateRotate();
    this.listener.publish('update', { graphics: this });
  }

  // TODO: 绘画
  abstract draw(content: CanvasRenderingContext2D): void;

  // TODO: 开始绘画
  public startDraw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.left, this.top);
    ctx.drawImage(this.graphs.canvas, 0, 0);
    ctx.restore();
  }

  // TODO: 销毁
  public destroy() {
    this.graphs.destroy();
    this.parent.destroy();
  }

  // TODO: 判断当前点是否在图形内
  public isPointInShape(x: number, y: number): Shape[] {
    if (!this.visible || !this.selected) return [];
    const { top, left, right, bottom } = this.bounding;
    if (x < left || x > right || y < top || y > bottom) return [];
    if (this.bitmap) {
      const pixel = getPixel(this.bitmap, x - left, y - top);
      if (pixel.length === 4) {
        if (pixel[3] !== 0) return [this];
      }
    }
    return [];
  }

  // TODO: 图形碰撞检测
  public crashDetection(shape: Shape): Shape[] {
    return (this.visible && this.selected && bitmapCollide(this, shape)) ? [this] : [];
  }
}

// TODO: 图形 - 组
export class ShapeGroup extends Shape {
  // TODO: 穿透
  public through: boolean = true;

  // 子项
  protected children: Shape[] = [];

  constructor(through = true) {
    super();
    this.through = through;
  }

  // 大小
  get size() {
    let [width, height] = [0, 0];
    for (const child of this.children) {
      width = Math.max(child.bounding.right, width);
      height = Math.max(child.bounding.bottom, height);
    }
    return { width, height };
  }

  // TODO: 更新子项索引
  private updateChildrenIndexes(index: number) {
    const count = this.children.length;
    for (let i = index; i < count; i++) {
      this.children[i].parent.setIndex(this, i);
    }
  }

  // TODO: 添加
  public addChild(shape: Shape, index?: number) {
    index = index ?? this.children.length;
    shape.parent.add(this, index);
    this.updateChildrenIndexes(index);
    shape.on('top', this.update);
    shape.on('left', this.update);
    shape.on('update', this.update);
    shape.on('rotate', this.update);
  }

  // TODO: 删除子项
  public removeChildren(index: number, removeCount = 1): Shape [] {
    const childArr = this.children.splice(index, removeCount);
    if (childArr.length) {
      for (const child of childArr) {
        child.parent.remove(this);
      }
      this.updateChildrenIndexes(index);
    }
    return childArr;
  }

  // TODO: 绘画
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.left, this.top);
    for (const child of this.children) {
      if (child.visible) child.startDraw(ctx);
    }
    ctx.restore();
  }

  // TODO: 判断当前点是否在图形内
  public isPointInShape(x: number, y: number): Shape[] {
    if (!this.visible || !this.selected) return [];
    if (!this.through) return super.isPointInShape(x, y);
    ;[x, y] = [x - this.left, y - this.top];
    return this.children.reduce(function (target: Shape[], child) {
      return child.visible ? target.concat(child.isPointInShape(x, y)) : target;
    }, []);
  }

  // TODO: 图形碰撞检测
  public crashDetection(shape: Shape): Shape[] {
    if (!this.visible || !this.selected) return [];
    if (!this.through) return super.crashDetection(shape);
    return this.children.reduce(function (target: Shape[], child) {
      return child.visible ? target.concat(child.crashDetection(shape)) : target;
    }, []);
  }
}

// TODO: 图形 - 子项
export abstract class ShapeItem extends Shape {
  // TODO: 子项
  protected children: Point[] = [];

  // TODO: 大小
  get size() {
    let width = 0;
    let height = 0;
    for (const child of this.children) {
      width = Math.max(width, child.x);
      height = Math.max(height, child.y);
    }
    return { width, height };
  }

  // TODO: 根据索引添加子项
  public addChild(shape: Point, index?: number) {
    index = index ?? this.children.length;
    this.children.splice(index, 0, shape);
    this.update();
  }

  // TODO: 移除子图形
  public removeChild(index: number): Point | undefined {
    if (index >= 0 && index < this.children.length) {
      return this.children.splice(index, 1)[0];
    }
    return undefined;
  }
}
