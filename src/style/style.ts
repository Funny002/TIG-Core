// // 变形
// export class StyleTransform {
//   public translateX: number = 0;
//   public translateY: number = 0;
//   public scaleX: number = 1;
//   public scaleY: number = 1;
//   public skewX: number = 0;
//   public skewY: number = 0;
//
//   draw(ctx: CanvasRenderingContext2D) {
//     ctx.save();
//     ctx.transform(this.scaleX, this.skewX, this.skewY, this.scaleY, this.translateX, this.translateY);
//     // ctx.translate(this.translateX, this.translateY);
//     // ctx.scale(this.scaleX, this.scaleY);
//     // ctx.rotate(this.skewX);
//     // ctx.rotate(this.skewY);
//     ctx.restore();
//   }
// }
//
// // 贴图
// export class Mapping {
//   protected load = false;
//   public value: HTMLImageElement;
//
//   constructor(image: string | HTMLImageElement) {
//     if (typeof image === 'string') {
//       this.load = false;
//       this.value = new Image();
//       this.value.onload = () => this.load = true;
//       this.value.src = image;
//     } else {
//       this.load = true;
//       this.value = image;
//     }
//   }
// }
//
// export class Style {
//   public stroke?: Stroke;
//   public rotate: number = 0;
//   public opacity: number = 1;
//   public transform?: StyleTransform;
//   public __fill?: Color | Mapping = undefined;
//
//   get fill(): Color | Mapping | undefined {
//     return this.__fill;
//   }
//
//   setFill(fill?: string | Color | HTMLImageElement, type?: 'href' | 'image' | 'color') {
//     if (!fill) return this.__fill = undefined;
//
//     if (typeof fill === 'string') {
//       if (type) {
//         if (['href', 'image'].includes(type)) return this.__fill = new Mapping(fill);
//         return this.__fill = new Color(fill);
//       } else {
//         if (fill.startsWith('data:image') || fill.startsWith('blob:') || fill.startsWith('http')) {
//           return this.__fill = new Mapping(fill);
//         } else {
//           return this.__fill = new Color(fill);
//         }
//       }
//     }
//
//     this.__fill = fill instanceof HTMLImageElement ? new Mapping(fill) : fill;
//   }
//
//   draw(ctx: CanvasRenderingContext2D) {
//     if (this.fill) { // 填充
//       console.log(this.fill);
//     }
//     //   ctx.save();
//     //   ctx.transform(2, 0, 0, 2, 0, 0);
//     //   ctx.restore();
//   }
// }
