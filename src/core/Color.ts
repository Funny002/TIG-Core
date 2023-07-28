import * as ColorPlugin from 'color';

export class Color {
  private color: ColorPlugin;

  constructor(value: string | number | object) {
    this.color = new ColorPlugin(value);
  }

  toHex(): string {
    return this.color.hex();
  }

  toRgb(): string {
    return this.color.rgb().string();
  }

  toRgba(): string {
    return this.color.rgb().alpha(this.color.alpha()).string();
  }

  toHsl(): string {
    return this.color.hsl().string();
  }

  toHsla(): string {
    return this.color.hsl().alpha(this.color.alpha()).string();
  }
}
