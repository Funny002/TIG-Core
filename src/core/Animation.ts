import { Listener } from '../lib/Listener';
import { Watch } from '../lib/Decorators';

const AnimationFrame = (function (win: any) {
  return window['requestAnimationFrame'] ||
    win['webkitRequestAnimationFrame'] ||
    win['mozRequestAnimationFrame'] ||
    win['oRequestAnimationFrame'] ||
    win['msRequestAnimationFrame'] ||
    ((callback: () => void) => win.setTimeout(() => callback()));
})(window) as ((func: () => void) => void);

const getTime = () => window.performance?.now() || Date.now();

export class Animation {
  private count = 0;
  private status: boolean;
  private last = { fps: 0, records: 0 };
  private listener: Listener<number> = new Listener();
  //
  @Watch<number>(function (value, lest) {
    try {
      if (isNaN(value)) throw new Error('FPS must be a number');
      if ([Infinity, -Infinity].includes(value)) throw new Error('FPS cannot be Infinity, set it to 0 if you need to remove the restriction');
    } catch (e) {
      this['limit'] = lest;
      throw new Error(e.message);
    }
  }) public limit: number = 0;

  constructor(limitFPS = 0) {
    this.limit = limitFPS;
    this.status = false;
  }

  private getFps() {
    const time = getTime();
    if (this.last.fps) {
      this.count += 1;
      if ((time - this.last.fps) > 1000) {
        this.listener.publish('FPS', this.count);
        this.last.fps = time;
        this.count = 1;
      }
    } else {
      this.count = 1;
      this.last.fps = time;
    }
  }

  private getRecords() {
    const time = getTime();
    if (this.last && this.last.records !== time) {
      const fps = 1000 / (time - this.last.records);
      this.listener.publish('RealTimeFPS', parseFloat(fps.toFixed(1)));
    }
    this.last.records = time;
  }

  public on(key: 'FPS' | 'RealTimeFPS', listener: (fps: number) => void) {
    if (!['FPS', 'RealTimeFPS'].includes(key)) throw new Error('Invalid listener type');
    this.listener.subscribe(key, listener);
  }

  public off(key: 'FPS' | 'RealTimeFPS', listener: (fps: number) => void) {
    if (!['FPS', 'RealTimeFPS'].includes(key)) throw new Error('Invalid listener type');
    this.listener.unsubscribe(key, listener);
  }

  public run(listener: () => void) {
    this.status = true;
    let last = getTime();
    const newListener = () => {
      if (!this.status) return;
      this.getFps();
      this.getRecords();
      if (this.limit) {
        AnimationFrame(newListener);
        const interval = 1000 / this.limit;
        setTimeout(() => listener(), interval - (getTime() - last) % interval);
      } else {
        listener();
        AnimationFrame(newListener);
      }
    };
    AnimationFrame(newListener);
  }

  // stop animation in next frame to avoid the current frame being rendered
  public stop() {
    this.status = false;
  }
}
