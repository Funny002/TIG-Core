import { Stroke } from './Stroke';
import { Shadow } from './Shadow';
import { Color } from './Color';

export class Mapping {
  protected load = false;
  public value: HTMLImageElement;

  constructor(image: string | HTMLImageElement) {
    if (typeof image === 'string') {
      this.load = false;
      this.value = new Image();
      this.value.onload = () => this.load = true;
      this.value.src = image;
    } else {
      this.load = true;
      this.value = image;
    }
  }
}

// TODO: 变形
export class Transform {
  public translateX: number = 0;
  public translateY: number = 0;
  public scaleX: number = 1;
  public scaleY: number = 1;
  public skewX: number = 0;
  public skewY: number = 0;

  draw(ctx: CanvasRenderingContext2D) {
    // ctx.save();
    // ctx.transform(this.scaleX, this.skewX, this.skewY, this.scaleY, this.translateX, this.translateY);
    // // ctx.translate(this.translateX, this.translateY);
    // // ctx.scale(this.scaleX, this.scaleY);
    // // ctx.rotate(this.skewX);
    // // ctx.rotate(this.skewY);
    // ctx.restore();
  }
}

export class Style {
  // TODO: 线条 - 描边
  stroke?: Stroke = undefined;

  // TODO: 阴影
  shadow?: Shadow = undefined;

  // TODO: 变形
  transform?: Transform = undefined;


  constructor() {
    Object.defineProperty(this, 'fill', { enumerable: false });
  }

  // TODO: 填充
  protected _fill?: Color | Mapping = undefined;

  get fill(): Color | Mapping | undefined {
    return this._fill;
  }
  
  // TODO: 填充
  setFill(fill?: string | Color | HTMLImageElement, type?: 'href' | 'image' | 'color') {
    if (!fill) {
      this._fill = undefined;
    } else if (typeof fill === 'string') {
      if (type) {
        this._fill = ['href', 'image'].includes(type) ? new Mapping(fill) : new Color(fill);
      } else {
        this._fill = fill.startsWith('data:image') || fill.startsWith('blob:') || fill.startsWith('http') ? new Mapping(fill) : new Color(fill);
      }
    } else {
      this._fill = fill instanceof HTMLImageElement ? new Mapping(fill) : fill;
    }
  }
}
