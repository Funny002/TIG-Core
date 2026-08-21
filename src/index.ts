import * as Core from './Core';
import * as Utils from './Utils';
import * as Shape from './Shape';

// 命名空间导出（便于 `import { Core, Shape, Utils }` 使用）
export { Core, Utils, Shape };

// 扁平导出（便于按需引入与 tree-shaking）
export * from './Core';
export * from './Shape';
export * from './Utils';
export * from './Lib';
export * from './Logger';

export default {
  Core,
  Utils,
  Shape,
};
