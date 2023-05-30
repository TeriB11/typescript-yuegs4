//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/*To reparameterize a 3D Bézier curve by arc length, you need to follow these steps:
1. Create a function to calculate the factorial of a number.
2. Create a function to calculate the binomial coefficient.
3. Create a function to evaluate the 3D Bézier curve.
4. Create a function to calculate the arc length of the curve using numerical integration.
5. Create a function to build a lookup table of arc lengths.
6. Create a function to find the parameter t corresponding to a given arc length using the lookup table.

This code defines and implements all the necessary functions to reparameterize a 3D Bézier curve by arc length. The example at the end demonstrates how to use these functions to find the point on the curve corresponding to half the total arc length.*/
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// A point in 3D space
type Point3D = {
  x: number;
  y: number;
  z: number;
};

/* Calculate factorial of a number
factorial(n: number): This function calculates the factorial of a given non-negative integer n. The factorial of a number n (denoted as n!) is the product of all positive integers less than or equal to n. For example, the factorial of 5 (5!) is 5 * 4 * 3 * 2 * 1 = 120. Factorials are used in the binomial coefficient calculation.
*/
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

/* Calculate binomial coefficient
binomialCoefficient(n: number, k: number): This function calculates the binomial coefficient for two given non-negative integers n and k. The binomial coefficient is the number of ways to choose k items from a set of n items, without considering the order. It is used in evaluating Bézier curves because it defines the weights of the control points.*/
function binomialCoefficient(n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

/* Evaluate 3D Bézier curve at parameter t
 evaluateBezier(points: Point3D[], t: number): This function evaluates a 3D Bézier curve at a given parameter t. The curve is defined by an array of control points (points). The parameter t ranges from 0 to 1 and represents the position along the curve. The function returns a 3D point (Point3D) representing the position of the curve at parameter t.*/
function evaluateBezier(points: Point3D[], t: number): Point3D {
  const n = points.length - 1;
  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i <= n; i++) {
    const coef = binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
    x += coef * points[i].x;
    y += coef * points[i].y;
    z += coef * points[i].z;
  }

  return { x, y, z };
}

/* Calculate the arc length of the curve using numerical integration
 arcLength(points: Point3D[], steps: number): This function calculates the approximate arc length of a 3D Bézier curve, given an array of control points (points). The curve's arc length is the total distance traveled along the curve from the start to the end. The function uses numerical integration (dividing the curve into small segments) to approximate the arc length. The steps parameter determines the number of segments, with a higher value giving a more accurate result.*/
function arcLength(points: Point3D[], steps: number = 1000): number {
  let length = 0;
  let prevPoint = evaluateBezier(points, 0);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const currentPoint = evaluateBezier(points, t);
    length += Math.sqrt(
      Math.pow(currentPoint.x - prevPoint.x, 2) +
      Math.pow(currentPoint.y - prevPoint.y, 2) +
      Math.pow(currentPoint.z - prevPoint.z, 2)
    );
    prevPoint = currentPoint;
  }

  return length;
}

/* Build a lookup table of arc lengths
 buildArcLengthTable(points: Point3D[], steps: number): This function creates a lookup table of arc lengths for a 3D Bézier curve, given an array of control points (points). The lookup table helps to efficiently find the parameter t corresponding to a given arc length. The steps parameter determines the number of entries in the table, with a higher value giving a more accurate result.*/
function buildArcLengthTable(points: Point3D[], steps: number = 1000): number[] {
  const table = new Array(steps + 1);
  let length = 0;
  let prevPoint = evaluateBezier(points, 0);

  table[0] = 0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const currentPoint = evaluateBezier(points, t);
    length += Math.sqrt(
      Math.pow(currentPoint.x - prevPoint.x, 2) +
      Math.pow(currentPoint.y - prevPoint.y, 2) +
      Math.pow(currentPoint.z - prevPoint.z, 2)
    );
    table[i] = length;
    prevPoint = currentPoint;
  }

  return table;
}

/* Find the parameter t corresponding to a given arc length using the lookup table
 findTForArcLength(table: number[], arcLength: number): This function finds the parameter t corresponding to a given arc length for a 3D Bézier curve, using a lookup table of arc lengths (table). The parameter t ranges from 0 to 1 and represents the position along the curve. The function uses binary search to find the closest index in the table for the given arc length, then performs linear interpolation between the two closest values to find the corresponding t value.*/
function findTForArcLength(table: number[], arcLength: number): number {
  if (arcLength <= 0) {
    return 0;
  }

  const lastIndex = table.length -1;
  if (arcLength >= table[lastIndex]) {
  return 1;
  }
  
  // Binary search to find the index corresponding to the given arc length
  let low = 0;
  let high = lastIndex;
  let index = 0;
  
  while (low < high) {
  index = Math.floor((low + high) / 2);
  if (table[index] < arcLength) {
  low = index + 1;
  } else {
  high = index;
  }
  }
  
// Linear interpolation between the two closest values in the lookup table
const t0 = (index - 1) / lastIndex;
const t1 = index / lastIndex;
const arcLength0 = table[index - 1];
const arcLength1 = table[index];

return t0 + (arcLength - arcLength0) / (arcLength1 - arcLength0) * (t1 - t0);
}

// Example usage:
const controlPoints: Point3D[] = [
{ x: 0, y: 0, z: 0 },
{ x: 1, y: 2, z: 1 },
{ x: 2, y: 0, z: 2 },
{ x: 3, y: -2, z: 1 },
{ x: 4, y: 0, z: 0 },
];
const table = buildArcLengthTable(controlPoints);
const totalArcLength = table[table.length - 1];
const tForHalfLength = findTForArcLength(table, totalArcLength / 2);
const pointAtHalfLength = evaluateBezier(controlPoints, tForHalfLength);

console.log('Point at half arc length:', pointAtHalfLength);  


