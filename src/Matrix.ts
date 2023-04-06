import { Rect } from './Rect';
import { Vec2 } from './Vec2';

export type NVec<N extends number, Element> = readonly Element[] & {
  length: N;
};

export function NVecMap<N extends number, A, B>(
  a: NVec<N, A>,
  f: (a: A, index: number) => B
): NVec<N, B> {
  return a.map(f) as unknown as NVec<N, B>;
}

export type VecN<N extends number> = NVec<N, number>;

export function VecNDot<N extends number>(a: VecN<N>, b: VecN<N>): number {
  return a.reduce((accum, val, index) => accum + val * b[index], 0);
}

export function VecNAdd<N extends number>(a: VecN<N>, b: VecN<N>): VecN<N> {
  return NVecMap(a, (a, idx) => a + b[idx]);
}

export function VecNSub<N extends number>(a: VecN<N>, b: VecN<N>): VecN<N> {
  return NVecMap(a, (a, idx) => a - b[idx]);
}

export function VecNScalarMul<N extends number>(
  a: VecN<N>,
  scalar: number
): VecN<N> {
  return NVecMap(a, (a, idx) => a * scalar);
}

type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

type FlattenTuple<T extends any[][]> = T extends [infer Head extends any[], ...infer Tail extends any[][]] ?
  [...Head, ...FlattenTuple<Tail>] : []

type ComponentsTuple<R extends number, C extends number> = FlattenTuple<Tuple<Tuple<number, R>, C>>

export class Matrix<R extends number, C extends number> {
  constructor(private readonly data: NVec<C, VecN<R>>) {}

  static withVec2(v: Vec2): Matrix<2, 1> {
    return new Matrix([v.components]) as Matrix<2, 1>;
  }

  static withVec2asRow(v: Vec2): Matrix<1, 2> {
    return this.withVec2(v).transpose();
  }

  static withVec2Columns(first: Vec2, second: Vec2): Matrix<2, 2> {
    return new Matrix([first.components, second.components]) as Matrix<2, 2>;
  }

  static withColumnProvider<R extends number, C extends number>(
    x: { rows: R; columns: C },
    f: (column: number) => VecN<R>
  ): Matrix<R, C> {
    const data = Array.from({ length: x.columns }, (_, column) => {
      return f(column);
    }) as unknown as NVec<C, VecN<R>>;
    return new Matrix<R, C>(data);
  }

  static withProvider<R extends number, C extends number>(
    x: { rows: R; columns: C },
    f: (rc: { row: number; column: number }) => number
  ): Matrix<R, C> {
    return this.withColumnProvider(x, (column) => {
      return Array.from({ length: x.rows }, (_, row) =>
        f({ row, column })
      ) as unknown as VecN<R>;
    });
  }

  get size(): { rows: R; columns: C } {
    return {
      rows: this.data[0]?.length ?? (0 as R),
      columns: this.data.length,
    };
  }

  static zero<R extends number, C extends number>(x: {
    rows: R;
    columns: C;
  }): Matrix<R, C> {
    return this.withProvider(x, () => 0);
  }

  static identity<N extends number>(n: N): Matrix<N, N> {
    return this.withProvider({ rows: n, columns: n }, ({ row, column }) =>
      row === column ? 1 : 0
    );
  }

  static rowVec<N extends number>(v: VecN<N>): Matrix<1, N> {
    return this.withProvider({ rows: 1, columns: v.length }, ({ column }) => {
      return v[column];
    });
  }

  static columnVec<N extends number>(v: VecN<N>): Matrix<N, 1> {
    return new Matrix([v]) as Matrix<N, 1>;
  }

  get columnMajorComponents(): ComponentsTuple<R, C> {
    return this.data.reduce((a, b) => a.concat(b), [] as number[]) as ComponentsTuple<R, C>
  }

  atColumnRow(column : number, row : number): number {
    return this.columnAtIndex(column)[row];
  }

  at(x: { row: number; column: number }): number {
    return this.atColumnRow(x.column, x.row);
  }

  columnAtIndex(column: number): NVec<R, number> {
    return this.data[column];
  }

  rowAtIndex(row: number): NVec<C, number> {
    return NVecMap(this.data, (_, column) => {
      return this.at({ row, column });
    });
  }

  add(other: Matrix<R, C>) {
    return Matrix.withProvider(this.size, (rc) => {
      return this.at(rc) + other.at(rc);
    });
  }

  sub(other: Matrix<R, C>) {
    return Matrix.withProvider(this.size, (rc) => {
      return this.at(rc) - other.at(rc);
    });
  }

  scalarMul(scalar: number) {
    return Matrix.withProvider(this.size, (rc) => {
      return this.at(rc) * scalar;
    });
  }

  transpose(): Matrix<C, R> {
    const { rows, columns } = this.size;
    return Matrix.withProvider<C, R>(
      { rows: columns, columns: rows },
      ({ row, column }) => {
        return this.at({ row: column, column: row });
      }
    );
  }

  mulVecN(vec: VecN<C>): VecN<R> {
    return Array.from({ length: this.size.rows }, (_, row) => {
      return VecNDot(this.rowAtIndex(row), vec);
    }) as unknown as VecN<R>;
  }

  mulVec2(this : Matrix<3, 3> | Matrix<2, 2>, v : Vec2): Vec2 {
    const components : VecN<C> = (this.size.rows === 2 ? v.components : [...v.components, 1]) as unknown as VecN<C>

    const res = this.mulVecN(components as any)
    return new Vec2(res[0], res[1])
  }

  mul<N extends number>(other: Matrix<C, N>) {
    return Matrix.withColumnProvider(
      { rows: this.size.rows, columns: other.size.columns },
      (column) => {
        const cVec = other.columnAtIndex(column);
        return this.mulVecN(cVec);
      }
    );
  }

  static viewportTransformation(
    source : Rect,
    dest : Rect,
  ): Matrix<3, 3> {
    const sourceLL = source.origin
    const sourceUR = source.farCorner

    const destLL = dest.origin
    const destUR = dest.farCorner

    const scale = destUR.sub(destLL).componentDiv(sourceUR.sub(sourceLL))
    
    const translate = destLL.sub(scale.componentMul(sourceLL))

    return new Matrix([
      [scale.x, 0, 0],
      [0, scale.y, 0],
      [translate.x, translate.y, 0]
    ] as const)
  }

  static fromDOMMatrix(m : DOMMatrix): Matrix<3, 3>  {
    return new Matrix([
      [m.a, m.b, 0],
      [m.c, m.d, 0],
      [m.e, m.f, 1]
    ] as const)
  }

  toDOMMatrix(this : Matrix<3, 3>): DOMMatrix {
    return new DOMMatrix([
      ...this.data[0], 0,
      ...this.data[1], 0,
      0, 0, 1, 0,
      ...this.data[2], 1,
    ])
  }
}
