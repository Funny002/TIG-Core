import { Canvas, CanvasOptions, ListenerTypes as CanvasType } from './core/Canvas';
import { LooseOctree } from './core/LooseOctree';
import { mergeObjects } from './utils/object';
import { Animation } from './core/Animation';
import { Listener } from './lib/Listener';
import { Shape } from './core/Shape';

interface Options {
  limitFps?: number;
}

type ListenerType = 'fps' | 'fpsRecords'

export class Create {
  private canvas: Canvas;
  private limitFps: number;
  private animation: Animation;
  protected readonly options: CanvasOptions & Options;

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
    this.options = mergeObjects({ limitFps: 0 }, options || {});
    this.animation = new Animation(this.options.limitFps);
    this.canvas = new Canvas(selectors, this.options);
    this.limitFps = this.animation.limit;
  }

  public add(graphics: Shape) {
    this.canvas.add(graphics);
  }

  public run() {
    this.animation.run(() => {
      this.canvas.draw();
    });
  }

  public stop() {
    this.animation.stop();
  }

  public on(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
  public on(key: ListenerType, listener: (data: number) => void): void
  public on(key: string, listener: (data: any) => void) {
    if (key === 'fps' || key === 'fpsRecords') return this.animation.on(key === 'fpsRecords' ? 'records' : key, listener);
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.on(key as CanvasType, listener);
    throw new Error('Invalid listener type');
  }

  public off(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
  public off(key: ListenerType, listener: (data: number) => void): void
  public off(key: string, listener: (data: any) => void) {
    if (key === 'fps' || key === 'fpsRecords') return this.animation.off(key === 'fpsRecords' ? 'records' : key, listener);
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.off(key as CanvasType, listener);
    throw new Error('Invalid listener type');
  }
}

export class CreateCollision extends Create {
  private looseOctree: LooseOctree;
  private listener: Listener = new Listener();

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
    super(selectors, options);
    const { width, height } = this.options;
    this.looseOctree = new LooseOctree(0, 0, width, height);
  }

  public add(graphics: Shape) {
    super.add(graphics);
    graphics.on('left', () => this.handleShapeUpdate(graphics));
    graphics.on('top', () => this.handleShapeUpdate(graphics));
    graphics.on('size', () => this.handleShapeUpdate(graphics));
  }

  private handleShapeUpdate(graphics: Shape) {
    this.looseOctree.updateShapePosition(graphics, graphics);
    this.detectCollisions(graphics);
  }

  private detectCollisions(shape: Shape) {
    const collides = this.looseOctree.collisionDetection(shape);
    if (collides) {
      const collidingShapes: Shape[] = [];
      this.looseOctree.detectCollisionsRecursive(this.looseOctree.root, shape, collidingShapes);
      this.listener.publish('collision', { graphics: shape, collidingShapes });
    }
  }

  public on(key: 'collision', listener: (data: { graphics: Shape; collidingShapes: Shape[] }) => void): void
  public on(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
  public on(key: ListenerType, listener: (data: number) => void): void
  public on(key: string, listener: (data: any) => void) {
    if (key === 'collision') return this.listener.subscribe(key, listener);
    super.on(key as any, listener);
  }

  public off(key: 'collision', listener: (data: { graphics: Shape; collidingShapes: Shape[] }) => void): void
  public off(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
  public off(key: ListenerType, listener: (data: number) => void): void
  public off(key: string, listener: (data: any) => void) {
    if (key === 'collision') return this.listener.unsubscribe(key, listener);
    super.on(key as any, listener);
  }
}

export * from './core/Shape';
export * from './lib/Style';
export * from './lib/Color';
export * from './lib/Graphics';
