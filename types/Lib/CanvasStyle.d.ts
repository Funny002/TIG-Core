/** 画布样式配置接口 */
export interface CanvasStyleConfig {
    strokeStyle?: string | CanvasGradient | CanvasPattern;
    fillStyle?: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineDash: number[];
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    miterLimit: number;
    fillRule?: CanvasFillRule;
    shadowColor?: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    opacity: number;
    fillOpacity: number;
    strokeOpacity: number;
    globalCompositeOperation: GlobalCompositeOperation;
    filter?: string;
}
/**
 * 画布样式类
 * 封装 CanvasRenderingContext2D 的填充、边框、阴影等样式，并提供统一的应用接口
 */
export declare class CanvasStyle {
    static readonly DEFAULT_CONFIG: CanvasStyleConfig;
    readonly config: CanvasStyleConfig;
    get opacity(): number;
    constructor(config?: Partial<CanvasStyleConfig>);
    /** 校验并钳制配置值 */
    private validateConfig;
    /** 获取配置副本 */
    getConfig(): CanvasStyleConfig;
    /** 应用通用样式到上下文（透明度、混合、阴影、线条样式） */
    apply(ctx: CanvasRenderingContext2D): void;
    /** 执行填充 */
    drawFill(ctx: CanvasRenderingContext2D): void;
    /** 执行描边 */
    drawStroke(ctx: CanvasRenderingContext2D): void;
    /** 更新样式 */
    update(styles: Partial<CanvasStyleConfig>): void;
    setFill(style: string | CanvasGradient | CanvasPattern): void;
    setStroke(style: string | CanvasGradient | CanvasPattern): void;
    setShadow(color: string, blur?: number, offsetX?: number, offsetY?: number): void;
    setLineDash(segments: number[]): void;
    clearShadow(): void;
    resetOpacity(): void;
    clone(): CanvasStyle;
}
