import { Color } from './color';

type offsetX = number;
type offsetY = number;

export class Shadow {
  // TODO: 颜色
  public color: Color;

  // TODO: 模糊
  public blur: number;

  // TODO: 透明度
  public opacity: number = 1;

  // TODO: 偏移
  public offset: [offsetX, offsetY];

  constructor(color?: Color, blur = 0, opacity = 1, offset: [offsetX, offsetY] = [0, 0]) {
    this.blur = blur;
    this.offset = offset;
    this.opacity = opacity;
    this.color = color || new Color('#000');
  }

  // TODO: 绘画
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = this.blur;
    ctx.globalAlpha = this.opacity;
    ctx.shadowOffsetX = this.offset[0];
    ctx.shadowOffsetY = this.offset[1];
    ctx.shadowColor = this.color.toRgb();
    ctx.restore();
  }
}
