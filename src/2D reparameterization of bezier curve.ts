// Define a 2D point interface
interface Point {
  x: number;
  y: number;
}

// Define a 2D Bézier curve interface
interface BezierCurve {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

// Calculate the length of a line segment between two points
function segmentLength(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the length of a 2D Bézier curve using numerical integration
function curveLength(curve: BezierCurve, numSegments: number): number {
  let length = 0;
  let t = 0;
  const dt = 1 / numSegments;
  let p1 = curve.p0;
  for (let i = 1; i <= numSegments; i++) {
    const p2 = computePointOnCurve(curve, t + dt);
    length += segmentLength(p1, p2);
    p1 = p2;
    t += dt;
  }
  return length;
}

// Compute a point on a 2D Bézier curve given a parameter t
function computePointOnCurve(curve: BezierCurve, t: number): Point {
  const p0 = curve.p0;
  const p1 = curve.p1;
  const p2 = curve.p2;
  const p3 = curve.p3;
  const s = 1 - t;
  const x = s * s * s * p0.x + 3 * s * s * t * p1.x + 3 * s * t * t * p2.x + t * t * t * p3.x;
  const y = s * s * s * p0.y + 3 * s * s * t * p1.y + 3 * s * t * t * p2.y + t * t * t * p3.y;
  return { x, y };
}

// Reparameterize a 2D Bézier curve by arc length
// function reparametrizeCurveByArcLength(curve: BezierCurve, numSegments: number): (s: number) => number {
//   // Calculate the length of the curve using numerical integration
//   const curveLen = curveLength(curve, numSegments);

//   // Compute the cumulative arc length function s(t)
//   let s = 0;
//   const st = [s];
//   let t = 0;
//   const dt = 1 / numSegments;
//   let p1 = curve.p0;
//   for (let i = 1; i <= numSegments; i++) {
//     const p2 = computePointOnCurve(curve, t + dt);
//     s += segmentLength(p1, p2);
//     st.push(s);
//     p1 = p2;
//     t += dt;
//   }

//   // Invert the cumulative arc length function to obtain a new parameterization t(s)
//   const ts: number[] = [0];
//   for (let i = 1; i <= numSegments; i++) {
//     ts.push(inverseLerp(st[i], 0, curveLen));
//   }

//   // Return a function that maps arc length to the original parameter t
//   return (s: number): number => {
//     const idx = binary

// Reparameterize a 2D Bézier curve by arc length
function reparametrizeCurveByArcLength(curve: BezierCurve, numSegments: number): (s: number) => number {
  // Calculate the length of the curve using numerical integration
  const curveLen = curveLength(curve, numSegments);

  // Compute the cumulative arc length function s(t)
  let s = 0;
  const st = [s];
  let t = 0;
  const dt = 1 / numSegments;
  let p1 = curve.p0;
  for (let i = 1; i <= numSegments; i++) {
    const p2 = computePointOnCurve(curve, t + dt);
    s += segmentLength(p1, p2);
    st.push(s);
    p1 = p2;
    t += dt;
  }

  // Invert the cumulative arc length function to obtain a new parameterization t(s)
  const ts: number[] = [0];
  for (let i = 1; i <= numSegments; i++) {
    ts.push(inverseLerp(st[i], 0, curveLen));
  }

  // Return a function that maps arc length to the original parameter t
  return (s: number): number => {
    const idx = binarySearch(st, s);
    const t1 = ts[idx];
    const t2 = ts[idx + 1];
    const segmentLen = st[idx + 1] - st[idx];
    const u = (s - st[idx]) / segmentLen;
    return lerp(t1, t2, u);
  };
}


// Helper function to perform binary search on an array of values
function binarySearch(arr: number[], value: number): number {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  if (arr[mid] < value) {
  low = mid + 1;
  } else if (arr[mid] > value) {
  high = mid - 1;
  } else {
  return mid;
  }
  }
  return low - 1;
  }
  
  // Helper function to perform linear interpolation between two values
  function lerp(a: number, b: number, t: number): number {
  return (1 - t) * a + t * b;
  }
  
  // Helper function to compute the inverse of the lerp function
  function inverseLerp(value: number, a: number, b: number): number {
  return (value - a) / (b - a);
  }
  }
  /*
This implementation includes helper functions for computing the length of a line segment, the length of a Bézier curve using numerical integration, and the binary search and interpolation functions needed for inverting the cumulative arc length function. The main function `reparametrizeCurveByArcLength` takes a 2D Bézier curve and the number of line segments to use for numerical integration, and returns a function that maps arc length to the original parameter t of the curve. This function can then be used to evaluate points along the reparameterized curve.
*///
