import { Shape } from './Shape';

export class BoundingBox {
  top: number;
  left: number;
  right: number;
  bottom: number;

  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  intersects(other: BoundingBox): boolean {
    return (this.left <= other.right && this.right >= other.left && this.top <= other.bottom && this.bottom >= other.top);
  }

  contains(x: number, y: number): boolean {
    return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
  }
}

export class LooseOctreeNode {
  public shapes: Shape[];
  public boundingBox: BoundingBox;
  public children: LooseOctreeNode[] | null;

  constructor(boundingBox: BoundingBox) {
    this.shapes = [];
    this.children = null;
    this.boundingBox = boundingBox;
  }

  isLeaf(): boolean {
    return this.children === null;
  }

  isEmpty(): boolean {
    return this.shapes.length === 0;
  }
}

export class LooseOctree {
  public root: LooseOctreeNode;
  public maxShapesPerNode: number;

  constructor(left: number, top: number, right: number, bottom: number, maxShapesPerNode = 10) {
    this.root = new LooseOctreeNode(new BoundingBox(left, top, right, bottom));
    this.maxShapesPerNode = maxShapesPerNode;
  }

  insert(shape: Shape): void {
    this.insertShape(this.root, shape);
  }

  private insertShape(node: LooseOctreeNode, shape: Shape): void {
    if (!node.boundingBox.intersects(shape.getBoundingBox())) return;
    if (node.isLeaf()) {
      if (node.shapes.length < this.maxShapesPerNode || node.boundingBox.left === node.boundingBox.right) {
        node.shapes.push(shape);
      } else {
        this.subdivideNode(node);
        this.insertShape(node, shape);
      }
    } else {
      for (const child of node.children!) {
        this.insertShape(child, shape);
      }
    }
  }

  private subdivideNode(node: LooseOctreeNode): void {
    const { left, top, right, bottom } = node.boundingBox;
    const xMid = (left + right) / 2;
    const yMid = (top + bottom) / 2;
    node.children = [];
    node.children.push(new LooseOctreeNode(new BoundingBox(left, top, xMid, yMid)));
    node.children.push(new LooseOctreeNode(new BoundingBox(xMid, top, right, yMid)));
    node.children.push(new LooseOctreeNode(new BoundingBox(left, yMid, xMid, bottom)));
    node.children.push(new LooseOctreeNode(new BoundingBox(xMid, yMid, right, bottom)));
  }

  collisionDetection(shape: Shape): boolean {
    return this.collisionDetectionRecursive(this.root, shape);
  }

  private collisionDetectionRecursive(node: LooseOctreeNode, shape: Shape): boolean {
    if (!node.boundingBox.intersects(shape.getBoundingBox())) return false;
    for (const otherShape of node.shapes) {
      if (otherShape !== shape && this.shapesIntersect(shape, otherShape)) return true;
    }
    if (node.isLeaf()) return false;
    for (const child of node.children!) {
      if (this.collisionDetectionRecursive(child, shape)) return true;
    }
    return false;
  }

  private shapesIntersect(p1: Shape, p2: Shape): boolean {
    return p1.crashDetection(p2);
  }

  updateShapePosition(oldShape: Shape, newShape: Shape): void {
    this.removeShape(oldShape);
    this.insertShape(this.root, newShape);
  }

  removeShape(shape: Shape): void {
    this.removeShapeRecursive(this.root, shape);
  }

  private removeShapeRecursive(node: LooseOctreeNode, shape: Shape): void {
    if (!node.boundingBox.intersects(shape.getBoundingBox())) return;
    if (node.isLeaf()) {
      const index = node.shapes.indexOf(shape);
      if (index !== -1) {
        node.shapes.splice(index, 1);
      }
    } else {
      for (const child of node.children!) {
        this.removeShapeRecursive(child, shape);
      }
    }
  }

  detectCollisionsRecursive(node: LooseOctreeNode, shape: Shape, collidingShapes: Shape[]) {
    if (!node.boundingBox.intersects(shape.getBoundingBox())) return;
    for (const otherShape of node.shapes) {
      if (otherShape !== shape && this.shapesIntersect(shape, otherShape)) {
        collidingShapes.push(otherShape);
      }
    }
    if (node.isLeaf()) return;
    for (const child of node.children!) {
      this.detectCollisionsRecursive(child, shape, collidingShapes);
    }
  }
}
