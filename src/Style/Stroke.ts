import { Watch } from '../Lib';
import { Color } from './Color';

// TODO: 描边
export class Stroke {
  // TODO: 宽度
  public width: number = 1;

  // TODO: 虚线
  public dash: number[] = [];

  // TODO: 透明度
  public opacity: number = 1;

  // TODO: 虚线偏移 - autoAnime 生效时，数值自动变化
  public dashOffset: number = 0;

  // TODO: 是否在执行动画
  private animeTimer: any = null;

  // TODO: 斜接限制 - join = miter 生效
  public miterLimit: number = 10;

  // TODO: 虚线动画 - 虚线时生效，0: 不动画，N: N*10/ms 移动一次
  @Watch<number>(function (value) {
    this['animeTimer'] && clearInterval(this['animeTimer']);
    if (value > 0 && this['dash'].length) {
      this['animeTimer'] = setInterval(() => {
        this['dashOffset'] += 1;
        if (this['dash'][0] < this['dashOffset']) {
          this['dashOffset'] = 0;
        }
      }, value * 10);
    }
  }) public autoAnime: number = 0;

  // TODO: 颜色
  public color: Color = new Color('#000');

  // TODO: 线帽
  public cap: 'butt' | 'round' | 'square' = 'butt';

  // TODO: 线连接
  public join: 'bevel' | 'round' | 'miter' = 'miter';

  constructor(width: number, dash: number[], opacity: number, color: Color, cap: 'butt' | 'round' | 'square' = 'butt', join: 'bevel' | 'round' | 'miter' = 'miter') {
    this.cap = cap;
    this.join = join;
    this.dash = dash;
    this.width = width;
    this.color = color;
    this.opacity = opacity;
    Object.defineProperty(this, 'animeTimer', { enumerable: false });
  }

  // TODO: 绘画
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineCap = this.cap;
    ctx.lineJoin = this.join;
    ctx.setLineDash(this.dash);
    ctx.lineWidth = this.width;
    ctx.globalAlpha = this.opacity;
    ctx.miterLimit = this.miterLimit;
    ctx.strokeStyle = this.color.toRgb();
    if (this.dash.length) {
      ctx.lineDashOffset = this.dashOffset;
    }
    ctx.stroke();
    ctx.restore();
  }

  // TODO: 转换为实线
  public ToSolid() {
    this.dash = [];
    this.autoAnime = 0;
    this.dashOffset = 0;
  }

  // TODO: 转换为虚线
  public ToDashed(dash = [2], autoAnime = 0) {
    this.dash = dash;
    this.autoAnime = autoAnime;
  }
}

// TODO: 虚线
export class DashedStroke extends Stroke {
  // TODO: 线宽，虚线，虚线动画
  constructor(width = 1, dash: number[] = [2], autoAnime = 0) {
    super(width, dash, 1, new Color('#000'));
    this.autoAnime = autoAnime;
  }
}

// TODO: 实线
export class SolidStroke extends Stroke {
  // TODO: 线宽
  constructor(width = 1) {
    super(width, [], 1, new Color('#000'));
    this.autoAnime = 0;
    this.dashOffset = 0;
  }
}
