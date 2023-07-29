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
  private last = 0;
  private count = 0;
  private limit: number;
  private status: boolean;
  private listener: any = {};

  constructor(limitFPS = 0) {
    this.limit = limitFPS;
    this.status = false;
  }

  private getFps() {
    const listener = this.listener.fps;
    if (!listener) return;
    const time = getTime();
    if (this.last) {
      this.count += 1;
      if ((time - this.last) > 1000) {
        listener(this.count);
        this.last = time;
        this.count = 1;
      }
    } else {
      this.count = 1;
      this.last = time;
    }
  }

  private getRecords() {
    const listener = this.listener.records;
    if (!listener) return;
    const time = getTime();
    if (this.last && this.last !== time) {
      const fps = 1000 / (time - this.last);
      listener(parseFloat(fps.toFixed(1)));
    }
    this.last = time;
  }

  public setLimit(fps: number) {
    if ([Infinity, -Infinity].includes(fps)) throw new Error('fps cannot be Infinity, set it to 0 if you need to remove the restriction');
    if (isNaN(fps)) throw new Error('fps must be a number');
    this.limit = fps;
  }

  public onRecords(listener: (fps: number) => void) {
    this.listener.records = listener;
  }

  public onFps(listener: (fps: number) => void) {
    this.listener.fps = listener;
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
