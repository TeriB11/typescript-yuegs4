import { CanvasRenderer, ImplicitFunctionRenderer } from './Plotter';
import { Color } from './src/Color';
import { GraphingCanvas, MathStr } from './src/GraphingCanvas';
import { Rect } from './src/Rect';
import { Vec2 } from './src/Vec2';
import { Matrix } from './src/Matrix';
import { Canvas } from './src/Canvas';
import { createSlider, createRow } from './domHelpers';

const size = 400;

let hoverPoint: Vec2 | undefined;

const graphingCanvas = GraphingCanvas.root({
  size,
  viewport: Rect.createRanges([-2, 2], [-2, 2]),
  onMouseMove: (p) => {
    hoverPoint = p;
  },
});

const element = document.getElementById('app')!;

// graphingCanvas.addTitlePlacard('Yo!');
// graphingCanvas.addRangePlacard();

// graphingCanvas.addPlacard('text', MathStr('(x, f(x))'), {
//   canvasPosition: new Vec2(0.75, 0.625),
//   anchor: new Vec2(0.5, 0.5),
// });

// graphingCanvas.addPlacard('text2', MathStr('(x+h, f(x+h))'), {
//   canvasPosition: new Vec2(0.25, 0.5),
//   anchor: new Vec2(0.5, 0.5),
// });

// graphingCanvas.addPlacard(
//   'text3',
//   MathStr(
//     "\\text{Derivative} = f'(x) = \\frac{d}{dx}f = \\lim_{h\\rightarrow 0}\\frac{f(x+h)-f(x)}{h}"
//   ),
//   {
//     canvasPosition: new Vec2(0.5, 0.25),
//     anchor: new Vec2(0.5, 0.5),
//   }
// );

// graphingCanvas.addPlacard(
//   'text',
//   MathStr('\\frac{d}{dx}\\left(x^2\\right) = 2x'),
//   {
//     canvasPosition: new Vec2(0.5, 0.25),
//     anchor: new Vec2(0.5, 0.5),
//   }
// );

const fn = (x: number) => x * x - 1.5;
const fnRenderer = makeFunctionRenderer(fn, new Color(1, 0, 0), 400);

graphingCanvas.renderers = [
  fnRenderer,

  //makeFunctionRenderer(derivative(fn), new Color(0, 0, 1), 400),

  (canvas, viewport) => {
    if (hoverPoint) {
      const x0 = 0.5;
      const anchor = new Vec2(x0, fn(x0));
      const projectedHoverPoint = new Vec2(hoverPoint.x, fn(hoverPoint.x));

      //console.log(projectedHoverPoint);
      drawViewportLine(
        canvas,
        anchor,
        projectedHoverPoint.sub(anchor),
        viewport,
        new Color(1, 0, 1),
        3
      );
      canvas.drawCircle(anchor, canvas.pixelThickness * 10, new Color(0, 0, 1));
      canvas.drawCircle(
        new Vec2(hoverPoint.x, fn(hoverPoint.x)),
        canvas.pixelThickness * 10,
        new Color(0, 1, 0)
      );
    }
  },
];

function yValueForPointOnLine(point: Vec2, dir: Vec2, xValue: number): number {
  // PT = p + td
  // (PT_x - p_x)/d_x = t
  const t = (xValue - point.x) / dir.x;
  return point.y + t * dir.y;
}

function drawViewportLine(
  canvas: Canvas,
  point: Vec2,
  dir: Vec2,
  viewport: Rect,
  color: Color,
  pixelWidth: number
) {
  const minX = viewport.origin.x;
  const maxX = viewport.farCorner.x;

  const minY = viewport.origin.x;
  const maxY = viewport.farCorner.x;

  let start = Vec2.zero;
  let end = Vec2.zero;

  if (dir.x === 0) {
    if (dir.y === 0) {
      return;
    }

    start = new Vec2(point.x, minY);
    end = new Vec2(point.x, maxY);
  } else {
    start = new Vec2(minX, yValueForPointOnLine(point, dir, minX));
    end = new Vec2(maxX, yValueForPointOnLine(point, dir, maxX));
  }

  canvas.drawLine(start, end, color, canvas.pixelThickness * pixelWidth);
}

const tickRateMs = 1000 / 60;
graphingCanvas.drawCanvas.runRenderLoop(tickRateMs, () => {
  graphingCanvas.render();
});

function makeFunctionRenderer(
  fn: (x: number) => number,
  color: Color,
  numSteps: number
): CanvasRenderer {
  return (canvas, viewport) => {
    const minX = viewport.origin.x;
    const maxX = viewport.farCorner.x;

    let lastPosition: Vec2 | undefined = undefined;

    for (let x = minX; x <= maxX; x += viewport.size.x / (numSteps - 1)) {
      const y = fn(x);
      const pos = new Vec2(x, y);

      if (lastPosition) {
        canvas.drawLine(lastPosition, pos, color, canvas.pixelThickness * 3);
      }
      lastPosition = pos;
    }
  };
}

function derivative(
  fn: (x: number) => number,
  h: number = 0.0000001
): (x: number) => number {
  return (x) => {
    const fx = fn(x);
    const fxh = fn(x + h);

    return (fxh - fx) / h;
  };
}
