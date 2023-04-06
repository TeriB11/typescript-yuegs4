import { Canvas } from './Canvas';
import { Color } from './Color';
import { Rect } from './Rect';
import { Vec2 } from './Vec2';

import * as latexjs from 'latex.js';
import { Matrix } from './Matrix';
import { CanvasRenderer } from '../Plotter';

export const MathStr = (x: string) => `$$${x}$$`;

export type LaTexConfig = {
  source: string;
  position: Vec2;
  positionRelativeTo: 'viewport' | 'canvas';
  anchor?: Vec2;
  styler?: (element: HTMLElement) => void;
};

export type AxisSettings = {
  visible: boolean;
  majorStep: number;
  minorDivisions: number;
  color: Color;
  thickness: number;
};

export class GraphingCanvas {
  constructor(public readonly drawCanvas: Canvas) {}

  static root(config: {
    size: number;
    viewport: Rect;
    onMouseMove?: (v: Vec2) => void;
    onKeyDown?: (key: string) => void;
  }) {
    const { size, viewport, onMouseMove, onKeyDown } = config;

    const appDiv: HTMLElement = document.getElementById('app');
    const canvas = new Canvas(appDiv, {
      canvasSize: new Vec2(size, size),
    });

    const graphingCanvas = new GraphingCanvas(canvas);
    graphingCanvas.canvasRect = canvas.viewRect.inset(5);

    graphingCanvas.viewport = viewport;

    if (onMouseMove) {
      canvas.onMouseMove = ({ normalizedPosition }) => {
        onMouseMove(
          graphingCanvas.viewport.convertNormalizedCoordinate(
            normalizedPosition
          )
        );
      };
    }
    if (onKeyDown) {
      canvas.onKeyDown = ({ key }) => {
        onKeyDown(key);
      };
    }

    return graphingCanvas;
  }

  private _canvasRect = Rect.zero;
  get canvasRect() {
    return this._canvasRect;
  }
  set canvasRect(r: Rect) {
    this._canvasRect = r;
    this.sizeDirty = true;
  }

  private _viewport = Rect.zero;
  get viewport() {
    return this._viewport;
  }
  set viewport(r: Rect) {
    this._viewport = r;
    this.sizeDirty = true;
  }

  private sizeDirty = false;

  backgroundColor = Color.grey(0.7);
  borderColor = Color.black;
  borderThickness = 1;

  addPlacard(
    key: string,
    source: string,
    pos: {
      canvasPosition: Vec2;
      anchor: Vec2;
    },
    color?: Color,
    borderColor?: Color
  ) {
    this.addLatexString(key, {
      source,
      position: pos.canvasPosition,
      positionRelativeTo: 'canvas',
      anchor: pos.anchor,
      styler: (element) => {
        element.style.backgroundColor =
          (color ?? Color.white).hexString() + 'ef';
        element.style.width = 'max-content';
        element.style.height = 'max-content';
        element.style.padding = '0px 8px 0px 8px';
        element.style.margin = '0px';

        if (borderColor) {
          element.style.border = `1px solid ${borderColor.hexString()}`;
        }
      },
    });
  }

  private _xAxisSetting: AxisSettings = {
    visible: true,
    majorStep: 1,
    minorDivisions: 4,
    color: Color.black,
    thickness: 2,
  };

  private _yAxisSetting: AxisSettings = {
    visible: true,
    majorStep: 1,
    minorDivisions: 4,
    color: Color.black,
    thickness: 2,
  };

  get axisSettingsX() {
    return this._xAxisSetting;
  }

  setAxisSettingsX(s: Partial<AxisSettings>) {
    this._xAxisSetting = { ...this._xAxisSetting, ...s };
  }

  get axisSettingsY() {
    return this._yAxisSetting;
  }

  setAxisSettingsY(s: Partial<AxisSettings>) {
    this._yAxisSetting = { ...this._yAxisSetting, ...s };
  }

  renderers: CanvasRenderer[];

  private texts: {
    [n: string]: {
      element: HTMLElement;
      source: string;
      config: LaTexConfig;
    };
  } = {};

  render(fn?: (canvas: Canvas, viewport: Rect) => void) {
    if (this.sizeDirty) {
      this.rebuildTexts();
      this.sizeDirty = false;
    }

    this.drawCanvas.renderInViewport(
      {
        canvasRect: this.canvasRect,
        viewport: this.viewport,
      },
      () => {
        this.drawCanvas.drawRect(this.viewport, {
          fillColor: this.backgroundColor,
        });

        this.drawAxis('x');
        this.drawAxis('y');

        for (const renderer of this.renderers) {
          renderer(this.drawCanvas, this.viewport);
        }
        fn?.(this.drawCanvas, this.viewport);
      }
    );

    if (this.borderThickness > 0) {
      this.drawCanvas.drawRect(this.canvasRect, {
        stroke: { color: this.borderColor, thickness: this.borderThickness },
      });
    }

    Object.values(this.texts).forEach((v) => {
      this.positionElement(
        v.element,
        v.element.getBoundingClientRect(),
        v.config
      );
    });
  }

  private drawAxis(axis: 'x' | 'y') {
    const settings = axis === 'x' ? this._xAxisSetting : this._yAxisSetting;
    if (!settings.visible) {
      return;
    }

    const minX = this.viewport.origin.x;
    const minY = this.viewport.origin.y;
    const maxX = this.viewport.origin.x + this.viewport.size.x;
    const maxY = this.viewport.origin.y + this.viewport.size.y;

    const startPoint = axis === 'x' ? new Vec2(minX, 0) : new Vec2(0, minY);
    const endPoint = axis === 'x' ? new Vec2(maxX, 0) : new Vec2(0, maxY);
    const { pixelSize } = this.drawCanvas;

    const thicknessFactor = pixelSize[axis];

    const { color, majorStep, minorDivisions } = settings;
    const thickness = settings.thickness / thicknessFactor;

    this.drawCanvas.drawLine(startPoint, endPoint, color, thickness);

    if (majorStep > 0) {
      const interval = this.viewport.size[axis];
      const min = this.viewport.origin[axis];

      const n = axis === 'x' ? new Vec2(1, 0) : new Vec2(0, 1);

      const d =
        axis === 'x'
          ? new Vec2(0, this.viewport.size.y / 40)
          : new Vec2(this.viewport.size.y / 40, 0);

      const d2 = d.scale(0.5);

      let i = min - Math.floor(min % majorStep);
      while (i <= min + interval) {
        const p = n.scale(i);

        if (i !== 0) {
          this.drawCanvas.drawLine(p.add(d), p.sub(d), color, thickness);
        }

        if (minorDivisions > 0) {
          for (let j = 0; j < minorDivisions; j++) {
            const h = n.scale((j * majorStep) / minorDivisions);

            this.drawCanvas.drawLine(
              p.add(h).add(d2),
              p.add(h).sub(d2),
              color,
              thickness / 2
            );
          }
        }

        i += majorStep;
      }
    }
  }

  private removeLatexString(key: string) {
    if (key in this.texts) {
      const { element } = this.texts[key];
      element.remove();
      delete this.texts[key];
    }
  }

  addLatexString(key: string, config: LaTexConfig) {
    const { source, styler } = config;

    this.removeLatexString(key);
    const element = createLaTeXElement(source);
    styler?.(element);

    this.texts[key] = {
      element,
      source,
      config,
    };

    this.drawCanvas.unsafeContainerElement.appendChild(element);
  }

  private positionElement(
    element: HTMLElement,
    bounds: DOMRect,
    config: LaTexConfig
  ) {
    const { position, positionRelativeTo, anchor } = config;

    let x = 0;
    let y = 0;

    if (positionRelativeTo === 'viewport') {
      const canvasMat = this.drawCanvas.canvasMat(1).toDOMMatrix();
      const viewportMat = Matrix.viewportTransformation(
        this.canvasRect,
        this.viewport
      ).toDOMMatrix();

      const mat = viewportMat.multiply(canvasMat).inverse();
      const p = mat.transformPoint(new DOMPoint(position.x, position.y));
      x = p.x;
      y = p.y;
    } else {
      const p = this.canvasRect.origin.add(
        this.canvasRect.size.componentMul(position.mapY((y) => 1 - y))
      );

      x = p.x;
      y = p.y;
    }

    if (config.anchor) {
      x -= anchor.x * bounds.width;
      y -= (1 - anchor.y) * bounds.height;
    }

    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
  }

  private rebuildTexts() {
    const texts: [string, LaTexConfig][] = Object.entries(this.texts).filter(
      ([k, entry]) => {
        return entry.positionRelativeTo === 'viewport';
      }
    );

    texts.forEach(([k]) => {
      this.removeLatexString(k);
    });

    texts.forEach(([key, data]) => {
      this.addLatexString(key, data);
    });
  }

  addTitlePlacard(text: string) {
    this.addPlacard(
      '__title',
      text,
      {
        canvasPosition: new Vec2(0.5, 1),
        anchor: new Vec2(0.5, 1),
      },
      Color.white,
      Color.grey(0.6)
    );
  }

  addRangePlacard() {
    const { viewport } = this;

    this.addPlacard(
      '__range-legend',
      MathStr(
        `(x,y)\\in[${viewport.origin.x},${viewport.farCorner.x}]\\times[${viewport.origin.y},${viewport.farCorner.y}]`
      ),
      {
        canvasPosition: new Vec2(0.5, 0),
        anchor: new Vec2(0.5, 0),
      },
      Color.grey(0.95),
      Color.grey(0.6)
    );
  }
}

try {
  document.body.appendChild(
    new latexjs.HtmlGenerator().stylesAndScripts(
      'https://cdn.jsdelivr.net/gh/fgborges/latex2e-js@develop/dist/'
    )
  );
} catch (e) {}

function createLaTeXElement(text: string) {
  const element = document.createElement('div');

  const result = latexjs.parse(text, {
    generator: new latexjs.HtmlGenerator(),
  });

  element.appendChild(result.domFragment());
  return element;
}
