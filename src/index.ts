// import { Canvas, CanvasOptions, ListenerTypes as CanvasType } from './core/Canvas';
// import { mergeObjects } from './utils/object';
// import { Animation } from './core/Animation';
// import { Shape } from './core/Shape';
//
// interface Options {
//   limitFps?: number;
// }
//
// type ListenerType = 'FPS' | 'RealTimeFPS'
//
// export class Create {
//   private canvas: Canvas;
//   private limitFps: number;
//   private animation: Animation;
//   protected readonly options: CanvasOptions & Options;
//
//   constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions & Options>) {
//     this.options = mergeObjects({ limitFps: 0 }, options || {});
//     this.animation = new Animation(this.options.limitFps);
//     this.canvas = new Canvas(selectors, this.options);
//     this.limitFps = this.animation.limit;
//   }
//
//   public add(graphics: Shape) {
//     this.canvas.add(graphics);
//   }
//
//   public run() {
//     this.animation.run(() => {
//       this.canvas.draw();
//     });
//   }
//
//   public stop() {
//     this.animation.stop();
//   }
//
//   public on(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
//   public on(key: ListenerType, listener: (data: number) => void): void
//   public on(key: string, listener: (data: any) => void) {
//     if (key === 'FPS' || key === 'RealTimeFPS') return this.animation.on(key, listener);
//     if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.on(key as CanvasType, listener);
//     throw new Error('Invalid listener type');
//   }
//
//   public off(key: CanvasType, listener: (data: { graphics?: Shape, event: MouseEvent }) => void): void
//   public off(key: ListenerType, listener: (data: number) => void): void
//   public off(key: string, listener: (data: any) => void) {
//     if (key === 'FPS' || key === 'RealTimeFPS') return this.animation.off(key, listener);
//     if (['click', 'dblclick', 'contextmenu', 'mousemove', 'mousedown', 'mouseup'].includes(key)) return this.canvas.off(key as CanvasType, listener);
//     throw new Error('Invalid listener type');
//   }
// }

export * from './core/Shape';
export * from './core/Animation';
// export * from './lib/Style';
// export * from './lib/Color';
export * from './lib/Graphics';
