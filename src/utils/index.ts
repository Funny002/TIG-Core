import { Watch } from '../lib/Decorators';

export * from './object';
export * from './limit';

// TODO: 帧动画
export const AnimationFrame = (function (win: any) {
  return window['requestAnimationFrame'] ||
    win['webkitRequestAnimationFrame'] ||
    win['mozRequestAnimationFrame'] ||
    win['oRequestAnimationFrame'] ||
    win['msRequestAnimationFrame'] ||
    ((callback: () => void) => win.setTimeout(() => callback(), 1000 / 60));
})(window) as ((func: () => void) => void);

// TODO: 获取时间
export const getTime = () => window.performance?.now() || Date.now();

// TODO: 图形画布
export class GraphsCanvas {
  // TODO: 宽度
  @Watch<number>(function () {
    this['handlerCanvas']();
  }) public width: number;

  // TODO: 高度
  @Watch<number>(function () {
    this['handlerCanvas']();
  }) public height: number;

  // TODO: 画布
  public readonly canvas: HTMLCanvasElement;

  // TODO: 画布上下文
  public readonly context: CanvasRenderingContext2D;

  constructor(width: number, height: number, canvas?: HTMLCanvasElement) {
    this.width = width;
    this.height = height;
    this.canvas = canvas || document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.handlerCanvas();
  }

  // TODO: 像素比
  get ratio() {
    return (window.devicePixelRatio || 1) / (function (context: CanvasRenderingContext2D) {
      if (!context) return 1;
      return context['backingStorePixelRatio'] ||
        context['webkitBackingStorePixelRatio'] ||
        context['mozBackingStorePixelRatio'] ||
        context['msBackingStorePixelRatio'] ||
        context['oBackingStorePixelRatio'] ||
        context['backingStorePixelRatio'] || 1;
    })(this.context);
  }

  // TODO: 位图
  get bitmap() {
    try {
      return this.context?.getImageData(0, 0, this.width, this.height);
    } catch (e) {
      return null;
    }
  }

  // TODO: 处理画布
  private handlerCanvas() {
    if (!this.canvas) return;
    const { width, height, ratio } = this;
    this.canvas.height = height * ratio;
    this.canvas.width = width * ratio;
    this.context.scale(ratio, ratio);
  }

  // TODO: 清除画布
  public clear() {
    this.context?.clearRect(0, 0, this.width, this.height);
  }

  public remove() {
    this.canvas?.remove();
  }
}
