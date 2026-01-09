import type { Point, Size } from '../Core';
import { EngineLogger } from '../Logger';
import { objectPick } from '../Utils';
import { Shape } from '../Core';

export interface CircleConfig {
  k: number;                                                // 圆角控制参数
  stroke?: string | CanvasGradient | CanvasPattern;         // 边框颜色/渐变/图案
  lineWidth: number;                                        // 边框宽度
  lineDash: number[];                                       // 虚线样式
  lineCap: CanvasLineCap;                                   // 线条端点样式
  lineJoin: CanvasLineJoin;                                 // 线条连接样式
  miterLimit: number;                                       // 斜接面限制
  background?: string | CanvasGradient | CanvasPattern;     // 背景（向后兼容）
  fillStyle?: string | CanvasGradient | CanvasPattern;      // 填充颜色（优先使用）
  fillRule?: CanvasFillRule;                                // 填充规则
  shadowColor?: string;                                     // 阴影颜色
  shadowBlur: number;                                       // 阴影模糊程度
  shadowOffsetX: number;                                    // 阴影水平偏移
  shadowOffsetY: number;                                    // 阴影垂直偏移
  opacity: number;                                          // 整体透明度 (0-1)
  fillOpacity: number;                                      // 填充透明度 (0-1)
  strokeOpacity: number;                                    // 边框透明度 (0-1)
  globalCompositeOperation: GlobalCompositeOperation;       // 混合模式
  gradient?: CanvasGradient;                                // 渐变填充
  pattern?: CanvasPattern;                                  // 图案填充
  filter?: string;                                          // CSS 滤镜（如 blur(2px), brightness(1.2) 等）
  antiAlias: boolean;                                       // 是否开启抗锯齿
  visible: boolean;                                         // 是否可见
}

export interface CircleOptions extends CircleConfig {
  x: number;         // 起始坐标
  y: number;         // 起始坐标
  width: number;     // 宽度
  height: number;    // 高度
}

export class Circle extends Shape {
  readonly size: Size;
  private readonly config: CircleConfig;

  get k() {
    return this.config.k;
  }

  get centerX() {
    return this.x + this.size.width / 2;
  }

  get centerY() {
    return this.y + this.size.height / 2;
  }

  get center(): Point {
    return { x: this.centerX, y: this.centerY };
  }

  get stroke() {
    return this.config.stroke;
  }

  get fillStyle() {
    return this.config.fillStyle ?? this.config.background;
  }

  get opacity() {
    return this.config.opacity;
  }

  get visible() {
    return this.config.visible;
  }

  set k(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      EngineLogger.warn(`Circle k 值必须在 0-1 之间，当前值: ${value}`);
    } else if (value !== this.config.k) {
      this.config.k = value;
    }
  }

  set stroke(value: string | CanvasGradient | CanvasPattern | undefined) {
    this.config.stroke = value;
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern | undefined) {
    this.config.fillStyle = value;
  }

  set opacity(value: number) {
    if (value < 0 || value > 1) {
      EngineLogger.warn(`opacity 必须在 0-1 之间，当前值: ${value}`);
    } else if (value !== this.config.opacity) {
      this.config.opacity = value;
    }
  }

  set visible(value: boolean) {
    this.config.visible = value;
  }

  constructor(config: Partial<CircleOptions>) {
    super({ x: config.x || 0, y: config.y || 0 });
    this.size = { width: config.width || 0, height: config.height || 0 };

    const defaultConfig: CircleConfig = {
      k: 0.5522847498,

      // 边框样式
      lineWidth: 1,
      lineDash: [],
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,

      // 填充样式
      fillStyle: '#000000',
      fillRule: 'nonzero',

      // 阴影效果
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,

      // 透明度与混合模式
      opacity: 1,
      fillOpacity: 1,
      strokeOpacity: 1,
      globalCompositeOperation: 'source-over',

      // 其他
      visible: true,
      antiAlias: true,
    };

    const picked = objectPick(config, [
      'k', 'stroke', 'background', 'fillStyle', 'fillRule', 'lineWidth', 'lineDash',
      'lineCap', 'lineJoin', 'miterLimit', 'shadowColor', 'shadowBlur',
      'shadowOffsetX', 'shadowOffsetY', 'opacity', 'fillOpacity', 'strokeOpacity',
      'globalCompositeOperation', 'gradient', 'pattern', 'filter', 'antiAlias', 'visible',
    ]);

    this.config = { ...defaultConfig, ...picked };

    // 处理向后兼容：background -> fillStyle
    if (config.background && !config.fillStyle && !this.config.gradient && !this.config.pattern) {
      this.config.fillStyle = config.background;
    }

    // 验证关键数值
    this.validateConfig();
  }

  /**
   * 验证配置值的有效性
   */
  private validateConfig(): void {
    const { opacity, fillOpacity, strokeOpacity, lineWidth } = this.config;

    if (opacity < 0 || opacity > 1) {
      EngineLogger.warn(`opacity ${opacity} 已被钳制到 0-1 范围`);
      this.config.opacity = Math.max(0, Math.min(1, opacity));
    }

    if (fillOpacity < 0 || fillOpacity > 1) {
      EngineLogger.warn(`fillOpacity ${fillOpacity} 已被钳制到 0-1 范围`);
      this.config.fillOpacity = Math.max(0, Math.min(1, fillOpacity));
    }

    if (strokeOpacity < 0 || strokeOpacity > 1) {
      EngineLogger.warn(`strokeOpacity ${strokeOpacity} 已被钳制到 0-1 范围`);
      this.config.strokeOpacity = Math.max(0, Math.min(1, strokeOpacity));
    }

    if (lineWidth < 0) {
      EngineLogger.warn(`lineWidth 不能为负数，当前值: ${lineWidth}`);
      this.config.lineWidth = 0;
    }
  }

  collision(shape: Shape): boolean {
    console.log('collision', shape);
    // // 简单的圆形碰撞检测
    // if (other instanceof Circle) {
    //   const dx = this.centerX - other.centerX;
    //   const dy = this.centerY - other.centerY;
    //   const distance = Math.sqrt(dx * dx + dy * dy);
    //   const radius1 = Math.min(this.size.width, this.size.height) / 2;
    //   const radius2 = Math.min(other.size.width, other.size.height) / 2;
    //   return distance < radius1 + radius2;
    // }
    // // 可以扩展其他形状的碰撞检测
    // console.warn('碰撞检测仅支持 Circle 之间');
    return false;
  }

  /**
   * 应用所有样式到 Canvas 上下文
   */
  private applyStyles(ctx: CanvasRenderingContext2D): void {
    // 1. 抗锯齿
    if (this.config.antiAlias) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    // 2. 混合模式
    if (this.config.globalCompositeOperation !== 'source-over') {
      ctx.globalCompositeOperation = this.config.globalCompositeOperation;
    }

    // 3. 滤镜
    if (this.config.filter) {
      ctx.filter = this.config.filter;
    }

    // 4. 阴影（仅在有阴影颜色时启用）
    if (this.config.shadowColor) {
      ctx.shadowColor = this.config.shadowColor;
      ctx.shadowBlur = this.config.shadowBlur;
      ctx.shadowOffsetX = this.config.shadowOffsetX;
      ctx.shadowOffsetY = this.config.shadowOffsetY;
    } else {
      // 明确禁用阴影，避免继承
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 5. 线条样式（仅在描边时设置）
    if (this.config.lineWidth > 0 && this.config.stroke) {
      ctx.lineWidth = this.config.lineWidth;
      ctx.lineCap = this.config.lineCap;
      ctx.lineJoin = this.config.lineJoin;
      ctx.miterLimit = this.config.miterLimit;

      if (this.config.lineDash.length) {
        ctx.setLineDash(this.config.lineDash);
      }
    }

    // 6. 全局透明度
    if (this.config.opacity !== 1) {
      ctx.globalAlpha = this.config.opacity;
    }
  }

  /**
   * 获取填充样式（优先级：gradient > pattern > fillStyle > background）
   */
  private getFillStyle(): string | CanvasGradient | CanvasPattern | undefined {
    if (this.config.gradient) return this.config.gradient;
    if (this.config.pattern) return this.config.pattern;
    if (this.config.fillStyle) return this.config.fillStyle;
    return this.config.background;
  }

  /**
   * 获取描边样式
   */
  private getStrokeStyle(): string | CanvasGradient | CanvasPattern | undefined {
    return this.config.stroke;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.config.visible) return;

    // 保存状态
    ctx.save();

    try {
      // 应用所有样式
      this.applyStyles(ctx);

      // 绘制路径
      const { centerY, centerX, k } = this;
      const radiusX = this.size.width / 2;
      const radiusY = this.size.height / 2;

      ctx.beginPath();
      ctx.moveTo(centerX + radiusX, centerY);

      const points = [
        [centerX + radiusX, centerY - radiusY * k, centerX + radiusX * k, centerY - radiusY, centerX, centerY - radiusY],
        [centerX - radiusX * k, centerY - radiusY, centerX - radiusX, centerY - radiusY * k, centerX - radiusX, centerY],
        [centerX - radiusX, centerY + radiusY * k, centerX - radiusX * k, centerY + radiusY, centerX, centerY + radiusY],
        [centerX + radiusX * k, centerY + radiusY, centerX + radiusX, centerY + radiusY * k, centerX + radiusX, centerY],
      ];

      for (const [cp1x, cp1y, cp2x, cp2y, endX, endY] of points) {
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      }

      ctx.closePath();

      // 填充（带独立透明度）
      const fillStyle = this.getFillStyle();
      if (fillStyle) {
        const originalAlpha = ctx.globalAlpha;

        // 应用填充透明度
        if (this.config.fillOpacity !== 1) {
          ctx.globalAlpha = originalAlpha * this.config.fillOpacity;
        }

        ctx.fillStyle = fillStyle;

        // 使用指定的填充规则
        ctx.fill(this.config.fillRule || 'nonzero');

        // 恢复透明度
        if (this.config.fillOpacity !== 1) {
          ctx.globalAlpha = originalAlpha;
        }
      }

      // 描边（带独立透明度）
      const strokeStyle = this.getStrokeStyle();
      if (this.config.lineWidth > 0 && strokeStyle) {
        const originalAlpha = ctx.globalAlpha;

        // 应用描边透明度
        if (this.config.strokeOpacity !== 1) {
          ctx.globalAlpha = originalAlpha * this.config.strokeOpacity;
        }

        ctx.strokeStyle = strokeStyle;
        ctx.stroke();

        // 恢复透明度
        if (this.config.strokeOpacity !== 1) {
          ctx.globalAlpha = originalAlpha;
        }

        // 清除虚线设置
        if (this.config.lineDash.length) {
          ctx.setLineDash([]);
        }
      }

    } finally {
      // 确保总是恢复状态
      ctx.restore();
    }
  }

  /**
   * 创建当前圆的精确副本
   */
  clone(): Circle {
    return new Circle({
      x: this.x,
      y: this.y,
      ...this.config,
      width: this.size.width,
      height: this.size.height,
    });
  }

  /**
   * 批量更新样式配置
   */
  updateStyles(styles: Partial<CircleConfig>): void {
    const updates = objectPick(styles, [
      'k', 'stroke', 'background', 'fillStyle', 'fillRule', 'lineWidth', 'lineDash',
      'lineCap', 'lineJoin', 'miterLimit', 'shadowColor', 'shadowBlur',
      'shadowOffsetX', 'shadowOffsetY', 'opacity', 'fillOpacity', 'strokeOpacity',
      'globalCompositeOperation', 'gradient', 'pattern', 'filter', 'antiAlias', 'visible',
    ]);

    Object.assign(this.config, updates);
    this.validateConfig();
  }

  /**
   * 获取当前配置的深拷贝
   */
  getStyles(): CircleConfig {
    return { ...this.config };
  }

  /**
   * 快速设置阴影（便捷方法）
   */
  setShadow(color: string, blur: number = 10, offsetX: number = 0, offsetY: number = 0): void {
    this.config.shadowColor = color;
    this.config.shadowBlur = blur;
    this.config.shadowOffsetX = offsetX;
    this.config.shadowOffsetY = offsetY;
  }

  /**
   * 清除所有阴影设置
   */
  clearShadow(): void {
    this.config.shadowColor = undefined;
    this.config.shadowBlur = 0;
    this.config.shadowOffsetX = 0;
    this.config.shadowOffsetY = 0;
  }

  /**
   * 设置渐变填充
   */
  setGradient(gradient: CanvasGradient): void {
    this.config.gradient = gradient;
    // 清除其他填充方式
    this.config.pattern = undefined;
  }

  /**
   * 设置图案填充
   */
  setPattern(pattern: CanvasPattern): void {
    this.config.pattern = pattern;
    // 清除其他填充方式
    this.config.gradient = undefined;
  }

  /**
   * 重置所有透明度为 1
   */
  resetOpacity(): void {
    this.config.opacity = 1;
    this.config.fillOpacity = 1;
    this.config.strokeOpacity = 1;
  }

  /**
   * 设置整体透明度（同时设置 fill 和 stroke）
   */
  setOpacity(value: number): void {
    if (value < 0 || value > 1) {
      EngineLogger.warn(`opacity 必须在 0-1 之间，当前值: ${value}`);
      return;
    }
    this.config.opacity = value;
    this.config.fillOpacity = value;
    this.config.strokeOpacity = value;
  }

  getState(): Record<string, any> {
    return {
      name: 'Circle',
      ...super.getState(),
      config: { ...this.config },
    };
  }

  /**
   * 销毁方法（清理资源）
   */
  destroy(): void {
    // 清理图案引用（如果需要）
    this.config.pattern = undefined;
    this.config.gradient = undefined;
    EngineLogger.debug(`Circle destroyed at (${this.x}, ${this.y})`);
  }
}
