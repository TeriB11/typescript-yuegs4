import { Canvas } from './src/Canvas';
import { Color } from './src/Color';
import { Rect } from './src/Rect';
import { Vec2 } from './src/Vec2';

export type PlotStyle = {
  thickness: number;
  color: Color;
  dashPattern?: number[];
};

export type ExplicitFunction = (x: number) => number;
export type ImplicitFunction = (x: number, y: number) => number;

export type CanvasRenderer = (canvas: Canvas, viewport: Rect) => void;

export function StepPlotter(
  fn: ExplicitFunction,
  count: number,
  style: PlotStyle
): CanvasRenderer {
  return (canvas, viewport) => {
    canvas.drawPath(style, ({ moveTo, lineTo }) => {
      const minX = viewport.origin.x;
      const width = viewport.size.x;

      for (let i = 0; i < count; i++) {
        const x = minX + (i / (count - 1)) * width;
        const y = fn(x);

        const p = new Vec2(x, y);

        if (i === 0) {
          moveTo(p);
        } else {
          lineTo(p);
        }
      }
    });
  };
}

export function ImplicitFunctionRenderer(
  count: number,
  fn: (x: number, y: number) => number,
  color: Color
): CanvasRenderer {
  return (canvas, viewport) => {
    const minX = viewport.origin.x;
    const width = viewport.size.x;

    const minY = viewport.origin.y;
    const height = viewport.size.y;

    const dx = width / (count - 1);
    const dy = height / (count - 1);

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = minX + i * dx;
        const y = minY + j * dy;

        const fc = fn(x, y);
        const fl = fn(x - dx / 2, y);
        const fr = fn(x + dx / 2, y);
        const fu = fn(x, y + dy / 2);
        const fd = fn(x, y - dy / 2);

        const differingSigns = [fl, fr, fu, fd].some((f) => f * fc < 0);

        if (differingSigns) {
          canvas.drawCircle(new Vec2(x, y), 0.01, color);
        }
      }
    }
  };
}
