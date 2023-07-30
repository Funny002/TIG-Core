import { Canvas, CanvasOptions, ListenerTypes as CanvasType } from '@core/Canvas';
import { mergeObjects } from '@utils/object';
import { Animation } from '@core/Animation';
import { Shape } from '@core/Shape';

interface Options {
  limitFps?: number;
}

type ListenerType = 'fps' | 'fpsRecords'

export class Create {
  private canvas: Canvas;
  private limitFps: number;
  private animation: Animation;

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
    options = mergeObjects({ limitFps: 0 }, options || {});
    this.animation = new Animation(options.limitFps);
    this.canvas = new Canvas(selectors, options);
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
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.on(<CanvasType>key, listener);
    throw new Error('Invalid listener type');
  }

  public off(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
  public off(key: ListenerType, listener: (data: number) => void): void
  public off(key: string, listener: (data: any) => void) {
    if (key === 'fps' || key === 'fpsRecords') return this.animation.off(key === 'fpsRecords' ? 'records' : key, listener);
    if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.off(<CanvasType>key, listener);
    throw new Error('Invalid listener type');
  }
}

export * from '@core/Shape';
export * from '@lib/Style';
export * from '@lib/Color';
export * from '@lib/Graphics';
