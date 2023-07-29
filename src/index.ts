import { Canvas, CanvasOptions } from '@core/Canvas';
import { Animation } from '@core/Animation';
import { Shape } from '@core/Shape';
import { mergeObjects } from '@utils/object';

export * from '@core/Shape';
export * from '@core/Style';
export * from '@core/Color';
export * from '@lib/Graphics';

interface Options {
  limitFps?: number;
}

export class Create {
  private canvas: Canvas;
  private animation: Animation;

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
    options = mergeObjects({ limitFps: 0 }, options || {});
    this.animation = new Animation(options.limitFps);
    this.canvas = new Canvas(selectors, options);
  }

  add(graphics: Shape) {
    this.canvas.add(graphics);
  }

  onFps(listener: (fps: number) => void) {
    this.animation.onFps(listener);
  }

  run() {
    this.animation.run(() => {
      this.canvas.draw();
    });
  }

  stop() {
    this.animation.stop();
  }
}
