import { EngineLogger } from '../Logger';
import { EventEmitter } from '../Lib';

export interface CanvasOptions {
  width: number;
  ratio: number;
  height: number;
  selectors?: string | HTMLCanvasElement;
}

export class Canvas extends EventEmitter {
  private readonly config: CanvasOptions;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  //
  private __cacheBitmap: ImageData | null = null;

  get width() {
    return this.config.width;
  }

  get height() {
    return this.config.height;
  }

  get ratio() {
    return this.config.ratio;
  }

  private handlerValue(key: 'width' | 'height' | 'ratio', value: number) {
    const state = Number.isFinite(value) && this[key] !== value && value > 0;
    if (!state) EngineLogger.warn(`${key} 不是有效值 (必须是大于0的有限数字)`);
    return state;
  }

  set width(value: number) {
    if (!this.handlerValue('width', value)) return;
    this.config.width = value;
    this.handlerCanvas();
  }

  set height(value: number) {
    if (!this.handlerValue('height', value)) return;
    this.config.height = value;
    this.handlerCanvas();
  }

  set ratio(value: number) {
    if (!this.handlerValue('ratio', value)) return;
    this.config.ratio = value;
    this.handlerCanvas();
  }

  constructor(config: Partial<CanvasOptions> = {}) {
    super();
    this.canvas = this.resolveCanvasElement(config.selectors);
    this.config = Object.assign({ width: 0, height: 0, ratio: 1 }, config) as CanvasOptions;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      const msg = 'Canvas 2D 不支持';
      EngineLogger.error(msg);
      throw new Error(msg);
    }
    this.context = ctx;
    //
    this.bindEvents();
    this.handlerCanvas();
  }

  private resolveCanvasElement(selectors?: string | HTMLCanvasElement) {
    if (!selectors) return document.createElement('canvas');
    if (selectors instanceof HTMLCanvasElement) return selectors;
    if (typeof selectors === 'string') {
      const dom = document.querySelector(selectors);
      if (dom instanceof HTMLCanvasElement) return dom;
      const msg = `未找到 canvas 元素: ${selectors}`;
      EngineLogger.error(msg);
      throw new Error(msg);
    }
    //
    const msg = 'selectors 必须是 CSS 选择器字符串或 HTMLCanvasElement';
    EngineLogger.error(msg);
    throw new Error(msg);
  }

  private bindEvents() {
    const onMouseDown = (e: MouseEvent) => {
      let last: MouseEvent & { moveX?: number, moveY?: number } | undefined = undefined;
      this.emit('mousedown', e);
      const { clientX, clientY } = e;
      const onMouseMove = (e: MouseEvent) => {
        last = e;
        last.moveX = e.clientX - clientX;
        last.moveY = e.clientY - clientY;
        this.emit('mousemove', last);
      };
      //
      const onMouseUp = () => {
        this.emit('mouseup', last);
        this.canvas.removeEventListener('mouseup', onMouseUp);
        this.canvas.removeEventListener('mousemove', onMouseMove);
      };
      this.canvas.addEventListener('mouseup', onMouseUp);
      this.canvas.addEventListener('mousemove', onMouseMove);
    };
    this.canvas.addEventListener('mousedown', onMouseDown);
    //
    this.canvas.addEventListener('click', (...args) => this.emit('click', ...args));
    this.canvas.addEventListener('dblclick', (...args) => this.emit('dblclick', ...args));
    this.canvas.addEventListener('contextmenu', (...args) => this.emit('contextmenu', ...args));
  }

  private handlerCanvas() {
    this.__cacheBitmap = null;
    //
    this.canvas.width = this.width * this.ratio;
    this.canvas.height = this.height * this.ratio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    //
    this.emit('resize', { width: this.width, height: this.height, ratio: this.ratio });
  }

  getBitmap() {
    try {
      if (this.__cacheBitmap) return this.__cacheBitmap;
      this.__cacheBitmap = this.context.getImageData(0, 0, this.width * this.ratio, this.height * this.ratio);
      return this.__cacheBitmap;
    } catch (e) {
      EngineLogger.error(e);
      return null;
    }
  }

  clear() {
    this.__cacheBitmap = null;
    this.context.clearRect(0, 0, this.width * this.ratio, this.height * this.ratio);
    this.emit('clear');
  }

  destroy() {
    this.clear();
    super.clear();
  }
}
