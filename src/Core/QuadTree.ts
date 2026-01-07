// import { Shape } from './Shape';
// export class QuadTree {
//
// }

//
// /**
//  * 四叉树数据结构，用于空间分割和碰撞检测
//  */
// export class QuadTree {
//   // 根节点存储的形状数组
//   protected root: Shape[] = [];
//   // 是否已分裂为子节点
//   private divided: boolean = false;
//   // 最大节点深度（递归层级限制）
//   private readonly maxDepth: number;
//   // 单个节点容量（超过则分裂）
//   private readonly capacity: number;
//   // 分区中心点坐标
//   private readonly centerX: number;
//   private readonly centerY: number;
//   // 父节点引用
//   public parent?: QuadTree = undefined;
//   // 延迟销毁定时器
//   private destroyTimer?: number = undefined;
//   // 子节点（四个象限）
//   protected children: Array<QuadTree> = [];
//   // 边界框 {top, left, bottom, width, right, height}
//   private readonly bounding: { top: number; left: number; bottom: number; width: number; right: number; height: number };
//
//   /**
//    * @param left 边界左坐标
//    * @param top 边界上坐标
//    * @param width 边界宽度
//    * @param height 边界高度
//    * @param capacity 节点容量（默认3）
//    * @param maxNode 最大节点深度（默认10）
//    */
//   constructor(left: number, top: number, width: number, height: number, capacity = 3, maxNode = 10) {
//     this.maxDepth = maxNode;
//     this.capacity = capacity;
//     this.centerX = left + width / 2;  // 水平中心
//     this.centerY = top + height / 2;  // 垂直中心
//     this.bounding = { top, left, width, height, right: left + width, bottom: top + height };
//   }
//
//   /**
//    * 获取形状所在的象限索引
//    * @param shape 目标形状
//    * @returns 象限索引：0=左上, 1=右上, 2=左下, 3=右下, -1=跨越多象限
//    */
//   protected getIndex(shape: Shape): -1 | 0 | 1 | 2 | 3 {
//     const { centerX, centerY } = this;
//     // 检查各象限边界条件
//     if (shape.bounding.bottom < centerY && shape.bounding.right < centerX) return 0;   // 左上
//     if (shape.bounding.left > centerX && shape.bounding.bottom < centerY) return 1;   // 右上
//     if (shape.bounding.top > centerY && shape.bounding.right < centerX) return 2;     // 左下
//     if (shape.bounding.top > centerY && shape.bounding.left > centerX) return 3;      // 右下
//     return -1;  // 跨越多个象限
//   }
//
//   /**
//    * 创建子节点（按象限）
//    * @param index 象限索引
//    * @returns 创建或获取的子节点
//    */
//   private createChildren(index: 0 | 1 | 2 | 3) {
//     if (!this.children[index]) {
//       const width = this.bounding.width / 2;
//       const height = this.bounding.height / 2;
//       // 计算子象限边界：左上角坐标
//       const left = this.bounding.left + (index % 2) * width;
//       const top = this.bounding.top + Math.floor(index / 2) * height;
//       // 递归深度减1
//       this.children[index] = new QuadTree(left, top, width, height, this.maxDepth - 1, this.capacity);
//     }
//     return this.children[index];
//   }
//
//   /**
//    * 检查形状是否与当前四叉树区域相交
//    * @param shape 目标形状
//    * @returns 是否相交
//    */
//   public intersects(shape: Shape): boolean {
//     const { top, left, right, bottom } = shape.bounding;
//     // 检查边界不重叠的情况
//     if (right < this.bounding.left) return false;
//     if (left > this.bounding.right) return false;
//     if (top > this.bounding.bottom) return false;
//     if (bottom < this.bounding.top) return false;
//     return true;
//   }
//
//   /**
//    * 更新子形状的索引位置
//    * @param index 起始索引
//    */
//   private updateChildrenIndexes(index: number) {
//     const count = this.root.length;
//     for (let i = index; i < count; i++) {
//       // 通知形状更新其在父节点中的索引
//       this.root[i].parent.setIndex(this, i);
//     }
//   }
//
//   /**
//    * 插入形状到四叉树
//    * @param shape 待插入的形状
//    */
//   public insert(shape: Shape): void {
//     // 形状不在当前区域则忽略
//     if (!this.intersects(shape)) return;
//     // 清除待销毁定时器（如果有）
//     if (this.destroyTimer) {
//       clearTimeout(this.destroyTimer);
//       this.destroyTimer = undefined;
//     }
//     if (!this.divided) {
//       // 未分裂状态：检查容量
//       if (this.root.length >= this.capacity) {
//         // 达到容量，分裂节点
//         this.divided = true;
//         const children = this.root.splice(0, this.root.length);  // 取出所有形状
//         for (const shape of children) {
//           // 从当前节点移除，重新插入到子节点
//           shape.parent.remove(this);
//           this.insert(shape);
//         }
//       } else {
//         // 未达容量，直接添加到根节点
//         shape.parent.add(this, this.root.length);
//         this.root.push(shape);
//       }
//     } else {
//       // 已分裂状态：获取形状所在象限
//       const index = this.getIndex(shape);
//       if (index === -1 || !this.maxDepth) {
//         // 跨象限或达到深度限制，存入当前节点
//         shape.parent.add(this, this.root.length);
//         this.root.push(shape);
//       } else {
//         // 递归插入到子象限
//         this.createChildren(index).insert(shape);
//       }
//     }
//   }
//
//   /**
//    * 检查并移除子节点（当节点空时）
//    */
//   private checkAndRemoveChild() {
//     // 检查是否所有子节点为空
//     if (this.children.filter(Boolean).length === 0) {
//       this.divided = false;
//     }
//     // 当前节点为空且已分裂，延迟销毁
//     if (!this.root.length && this.divided) {
//       this.destroyTimer = setTimeout(() => {
//         this.parent?.removeQuadtreeChild(this);
//       }, 500) as unknown as number;  // 兼容浏览器和Node.js环境
//     }
//   }
//
//   /**
//    * 移除根节点中的形状
//    * @param index 移除起始位置
//    * @param removeCount 移除数量（默认1）
//    */
//   public removeChild(index: number, removeCount = 1) {
//     const removedShapes = this.root.splice(index, removeCount);
//     if (removedShapes.length) {
//       for (const shape of removedShapes) {
//         // 通知形状从当前节点移除
//         shape.parent.remove(this);
//       }
//     }
//     this.updateChildrenIndexes(index);  // 更新剩余形状的索引
//     this.checkAndRemoveChild();         // 检查是否需要销毁节点
//   }
//
//   /**
//    * 移除子四叉树节点
//    * @param child 要移除的子节点
//    */
//   public removeQuadtreeChild(child: QuadTree) {
//     const index = this.children.indexOf(child);
//     if (index !== -1) {
//       delete this.children[index];
//       this.checkAndRemoveChild();
//     }
//   }
//
//   /**
//    * 查询某点命中的所有形状
//    * @param x 点的X坐标
//    * @param y 点的Y坐标
//    * @returns 命中的形状数组
//    */
//   public isPointInShape(x: number, y: number): Shape[] {
//     // 点不在当前区域则返回空
//     const { top, left, right, bottom } = this.bounding;
//     if (x < left || x > right || y < top || y > bottom) return [];
//     const target: Shape[] = [];
//     // 检查当前节点根形状
//     for (const shape of this.root) {
//       if (shape.visible) {
//         target.push(...shape.isPointInShape(x, y));
//       }
//     }
//     // 递归检查子节点（根据点所在象限）
//     let childIndex: number;
//     if (x < this.centerX) {
//       childIndex = y < this.centerY ? 0 : 2;  // 左象限
//     } else {
//       childIndex = y < this.centerY ? 1 : 3;  // 右象限
//     }
//     if (this.children[childIndex]) {
//       target.push(...this.children[childIndex].isPointInShape(x, y));
//     }
//     return target;
//   }
//
//   /**
//    * 碰撞检测：查找与给定形状相交的所有形状
//    * @param shape 目标形状
//    * @returns 相交的形状数组
//    */
//   public crashDetection(shape: Shape): Shape[] {
//     if (!this.intersects(shape)) return [];
//     const target: Shape[] = [];
//     // 检查当前节点的根形状
//     for (const child of this.root) {
//       target.push(...child.crashDetection(shape));
//     }
//     // 递归检查子节点
//     for (const child of this.children) {
//       if (child) {
//         target.push(...child.crashDetection(shape));
//       }
//     }
//     return target;
//   }
// }
