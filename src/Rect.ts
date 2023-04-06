import { Vec2 } from './Vec2';

export class Rect {
  constructor(public readonly origin: Vec2, public readonly size: Vec2) {}

  static zero = new Rect(Vec2.zero, Vec2.zero);

  get components(): [number, number, number, number] {
    return [...this.origin.components, ...this.size.components];
  }

  static create(x: number, y: number, width: number, height: number) {
    return new Rect(new Vec2(x, y), new Vec2(width, height));
  }

  static createRanges(x: [number, number], y: [number, number]) {
    return Rect.withCorners(new Vec2(x[0], y[0]), new Vec2(x[1], y[1]));
  }

  static withCorners(a: Vec2, b: Vec2): Rect {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);

    const maxX = Math.max(a.x, b.x);
    const maxY = Math.max(a.y, b.y);

    return Rect.create(minX, minY, maxX - minX, maxY - minY);
  }

  get width() {
    return this.size.x;
  }

  get height() {
    return this.size.y;
  }

  get farCorner() {
    return this.convertNormalizedCoordinate(Vec2.one);
  }

  convertNormalizedCoordinate(p: Vec2) {
    return this.origin.add(this.size.componentMul(p));
  }

  get midpoint() {
    return this.convertNormalizedCoordinate(new Vec2(0.5, 0.5));
  }

  inset(amount: number): Rect {
    return this.insetEach({
      left: amount,
      right: amount,
      top: amount,
      bottom: amount,
    });
  }

  insetEach(insets: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }): Rect {
    const { left, right, top, bottom } = insets;

    let { x: minX, y: minY } = this.convertNormalizedCoordinate(new Vec2(0, 0));
    let { x: maxX, y: maxY } = this.convertNormalizedCoordinate(new Vec2(1, 1));

    minX += left;
    maxX -= right;

    minY += top;
    maxY -= bottom;

    if (minX > maxX) {
      const x = (maxX + minX) / 2;
      minX = x;
      maxX = x;
    }

    if (minY > maxY) {
      const y = (maxY + minY) / 2;
      minY = y;
      maxY = y;
    }

    return Rect.withCorners(new Vec2(minX, minY), new Vec2(maxX, maxY));
  }
}
