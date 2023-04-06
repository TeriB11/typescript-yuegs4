import { Color } from './src/Color';
import { Vec2 } from './src/Vec2';

export type ParametricEquation = (t: number) => Vec2;

export type Interpolator<Pts extends Vec2[]> = (
  pts: Pts
) => (t: number) => Vec2;

export const LineSegmentInterpolator: Interpolator<[Vec2, Vec2]> = ([a, b]) => {
  return (t) => a.lerp(b, t);
};

function remapParameterToSubRange(
  parameter: number,
  count: number
): { parameter: number; index: number } {
  if (parameter <= 0) {
    return { parameter: 0, index: 0 };
  } else if (parameter >= 1) {
    return { parameter: 1, index: count - 1 };
  } else {
    const segmentWidth = 1 / count;
    const subT = (parameter % segmentWidth) / segmentWidth;
    const segmentIndex = Math.floor(parameter / segmentWidth);
    return { parameter: subT, index: segmentIndex };
  }
}

export const LineSegmentsInterpolator: Interpolator<Vec2[]> = (pts) => {
  const numSegments = pts.length - 1;
  if (numSegments < 1) {
    return () => pts[0] ?? Vec2.zero;
  }

  return (t) => {
    const { parameter, index } = remapParameterToSubRange(t, numSegments);
    return LineSegmentInterpolator([pts[index], pts[index + 1]])(parameter);
  };
};

export const QuadraticInterpolator: Interpolator<[Vec2, Vec2, Vec2]> = ([
  a,
  b,
  c,
]) => {
  return (t) => {
    /*
      We want to find a parabola that goes through points a, b, c.
      We can find a function f such that:
        f(0) = a
        f(1) = b
        f(2) = c

      We want a curve to go through 3 points so we can use a degree 2
      polynomial (a "parabola" or a "quadratic curve"). E.g. we want
      to find u, v, and w such that

      f(t) = ut^2 + vt + w

      has the properties outlined above. Note that u, v, and w are scalars!

      So, f(0) = a says:

      f(0) = u*0^2 + v*0 + w = w

      therefore w = a and we now can write:

      f(t) = ut^2 + vt + a

      and simply find u and v! Let's look at f(1) = c next:

      f(1) = u*1^2 + v*1 + a = u + v + a

      Therefore c = u + v + a, or v = c - u - a. So we can write

      f(t) = ut^2 + (c - u - a)t + a

      And just find u! Let's use f(0.5) = b

      f(0.5) = u*(0.5)^2 + (c - u - a)*0.5 + a
             = u/4 + c/2 - u/2 - a/2 + a
             = -u/4 + c/2 + a/2

      So b = -u/4 + c/2 + a/2
       u/4 = c/2 + a/2 - b
         u = 2c + 2a - 4b

      So there is our expression for u, the we end with:

      f(t) = (2a - 4b + 2c)t^2 + (-3a + 4b - c)t + a

      Fun fact, if we want to use matrices we can actually do this:

                                                          |  1  |
      f(t) = | a      -3a + 4b - c       2a - 4b + 2c | * |  t  |
                                                          | t^2 |

      Remember that a, b, c are VECTORS so we actually have a matrix that has
      vectors inside of it...!
                             |  1  -3   2 |   |  1  |
      f(t) = |  a  b  c  | * |  0   4  -4 | * |  t  |
                             |  0  -1   2 |   | t^2 |

      Assuming you have a fast matrix library, you can precompute the matrices on the left and then just build the "t-matrix" and do a mutiplication each frame!

      Note, the matrix with vector entries is NOT actually a matrix.
      It's something called a tensor, and in this case, it's a rank-3 tensor.

      Rank-0 tensor: scalar
      Rank-1 tensor: vector
      Rank-2 tensor: matrix
      Rank-3 tensor: 3D array of numbers (with some rules on how it transforms
                     "A matrix with vectors for entries"
    */

    // Recall: f(t) = (2a - 4b + 2c)t^2 + (-3a + 4b - c)t + a
    return Vec2.linearCombination(
      [t * t, Vec2.linearCombination([2, a], [-4, b], [2, c])],
      [t, Vec2.linearCombination([-3, a], [4, b], [-1, c])],
      [1, a]
    );
  };
};

export const CubicInterpolator: Interpolator<[Vec2, Vec2, Vec2, Vec2]> = ([
  a,
  b,
  c,
  d,
]) => {
  return (t) => {
    /*
      TODO: implement using the same approach as quadratic above but
            find scalars p, q, r, s to create:

            f(t) = pt^3 + qt^2 + rt + s

            such that:

            f(0)   = a
            f(1/3) = b
            f(2/3) = c
            f(3/3) = d
    */
    return a;
  };
};

export const HermiteInterpolator: Interpolator<[Vec2, Vec2, Vec2, Vec2]> = ([
  a,
  b,
  c,
  d,
]) => {
  return (t) => {
    /*
      TODO: implement using the same approach as quadratic above but
            find scalars p, q, r, s to create:

            f(t) = pt^3 + qt^2 + rt + s

            such that:

            f(0)   = a
            f'(0)  = b-a
            f'(1)  = d-c
            f(1)   = d

            Note that we are saying the vector (b-a) is the *derivative* at t=0
            and (d-c) is the *derivative* at t=1.

            Hint... what is the derivative of: f(t) = pt^3 + qt^2 + rt + s ?
    */
    return a;
  };
};
