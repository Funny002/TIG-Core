import { EngineLogger } from '../Logger';

export interface CanvasStyleConfig {
  strokeStyle?: string | CanvasGradient | CanvasPattern;    // 边框 颜色/渐变/图案
  fillStyle?: string | CanvasGradient | CanvasPattern;      // 填充 颜色/渐变/图案
  lineWidth: number;                                        // 边框宽度
  lineDash: number[];                                       // 虚线样式
  lineCap: CanvasLineCap;                                   // 线条端点样式
  lineJoin: CanvasLineJoin;                                 // 线条连接样式
  miterLimit: number;                                       // 斜接面限制
  fillRule?: CanvasFillRule;                                // 填充规则
  shadowColor?: string;                                     // 阴影颜色
  shadowBlur: number;                                       // 阴影模糊程度
  shadowOffsetX: number;                                    // 阴影水平偏移
  shadowOffsetY: number;                                    // 阴影垂直偏移
  opacity: number;                                          // 整体透明度 (0-1)
  fillOpacity: number;                                      // 填充透明度 (0-1)
  strokeOpacity: number;                                    // 边框透明度 (0-1)
  globalCompositeOperation: GlobalCompositeOperation;       // 混合模式
  filter?: string;                                          // CSS 滤镜（如 blur(2px), brightness(1.2) 等）
}

export class CanvasStyle {
  public static readonly DEFAULT_CONFIG: CanvasStyleConfig = {
    lineWidth: 1,
    lineDash: [],
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    fillStyle: '#000000',
    fillRule: undefined,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    opacity: 1,
    fillOpacity: 1,
    strokeOpacity: 1,
    globalCompositeOperation: 'source-over',
  };

  public readonly config: CanvasStyleConfig;

  get opacity() {
    return this.config.opacity;
  }

  constructor(config: Partial<CanvasStyleConfig>) {
    this.config = { ...CanvasStyle.DEFAULT_CONFIG, ...config };
    this.validateConfig();
  }

  private validateConfig(): void {
    const { opacity, fillOpacity, strokeOpacity, lineWidth } = this.config;

    const clamp = (value: number, name: string): number => {
      if (value < 0 || value > 1) {
        EngineLogger.warn(`${name} ${value} 已被钳制到 0-1 范围`);
        return Math.max(0, Math.min(1, value));
      }
      return value;
    };

    this.config.opacity = clamp(opacity, 'opacity');
    this.config.fillOpacity = clamp(fillOpacity, 'fillOpacity');
    this.config.strokeOpacity = clamp(strokeOpacity, 'strokeOpacity');

    if (lineWidth < 0) {
      EngineLogger.warn(`lineWidth 不能为负数，当前值: ${lineWidth}`);
      this.config.lineWidth = 0;
    }
  }

  getConfig(): CanvasStyleConfig {
    return { ...this.config };
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.config.opacity;
    ctx.filter = this.config.filter || '';
    ctx.globalCompositeOperation = this.config.globalCompositeOperation;

    if (this.config.shadowColor) {
      ctx.shadowColor = this.config.shadowColor;
      ctx.shadowBlur = this.config.shadowBlur;
      ctx.shadowOffsetX = this.config.shadowOffsetX;
      ctx.shadowOffsetY = this.config.shadowOffsetY;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = 'transparent';
    }

    if (this.config.lineWidth) {
      ctx.lineCap = this.config.lineCap;
      ctx.lineJoin = this.config.lineJoin;
      ctx.lineWidth = this.config.lineWidth;
      ctx.miterLimit = this.config.miterLimit;
      // 虚线
      ctx.setLineDash(this.config.lineDash);
    } else {
      ctx.lineWidth = 0;
    }
  }

  drawFill(ctx: CanvasRenderingContext2D) {
    if (this.config.fillStyle) {
      ctx.save();
      ctx.globalAlpha = this.config.opacity * this.config.fillOpacity;
      ctx.fillStyle = this.config.fillStyle;
      ctx.fill(this.config.fillRule);
      ctx.restore();
    }
  }

  drawStroke(ctx: CanvasRenderingContext2D) {
    if (this.config.strokeStyle) {
      ctx.save();
      ctx.globalAlpha = this.config.opacity * this.config.strokeOpacity;
      ctx.strokeStyle = this.config.strokeStyle;
      ctx.stroke();
      ctx.restore();
    }
  }

  update(styles: Partial<CanvasStyleConfig>): void {
    Object.assign(this.config, styles);
    this.validateConfig();
  }

  setFill(style: string | CanvasGradient | CanvasPattern): void {
    this.config.fillStyle = style;
  }

  setStroke(style: string | CanvasGradient | CanvasPattern): void {
    this.config.strokeStyle = style;
  }

  setShadow(color: string, blur: number = 10, offsetX: number = 0, offsetY: number = 0): void {
    this.config.shadowColor = color;
    this.config.shadowBlur = blur;
    this.config.shadowOffsetX = offsetX;
    this.config.shadowOffsetY = offsetY;
  }

  setLineDash(segments: number[]): void {
    this.config.lineDash = [...segments];
  }

  clone(): CanvasStyle {
    return new CanvasStyle({ ...this.config });
  }

  clearShadow(): void {
    this.config.shadowColor = undefined;
    this.config.shadowBlur = 0;
    this.config.shadowOffsetX = 0;
    this.config.shadowOffsetY = 0;
  }

  resetOpacity(): void {
    this.config.opacity = 1;
    this.config.fillOpacity = 1;
    this.config.strokeOpacity = 1;
  }
}
