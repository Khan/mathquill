import { NodeRef } from './bundle';
type L = -1;
type R = 1;
export declare var L: L;
export declare var R: R;
export type Direction = L | R;
export declare var min: (...values: number[]) => number;
export declare var max: (...values: number[]) => number;
export declare function noop(): void;
export declare function pray(
  message: string,
  cond?: unknown,
  optionalContextNodes?: Record<string, NodeRef>
): asserts cond;
export declare function prayDirection(dir: Direction): void;
export {};
//# sourceMappingURL=utils.d.ts.map
