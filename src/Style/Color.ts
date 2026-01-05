import type { ColorInstance } from 'color';
import ColorPlugin from 'color';

// TODO: 颜色
export class Color {
  // TODO: 颜色插件
  private color: ColorInstance;

  constructor(value: string | number | object) {
    this.color = new ColorPlugin(value);
  }

  // TODO: 颜色
  toHex(): string {
    return this.color.hex();
  }

  // TODO: 颜色
  toRgb(): string {
    return this.color.rgb().string();
  }

  // TODO: 颜色
  toRgba(): string {
    return this.color.rgb().alpha(this.color.alpha()).string();
  }

  // TODO: 颜色
  toHsl(): string {
    return this.color.hsl().string();
  }

  // TODO: 颜色
  toHsla(): string {
    return this.color.hsl().alpha(this.color.alpha()).string();
  }
}
