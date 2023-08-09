import { Canvas, CanvasOptions, ListenerTypes } from './core/Canvas';
import { mergeObjects } from './utils/object';
import { Animation } from './core/Animation';
import { Watch } from './lib/Decorators';
import { Shape } from './core/Shape';

interface Options {
  limitFps: number;
}

export class Create {
  private canvas: Canvas;
  private animation: Animation;
  private readonly options: Partial<CanvasOptions & Options>;

  @Watch<number, Create>(function (value) {
    if (this['animation']) this['animation'].limit = value;
  }) limit: number;

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
    this.options = mergeObjects({ timout: 0, width: 340, height: 300, capacity: 4, limitFps: 0, maxTreeNode: 10 }, options);
    this.animation = new Animation(this.options.limitFps);
    this.limit = this.options.limitFps || 0;
    this.handleCanvas(selectors);
  }

  private handleCanvas(selectors: string | HTMLCanvasElement) {
    if (typeof selectors === 'string') {
      const target = document.querySelector(selectors);
      if (target.nodeName !== 'CANVAS') {
        throw new Error('Invalid canvas element');
      }
      selectors = <HTMLCanvasElement>target;
    }
    this.canvas = new Canvas(selectors, this.options);
  }

  // TODO: 画布运行
  public run() {
    this.animation.run(() => this.canvas.draw());
  }

  // TODO: 画布暂停
  public stop() {
    this.animation.stop();
  }

  // TODO: 添加子项
  public insert(shape: Shape) {
    this.canvas.graphics.insert(shape);
  }

  // TODO: 图形检测 - 获取全部匹配的图形
  public isPointInShape(x: number, y: number) {
    return this.canvas.graphics.isPointInShape(x, y);
  }

  // TODO: 图形检测 - 获取碰撞的图形
  public crashDetection(shape: Shape) {
    return this.canvas.graphics.crashDetection(shape);
  }

  // TODO: 绑定事件
  public on(key: ListenerTypes, listener: (data: { graphics?: Shape[], event: MouseEvent }) => void): void
  public on(key: 'FPS' | 'RealTimeFPS', listener: (data: number) => void): void
  public on(key: string, listener: (data: any) => void) {
    if (['FPS', 'RealTimeFPS'].includes(key)) return this.animation.on(<'FPS' | 'RealTimeFPS'>key, listener);
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.on(<ListenerTypes>key, listener);
    throw new Error('Invalid listener type');
  }

  // TODO: 解绑事件
  public off(key: ListenerTypes, listener: (data: { graphics?: Shape[], event: MouseEvent }) => void): void
  public off(key: 'FPS' | 'RealTimeFPS', listener: (data: number) => void): void
  public off(key: string, listener: (data: any) => void) {
    if (['FPS', 'RealTimeFPS'].includes(key)) return this.animation.off(<'FPS' | 'RealTimeFPS'>key, listener);
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.off(<ListenerTypes>key, listener);
    throw new Error('Invalid listener type');
  }
}

export * from './core/Shape';
export * from './core/Canvas';
export * from './core/Quadtree';
export * from './core/Animation';
//
export * from './lib/Style';
export * from './lib/Color';
export * from './lib/Graphics';
