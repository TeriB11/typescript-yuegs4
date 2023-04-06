import { CanvasRenderer, PlotStyle } from './Plotter';
import { Color } from './src/Color';
import { GraphingCanvas } from './src/GraphingCanvas';
import { Rect } from './src/Rect';
import { Vec2 } from './src/Vec2';

import {
  CubicInterpolator,
  HermiteInterpolator,
  LineSegmentInterpolator,
  LineSegmentsInterpolator,
  ParametricEquation,
  QuadraticInterpolator,
} from './Interpolator';

const instructions = document.createElement('ul');
[
  'Press the 1, 2, 3, or 4 key to change which "dot" is active.',
  'Moving the mouse moves the active dot.',
  'Pressing the 0 key deselects the active dot.',
  '"L" uses line renderer, "Q" quadratic, "C" cubic, and "H" hermite.',
].forEach((str) => {
  const e = document.createElement('li');
  e.innerText = str;
  instructions.appendChild(e);
});
document.getElementById('app')!.appendChild(instructions);

const size = 400;

const interactivePoints = [
  new Vec2(-1, -1),
  new Vec2(-0.75, 1),
  new Vec2(0.75, -0.5),
  new Vec2(1.25, 0.75),
];

let currentPointIndex = -1;
let numberOfInteractivePoints = 4;
let interpolatorIndex = 0;

const graphingCanvas = GraphingCanvas.root({
  size,
  viewport: Rect.createRanges([-2, 2], [-2, 2]),
  onMouseMove: (p) => {
    if (currentPointIndex >= 0) {
      interactivePoints[currentPointIndex] = p;
    }
  },
  onKeyDown: (key) => {
    const index = Number.parseInt(key);
    if (
      !Number.isNaN(index) &&
      index >= 0 &&
      index <= interactivePoints.length
    ) {
      currentPointIndex = index - 1;
    } else if (key === 'l') {
      interpolatorIndex = 0;
      numberOfInteractivePoints = 4;
    } else if (key === 'q') {
      interpolatorIndex = 1;
      numberOfInteractivePoints = 3;
    } else if (key === 'c') {
      interpolatorIndex = 2;
      numberOfInteractivePoints = 4;
    } else if (key === 'h') {
      interpolatorIndex = 3;
      numberOfInteractivePoints = 4;
    }
  },
});

function colorForPointAtIndex(points: Vec2[], index: number) {
  return Color.fromHSV(index / points.length, 1, 1);
}

graphingCanvas.renderers = [
  (canvas, viewport) => {
    const interpolator = [
      LineSegmentsInterpolator,
      QuadraticInterpolator,
      CubicInterpolator,
      HermiteInterpolator,
    ][interpolatorIndex];

    const stepCount =
      (interpolatorIndex === 0 ? 1 : 100) * (numberOfInteractivePoints - 1);

    MakeParametricRenderer(
      interpolator(
        interactivePoints.slice(0, numberOfInteractivePoints) as any
      ),
      { stepCount },
      { color: Color.black, thickness: 3 }
    )(canvas, viewport);

    // Render Hermite derivatives as a visual aide
    if (interpolatorIndex === 3) {
      canvas.drawLine(
        interactivePoints[0],
        interactivePoints[1],
        new Color(0.9, 0.9, 0.6),
        3 * canvas.pixelThickness
      );
      canvas.drawLine(
        interactivePoints[2],
        interactivePoints[3],
        new Color(0.9, 0.9, 0.6),
        3 * canvas.pixelThickness
      );
    }

    interactivePoints.forEach((point, index) => {
      if (index < numberOfInteractivePoints) {
        canvas.drawCircle(
          point,
          canvas.pixelThickness * 10,
          colorForPointAtIndex(interactivePoints, index)
        );
      }
    });
  },
];

function MakeParametricRenderer(
  eqn: ParametricEquation,
  parameter: {
    min?: number;
    max?: number;
    stepCount: number;
  },
  style: PlotStyle
): CanvasRenderer {
  const max = parameter.max ?? 1;
  const min = parameter.min ?? 0;
  const step = (max - min) / parameter.stepCount;

  return (canvas, viewport) => {
    canvas.drawPath(style, ({ moveTo, lineTo }) => {
      for (let t = min; t <= max; t += step) {
        const p = eqn(t);
        if (t === 0) {
          moveTo(p);
        } else {
          lineTo(p);
        }
      }
    });
  };
}

const tickRateMs = 1000 / 60;
graphingCanvas.drawCanvas.runRenderLoop(tickRateMs, () => {
  graphingCanvas.render();
});
