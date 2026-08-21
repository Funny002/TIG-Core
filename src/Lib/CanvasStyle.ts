import { EngineLogger } from '../Logger';

/** 画布样式配置接口 */
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

const DEFAULT_CONFIG: CanvasStyleConfig = {
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

/**
 * 画布样式类
 * 封装 CanvasRenderingContext2D 的填充、边框、阴影等样式，并提供统一的应用接口
 */
export class CanvasStyle {
  public static readonly DEFAULT_CONFIG: CanvasStyleConfig = { ...DEFAULT_CONFIG };

  public readonly config: CanvasStyleConfig;

  get opacity(): number {
    return this.config.opacity;
  }

  constructor(config: Partial<CanvasStyleConfig> = {}) {
    this.config = { ...CanvasStyle.DEFAULT_CONFIG, ...config };
    this.validateConfig();
  }

  /** 校验并钳制配置值 */
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

  /** 获取配置副本 */
  getConfig(): CanvasStyleConfig {
    return { ...this.config };
  }

  /** 应用通用样式到上下文（透明度、混合、阴影、线条样式） */
  apply(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.config.opacity;
    ctx.filter = this.config.filter || 'none';
    ctx.globalCompositeOperation = this.config.globalCompositeOperation;

    if (this.config.shadowColor) {
      ctx.shadowColor = this.config.shadowColor;
      ctx.shadowBlur = this.config.shadowBlur;
      ctx.shadowOffsetX = this.config.shadowOffsetX;
      ctx.shadowOffsetY = this.config.shadowOffsetY;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.lineCap = this.config.lineCap;
    ctx.lineJoin = this.config.lineJoin;
    ctx.lineWidth = this.config.lineWidth;
    ctx.miterLimit = this.config.miterLimit;
    ctx.setLineDash(this.config.lineDash);
  }

  /** 执行填充 */
  drawFill(ctx: CanvasRenderingContext2D): void {
    if (!this.config.fillStyle) return;
    ctx.save();
    ctx.globalAlpha = this.config.opacity * this.config.fillOpacity;
    ctx.fillStyle = this.config.fillStyle;
    ctx.fill(this.config.fillRule);
    ctx.restore();
  }

  /** 执行描边 */
  drawStroke(ctx: CanvasRenderingContext2D): void {
    if (!this.config.strokeStyle) return;
    ctx.save();
    ctx.globalAlpha = this.config.opacity * this.config.strokeOpacity;
    ctx.strokeStyle = this.config.strokeStyle;
    ctx.stroke();
    ctx.restore();
  }

  /** 更新样式 */
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

  setShadow(color: string, blur = 10, offsetX = 0, offsetY = 0): void {
    this.config.shadowColor = color;
    this.config.shadowBlur = blur;
    this.config.shadowOffsetX = offsetX;
    this.config.shadowOffsetY = offsetY;
  }

  setLineDash(segments: number[]): void {
    this.config.lineDash = [...segments];
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

  clone(): CanvasStyle {
    return new CanvasStyle({ ...this.config });
  }
}
