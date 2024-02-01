import {
  CharCmdsType,
  Cursor,
  CursorOptions,
  DOMFragment,
  Direction,
  InnerFields,
  InnerMathField,
  L,
  LatexCmdsType,
  LatexContext,
  MQNode,
  MQSelection,
  MathBlock,
  MathCommand,
  MathspeakOptions,
  NodeRef,
  Parser,
  R,
  TextBlock,
} from './bundle';
export declare class Point {
  [L]: NodeRef;
  [R]: NodeRef;
  parent: MQNode;
  constructor(parent: MQNode, leftward: NodeRef, rightward: NodeRef);
  init(parent: MQNode, leftward: NodeRef, rightward: NodeRef): void;
  static copy(pt: Point): Point;
}
export type Ends<T> = {
  readonly [L]: T;
  readonly [R]: T;
};
export declare class NodeBase {
  static idCounter: number;
  static uniqueNodeId(): number;
  static getNodeOfElement(el: Element | undefined): NodeBase | undefined;
  static linkElementByBlockNode(elm: Element, blockNode: NodeBase): void;
  static linkElementByCmdNode(
    elm: Element,
    cmdNode: MathCommand | TextBlock
  ): void;
  [L]: NodeRef;
  [R]: NodeRef;
  parent: MQNode;
  ends: Ends<NodeRef>;
  setEnds(ends: Ends<NodeRef>): void;
  getEnd(dir: Direction): NodeRef;
  _el: Element | Text | undefined;
  id: number;
  ctrlSeq: string | undefined;
  ariaLabel: string | undefined;
  textTemplate: string[] | undefined;
  mathspeakName: string | undefined;
  sides:
    | {
        [L]: {
          ch: string;
          ctrlSeq: string;
        };
        [R]: {
          ch: string;
          ctrlSeq: string;
        };
      }
    | undefined;
  blocks: MathBlock[] | undefined;
  mathspeakTemplate: string[] | undefined;
  upInto: MQNode | undefined;
  downInto: MQNode | undefined;
  upOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined);
  downOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined);
  isPartOfOperator: boolean | undefined;
  toString(): string;
  setDOM(el: Element | Text | undefined): this;
  domFrag(): DOMFragment;
  createDir(dir: Direction, cursor: Cursor): this;
  createLeftOf(cursor: Cursor): void;
  selectChildren(leftEnd: MQNode, rightEnd: MQNode): MQSelection;
  bubble(yield_: (ancestor: MQNode) => boolean | undefined): this;
  postOrder(yield_: (el: MQNode) => void): MQNode;
  isEmpty(): boolean;
  isQuietEmptyDelimiter(
    dlms:
      | {
          [id: string]: any;
        }
      | undefined
  ): boolean;
  isStyleBlock(): boolean;
  isTextBlock(): boolean;
  children(): Fragment;
  eachChild(yield_: (el: MQNode) => boolean | undefined | void): this;
  foldChildren<T>(fold: T, yield_: (fold: T, el: MQNode) => T): T;
  withDirAdopt(
    dir: Direction,
    parent: MQNode,
    withDir: NodeRef,
    oppDir: NodeRef
  ): this;
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef): MQNode;
  disown(): this;
  remove(): this;
  shouldIgnoreSubstitutionInSimpleSubscript(options: CursorOptions): boolean;
  getSelfNode(): MQNode;
  parser(): Parser<MQNode | Fragment>;
  html(): Node | DocumentFragment;
  text(): string;
  latex(): string;
  latexRecursive(_ctx: LatexContext): void;
  checkCursorContextOpen(ctx: LatexContext): void;
  checkCursorContextClose(ctx: LatexContext): void;
  finalizeTree(_options: CursorOptions, _dir?: Direction): void;
  contactWeld(_cursor: Cursor, _dir?: Direction): void;
  blur(_cursor?: Cursor): void;
  focus(): void;
  intentionalBlur(): void;
  reflow(): void;
  registerInnerField(
    _innerFields: InnerFields,
    _mathField: InnerMathField
  ): void;
  chToCmd(_ch: string, _options?: CursorOptions): this;
  mathspeak(_options?: MathspeakOptions): string;
  seek(_clientX: number, _cursor: Cursor): void;
  siblingDeleted(_options: CursorOptions, _dir: Direction): void;
  siblingCreated(_options: CursorOptions, _dir: Direction): void;
  finalizeInsert(_options: CursorOptions, _cursor: Cursor): void;
  fixDigitGrouping(_opts: CursorOptions): void;
  writeLatex(_cursor: Cursor, _latex: string): void;
  write(_cursor: Cursor, _ch: string): void;
}
export declare class Fragment {
  ends: Ends<NodeRef>;
  disowned: boolean;
  constructor(withDir: NodeRef, oppDir: NodeRef, dir?: Direction);
  getDOMFragFromEnds(): DOMFragment;
  setEnds(ends: Ends<NodeRef>): void;
  getEnd(dir: Direction): NodeRef;
  domFrag(): DOMFragment;
  withDirAdopt(
    dir: Direction,
    parent: MQNode,
    withDir: NodeRef,
    oppDir: NodeRef
  ): this;
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef): this;
  disown(): this;
  remove(): this;
  each(yield_: (el: MQNode) => boolean | undefined | void): this;
  fold<T>(fold: T, yield_: (fold: T, el: MQNode) => T): T;
}
export declare var LatexCmds: LatexCmdsType;
export declare var CharCmds: CharCmdsType;
export declare function isMQNodeClass(cmd: any): cmd is typeof MQNode;
//# sourceMappingURL=tree.d.ts.map
