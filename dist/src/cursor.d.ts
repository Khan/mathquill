import {
  Controller,
  ControllerBase,
  CursorOptions,
  DOMFragment,
  Direction,
  Ends,
  Fragment,
  JoinMethod,
  MQNode,
  NodeRef,
  Point,
} from './bundle';
export declare class Anticursor extends Point {
  ancestors: Record<string | number, Anticursor | MQNode | undefined>;
  constructor(parent: MQNode, leftward: NodeRef, rightward: NodeRef);
  static fromCursor(cursor: Cursor): Anticursor;
}
export declare class Cursor extends Point {
  controller: Controller;
  parent: MQNode;
  options: CursorOptions;
  upDownCache: Record<number | string, Point | undefined>;
  blink: () => void;
  readonly cursorElement: HTMLElement;
  _domFrag: DOMFragment;
  selection: MQSelection | undefined;
  intervalId: number;
  anticursor: Anticursor | undefined;
  constructor(
    initParent: MQNode,
    options: CursorOptions,
    controller: Controller
  );
  setDOMFrag(frag: DOMFragment): this;
  domFrag(): DOMFragment;
  show(): this;
  hide(): this;
  withDirInsertAt(
    dir: Direction,
    parent: MQNode,
    withDir: NodeRef,
    oppDir: NodeRef
  ): void;
  insDirOf(dir: Direction, el: MQNode): this;
  insLeftOf(el: MQNode): this;
  insRightOf(el: MQNode): this;
  insAtDirEnd(dir: Direction, el: MQNode): this;
  insAtLeftEnd(el: MQNode): this;
  insAtRightEnd(el: MQNode): this;
  jumpUpDown(from: MQNode, to: MQNode): void;
  getBoundingClientRectWithoutMargin(): {
    left: number;
    right: number;
  };
  unwrapGramp(): void;
  startSelection(): void;
  endSelection(): void;
  select(): boolean;
  resetToEnd(controller: ControllerBase): void;
  clearSelection(): this;
  deleteSelection(): void;
  replaceSelection(): MQSelection | undefined;
  depth(): number;
  isTooDeep(offset?: number): boolean;
  selectionChanged(): void;
}
export declare class MQSelection extends Fragment {
  ends: Ends<MQNode>;
  _el: HTMLElement | undefined;
  constructor(withDir: MQNode, oppDir: MQNode, dir?: Direction);
  isCleared(): boolean;
  domFrag(): DOMFragment;
  setEnds(ends: Ends<MQNode>): void;
  getEnd(dir: Direction): MQNode;
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef): this;
  clear(): this;
  join(methodName: JoinMethod, separator?: string): string;
}
//# sourceMappingURL=cursor.d.ts.map
