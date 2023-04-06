export class Vec2 {
  constructor(public readonly x: number, public readonly y: number) {}

  static readonly zero = new Vec2(0, 0);
  static readonly one = new Vec2(1, 1);

  static readonly right = new Vec2(1, 0);
  static readonly up = new Vec2(0, 1);

  get components(): [number, number] {
    return [this.x, this.y];
  }

  get(component: 'x' | 'y') {
    return component === 'x' ? this.x : this.y;
  }

  toString() {
    return `(x : ${this.x}, y : ${this.y})`;
  }

  mapX(fn: (n: number) => number) {
    return new Vec2(fn(this.x), this.y);
  }

  mapY(fn: (n: number) => number) {
    return new Vec2(this.x, fn(this.y));
  }

  add(other: Vec2) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  componentMul(other: Vec2) {
    return new Vec2(this.x * other.x, this.y * other.y);
  }

  componentDiv(other: Vec2) {
    return new Vec2(
      other.x === 0 ? 0 : this.x / other.x,
      other.y === 0 ? 0 : this.y / other.y
    );
  }

  dot(other: Vec2) {
    return this.x * other.x + this.y * other.y;
  }

  magnitudeSquared() {
    return this.dot(this);
  }

  magnitude() {
    return Math.sqrt(this.magnitudeSquared());
  }

  scale(scalar: number) {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  divScale(scalar: number) {
    return scalar === 0 ? Vec2.zero : this.scale(1 / scalar);
  }

  normalized() {
    return this.divScale(this.magnitude());
  }

  polarAngleRad() {
    return Math.atan2(this.y, this.x);
  }

  static polar(angleRad: number, radius: number = 1) {
    return new Vec2(radius * Math.cos(angleRad), radius * Math.sin(angleRad));
  }

  rotateRad(angleRad: number) {
    return Vec2.polar(this.polarAngleRad() + angleRad, this.magnitude());
  }

  distanceSquared(other: Vec2) {
    return this.sub(other).magnitudeSquared();
  }

  distance(other: Vec2) {
    return Math.sqrt(this.distanceSquared(other));
  }

  lerp(to: Vec2, amount: number) {
    return this.add(to.sub(this).scale(amount));
  }

  crossMagnitude(other: Vec2) {
    return this.x * other.y - this.y * other.x;
  }

  crossAxisZ(): Vec2 {
    return new Vec2(this.y, -this.x);
  }

  negate() {
    return this.scale(-1);
  }

  static linearCombination(...terms: [number, Vec2][]): Vec2 {
    return terms.reduce(
      (result, [coeff, value]) => result.add(value.scale(coeff)),
      Vec2.zero
    );
  }
}
