export * from './object';
export * from './limit';

// TODO: 帧动画
export const AnimationFrame = (function (win: any) {
  return window['requestAnimationFrame'] ||
    win['webkitRequestAnimationFrame'] ||
    win['mozRequestAnimationFrame'] ||
    win['oRequestAnimationFrame'] ||
    win['msRequestAnimationFrame'] ||
    ((callback: () => void) => win.setTimeout(() => callback(), 1000 / 60));
})(window) as ((func: () => void) => void);

// TODO: 获取时间
export const getTime = () => window.performance?.now() || Date.now();
