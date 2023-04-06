import { ExplicitFunction, ImplicitFunction } from "../Plotter"
import { Vec2 } from "./Vec2"

export const explictNumericDerivative = (x : number, fn : ExplicitFunction, dx : number) => {
  const x0 = x - dx/2
  const x1 = x + dx/2
  const y0 = fn(x0)
  const y1 = fn(x1)

  return (y1 - y0) / dx
}

export const implicitNumericDerivative = (p : Vec2, fn : ImplicitFunction, dx : number, dy : number) => {
  const {x, y} = p

  const df_dx = explictNumericDerivative(x, n => fn(x, n), dx)
  const df_dy = explictNumericDerivative(y, n => fn(n, y), dy)

  return -df_dx / df_dy
}