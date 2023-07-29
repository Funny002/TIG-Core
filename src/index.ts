import { Canvas, CanvasOptions } from '@core/Canvas';
import { mergeObjects } from '@utils/object';
import { Animation } from '@lib/Animation';
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


  public on<T = any>(key: ListenerType, listener: (data: T) => void) {
    // this.animation.on(key, listener);
  }

  public off<T = any>(key: ListenerType, listener: (data: T) => void) {
    if (['fps', 'fpsRecords'].includes(key)) {
      key = key === 'fpsRecords' ? 'records' : key;
      this.animation.off(key, listener);
    }
  }
}

export * from '@core/Shape';
export * from '@lib/Style';
export * from '@lib/Color';
export * from '@lib/Graphics';
