import { Color } from './Color';
import { Matrix } from './Matrix';
import { Rect } from './Rect';
import { Vec2 } from './Vec2';

export class Canvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private _viewRect: Rect;
  private _canvasSize: Vec2;

  get unsafeRawContext() {
    return this.context;
  }

  get unsafeContainerElement() {
    return this.containerElement;
  }

  constructor(
    private readonly containerElement: HTMLElement,
    options: {
      canvasSize: Vec2;
      viewRect?: Rect;
    }
  ) {
    const canvas: HTMLCanvasElement = document.createElement(
      'canvas'
    ) as HTMLCanvasElement;
    containerElement.appendChild(canvas);
    this.canvas = canvas;

    this.context = canvas.getContext('2d')!;

    this._viewRect =
      options.viewRect ?? Rect.create(0, 0, ...options.canvasSize.components);
    this._canvasSize = options.canvasSize;
    this.updateRects();

    canvas.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const p = new Vec2(evt.clientX - rect.x, evt.clientY - rect.y);

      const x = p.x / rect.width;
      const y = (rect.height - p.y) / rect.height;

      const n = new Vec2(x, y);

      this.onMouseMove?.({
        position: this.viewRect.convertNormalizedCoordinate(n),
        normalizedPosition: n,
      });
    };

    window.addEventListener('keydown', (evt) => {
      this.onKeyDown?.({
        key: evt.key,
      });
    });
  }

  get viewRect(): Rect {
    return this._viewRect;
  }

  set viewRect(r: Rect) {
    this._viewRect = r;
    this.updateRects();
  }

  get canvasSize(): Vec2 {
    return this._canvasSize;
  }

  set canvasSize(s: Vec2) {
    this._canvasSize = s;
    this.updateRects();
  }

  private updateRects() {
    const { canvas } = this;

    canvas.style.width = this.canvasSize.x + 'px';
    canvas.style.height = this.canvasSize.y + 'px';

    canvas.width = this.canvasSize.x * window.devicePixelRatio;
    canvas.height = this.canvasSize.y * window.devicePixelRatio;

    const mat = this.canvasMat(window.devicePixelRatio);
    this.context.setTransform(mat.toDOMMatrix());
  }

  get pixelSize(): Vec2 {
    const mat = this.context.getTransform();
    const x = Math.abs(mat.a);
    const y = Math.abs(mat.d);

    return new Vec2(x, y).divScale(window.devicePixelRatio);
  }

  get pixelThickness() {
    return 1 / this.pixelSize.magnitude();
  }

  canvasMat(pixelRatio = window.devicePixelRatio): Matrix<3, 3> {
    const { canvasSize, viewRect } = this;

    const sx = (viewRect.size.x / canvasSize.x) * pixelRatio;
    const sy = (-viewRect.size.y / canvasSize.y) * pixelRatio;
    const tx = 0;
    const ty = canvasSize.y * pixelRatio;

    return new Matrix([
      [sx, 0, 0],
      [0, sy, 0],
      [tx, ty, 1],
    ] as const);
  }

  onMouseMove:
    | ((d: { position: Vec2; normalizedPosition: Vec2 }) => void)
    | undefined = undefined;

  onKeyDown: ((d: { key: string }) => void) | undefined = undefined;

  get midpoint(): Vec2 {
    return this.viewRect.midpoint;
  }

  get inscribedRadius(): number {
    return Math.min(this.viewRect.width, this.viewRect.height) / 2;
  }

  get curcumscribedRadius(): number {
    const x = this.viewRect.width / 2;
    const y = this.viewRect.height / 2;
    return Math.sqrt(x * x + y * y);
  }

  clear(color: Color) {
    this.#contextOperation(() => {
      this.context.fillStyle = color.hexString();
      this.context.fillRect(...this.viewRect.components);
    });
  }

  #contextOperation(fn: () => void) {
    this.context.save();
    fn();
    this.context.restore();
  }

  drawCircle(
    origin: Vec2,
    radius: number,
    color: Color,
    mode: 'fill' | 'stroke' = 'fill'
  ) {
    this.#contextOperation(() => {
      this.context.beginPath();
      this.context.ellipse(
        origin.x,
        origin.y,
        radius,
        radius,
        0,
        0,
        Math.PI * 2
      );

      if (mode === 'fill') {
        this.context.fillStyle = color.hexString();
        this.context.fill();
      } else {
        this.context.strokeStyle = color.hexString();
        this.context.stroke();
      }
    });
  }

  drawPoint(pt: Vec2, color: Color) {
    this.#contextOperation(() => {
      this.context.fillStyle = color.hexString();
      this.context.fillRect(pt.x, pt.y, 1, 1);
    });
  }

  drawLine(start: Vec2, end: Vec2, color: Color, pixelThickness: number = 6) {
    this.#contextOperation(() => {
      this.context.strokeStyle = color.hexString();
      this.context.lineWidth = pixelThickness;
      this.context.beginPath();
      this.context.moveTo(...start.components);
      this.context.lineTo(...end.components);
      this.context.stroke();
    });
  }

  drawPolygon(pts: Vec2[], color: Color) {
    this.#contextOperation(() => {
      this.context.fillStyle = color.hexString();
      this.context.beginPath();

      pts.forEach((p, i) => {
        this.context[i === 0 ? 'moveTo' : 'lineTo'](p.x, p.y);
      });

      this.context.fill();
    });
  }

  drawRect(
    rect: Rect,
    options: {
      fillColor?: Color;
      stroke?: { color: Color; thickness?: number };
    },
    position: 'centered' | 'origin' = 'origin'
  ) {
    const p = rect.origin;
    const w = rect.size.x;
    const h = rect.size.y;

    this.#contextOperation(() => {
      const components =
        position === 'centered'
          ? ([p.x - w / 2, p.y - h / 2, w, h] as const)
          : ([p.x, p.y, w, h] as const);

      if (options.fillColor) {
        this.context.fillStyle = options.fillColor.hexString();
        this.context.fillRect(...components);
      }

      if (options.stroke) {
        this.context.strokeStyle = options.stroke.color.hexString();
        this.context.lineWidth = options.stroke.thickness ?? 1;
        this.context.strokeRect(...components);
      }
    });
  }

  renderInViewport(
    options: {
      canvasRect: Rect;
      viewport: Rect;
    },
    fn: () => void
  ) {
    this.context.save();

    this.context.beginPath();
    this.context.rect(...options.canvasRect.components);
    this.context.clip();

    const mat = Matrix.viewportTransformation(
      options.viewport,
      options.canvasRect
    );

    /*
      a c e
      b d f
      0 0 1
    */
    this.context.transform(
      mat.atColumnRow(0, 0),
      mat.atColumnRow(0, 1),
      mat.atColumnRow(1, 0),
      mat.atColumnRow(1, 1),
      mat.atColumnRow(2, 0),
      mat.atColumnRow(2, 1)
    );

    fn();

    this.context.restore();
  }

  runRenderLoop(
    tickTime: number,
    fn: (deltaTime: number, absoluteTime: number) => void,
    startTimeOffset?: number
  ) {
    const startTime = Date.now();
    let lastTime = startTime;

    window.setInterval(() => {
      const time = Date.now() - startTime;
      const dt = time - lastTime;
      lastTime = time;

      fn(dt / 1000, time / 1000 + (startTimeOffset ?? 0));
    }, tickTime);
  }

  drawPath(
    config: { color: Color; thickness: number; dashPattern?: number[] },
    fn: (operations: {
      moveTo: (v: Vec2) => void;
      lineTo: (v: Vec2) => void;
    }) => void
  ) {
    this.context.save();
    this.context.beginPath();

    this.context.lineWidth = config.thickness * this.pixelThickness;
    this.context.strokeStyle = config.color.hexString();
    if (config.dashPattern) {
      this.context.setLineDash(config.dashPattern);
    }

    fn({
      moveTo: (v) => this.context.moveTo(...v.components),
      lineTo: (v) => this.context.lineTo(...v.components),
    });
    this.context.stroke();
    this.context.restore();
  }
}
