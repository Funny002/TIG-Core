import { EngineLogger } from '../Logger';
import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import { boundsIntersect, computeBounds } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';

/** 路径选项接口 */
export interface PathOptions {
  x: number;                         // 起始坐标
  y: number;                         // 起始坐标
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

/**
 * 路径形状（SVG 风格命令）
 * 支持 moveTo / lineTo / bezierCurveTo / quadraticCurveTo / closePath
 * @extends Shape
 */
export class Path extends Shape {
  public readonly type = 'path';
  private commands: (string | number)[] = [];
  public readonly style: CanvasStyle;

  /** 紧凑包围盒（由路径点计算） */
  protected computeBounds(): Bounding {
    return computeBounds(this.getAllPoints(), this.point);
  }

  /** 尺寸由路径命令决定（只读） */
  get size(): Size {
    const bounds = this.bounds;
    return { width: bounds.width, height: bounds.height };
  }

  /** 中心点 X（紧凑包围盒中心） */
  get centerX(): number {
    return this.bounds.left + this.bounds.width / 2;
  }

  /** 中心点 Y（紧凑包围盒中心） */
  get centerY(): number {
    return this.bounds.top + this.bounds.height / 2;
  }

  /** 宽度为只读，由路径命令决定 */
  set width(_: number) {
    EngineLogger.warn('Path width 是只读属性，由路径命令决定');
  }

  /** 高度为只读，由路径命令决定 */
  set height(_: number) {
    EngineLogger.warn('Path height 是只读属性，由路径命令决定');
  }

  /** 获取路径命令副本 */
  get commandList(): (string | number)[] {
    return [...this.commands];
  }

  constructor(config: Partial<PathOptions> = {}) {
    super({ x: config.x ?? 0, y: config.y ?? 0 });
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style ?? {});
    // 初始 moveTo 到起点
    this.commands = ['M', this.x, this.y];
  }

  /** 移动画笔到指定点 */
  moveTo(point: Point): this {
    this.commands.push('M', point.x, point.y);
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
    return this;
  }

  /** 画直线到指定点 */
  lineTo(point: Point): this {
    this.commands.push('L', point.x, point.y);
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
    return this;
  }

  /** 画三次贝塞尔曲线 */
  bezierCurveTo(cp1: Point, cp2: Point, point: Point): this {
    this.commands.push('C', cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y);
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
    return this;
  }

  /** 画二次贝塞尔曲线 */
  quadraticCurveTo(cp: Point, point: Point): this {
    this.commands.push('Q', cp.x, cp.y, point.x, point.y);
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
    return this;
  }

  /** 闭合路径 */
  closePath(): this {
    this.commands.push('Z');
    return this;
  }

  /** 清空路径并回到起点 */
  clear(): this {
    this.commands = ['M', this.x, this.y];
    this.invalidateBounds();
    this.emit('size-changed', { width: 0, height: 0 });
    return this;
  }

  /** 获取路径上的所有点（含贝塞尔控制点），用于计算包围盒 */
  private getAllPoints(): Point[] {
    const points: Point[] = [];
    const commands = this.commands;

    for (let i = 0; i < commands.length; i += 1) {
      const cmd = commands[i];

      if (cmd === 'M' || cmd === 'L') {
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
      } else if (cmd === 'C') {
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
      } else if (cmd === 'Q') {
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
        points.push({ x: commands[++i] as number, y: commands[++i] as number });
      }
      // 'Z' 不产生新点
    }

    return points;
  }

  protected paint(ctx: CanvasRenderingContext2D): void {
    const commands = this.commands;
    if (commands.length < 3) return;

    ctx.beginPath();
    for (let i = 0; i < commands.length; i += 1) {
      const cmd = commands[i];

      if (cmd === 'M') {
        ctx.moveTo(commands[++i] as number, commands[++i] as number);
      } else if (cmd === 'L') {
        ctx.lineTo(commands[++i] as number, commands[++i] as number);
      } else if (cmd === 'C') {
        ctx.bezierCurveTo(
          commands[++i] as number, commands[++i] as number,
          commands[++i] as number, commands[++i] as number,
          commands[++i] as number, commands[++i] as number,
        );
      } else if (cmd === 'Q') {
        ctx.quadraticCurveTo(
          commands[++i] as number, commands[++i] as number,
          commands[++i] as number, commands[++i] as number,
        );
      } else if (cmd === 'Z') {
        ctx.closePath();
      }
    }

    this.style.apply(ctx);
    this.style.drawFill(ctx);
    this.style.drawStroke(ctx);
  }

  collision(other: Shape): boolean {
    // 路径与其他形状的碰撞退化为包围盒检测
    return boundsIntersect(this.bounds, other.bounds);
  }

  getState(): Record<string, any> {
    return {
      name: 'Path',
      ...super.getState(),
      commands: this.commandList,
      commandCount: this.commands.length,
      style: this.style.getConfig(),
    };
  }
}
