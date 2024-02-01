import {
  BinaryOperator,
  Cursor,
  CursorOptions,
  DOMView,
  Direction,
  Fragment,
  MQNode,
  MQSymbol,
  MathBlock,
  MathCommand,
  MathspeakOptions,
  NodeRef,
  Options,
  Parser,
} from '../../bundle';
declare class DigitGroupingChar extends MQSymbol {
  finalizeTree(opts: CursorOptions, dir: Direction): void;
  siblingDeleted(opts: CursorOptions, dir: Direction): void;
  siblingCreated(opts: CursorOptions, dir: Direction): void;
  sharedSiblingMethod(opts: CursorOptions, dir: Direction): void;
  fixDigitGrouping(opts: CursorOptions): void;
  removeGroupingBetween(left: NodeRef, right: NodeRef): void;
  addGroupingBetween(start: NodeRef, end: NodeRef): void;
  _groupingClass?: string;
  setGroupingClass(cls: string | undefined): void;
}
export declare class Digit extends DigitGroupingChar {
  constructor(ch: string, mathspeak?: string);
  createLeftOf(cursor: Cursor): void;
  mathspeak(opts: MathspeakOptions): string;
}
declare class letiable extends MQSymbol {
  isItalic?: boolean;
  constructor(chOrCtrlSeq: string, html?: ChildNode);
  text(): string;
  mathspeak(): string;
}
export declare class Letter extends letiable {
  letter: string;
  constructor(ch: string);
  checkAutoCmds(cursor: Cursor): void;
  autoParenthesize(cursor: Cursor): void;
  createLeftOf(cursor: Cursor): void;
  italicize(bool: boolean): this;
  finalizeTree(opts: CursorOptions, dir: Direction): void;
  siblingDeleted(opts: CursorOptions, dir: Direction): void;
  siblingCreated(opts: CursorOptions, dir: Direction): void;
  sharedSiblingMethod(opts: CursorOptions, dir: Direction): void;
  autoUnItalicize(opts: CursorOptions): void;
  shouldOmitPadding(node: NodeRef): boolean;
}
export declare class LatexFragment extends MathCommand {
  latexStr: string;
  constructor(latex: string);
  createLeftOf(cursor: Cursor): void;
  mathspeak(): string;
  parser(): Parser<Fragment>;
}
export declare var PlusMinus: {
  new (ch?: string, html?: ChildNode, mathspeak?: string): {
    contactWeld(cursor: Cursor, dir?: Direction): void;
    siblingCreated(opts: CursorOptions, dir: Direction): void;
    siblingDeleted(opts: CursorOptions, dir: Direction): void;
    sharedSiblingMethod(
      _opts?: CursorOptions,
      dir?: Direction
    ): any | undefined;
    setCtrlSeqHtmlTextAndMathspeak(
      ctrlSeq?: string | undefined,
      html?: DOMView | undefined,
      text?: string | undefined,
      mathspeak?: string | undefined
    ): void;
    parser(): Parser<MQNode | Fragment>;
    numBlocks(): 0;
    replaces(replacedFragment: Fragment): void;
    createBlocks(): void;
    moveTowards(dir: Direction, cursor: Cursor): void;
    deleteTowards(dir: Direction, cursor: Cursor): void;
    seek(clientX: number, cursor: Cursor): Cursor;
    latexRecursive(ctx: import('../../shared_types').LatexContext): void;
    text(): string;
    mathspeak(_opts?: MathspeakOptions | undefined): string;
    placeCursor(): void;
    isEmpty(): boolean;
    replacedFragment: Fragment | undefined;
    domView: DOMView;
    ends: import('../../tree').Ends<MQNode>;
    setEnds(ends: import('../../tree').Ends<MQNode>): void;
    getEnd(dir: Direction): MQNode;
    setCtrlSeqHtmlAndText(
      ctrlSeq?: string | undefined,
      domView?: DOMView | undefined,
      textTemplate?: string[] | undefined
    ): void;
    createLeftOf(cursor: Cursor): void;
    selectTowards(dir: Direction, cursor: Cursor): void;
    selectChildren(): import('../../cursor').MQSelection;
    unselectInto(dir: Direction, cursor: Cursor): void;
    html(): Element | DocumentFragment;
    textTemplate: string[];
    mathspeakTemplate: string[];
    finalizeInsert(options: Options, cursor: Cursor): void;
    prepareInsertionAt(cursor: Cursor): boolean;
    removeNodesDeeperThan(cutoff: number): void;
    keystroke(
      key: string,
      e: KeyboardEvent | undefined,
      ctrlr: import('../../bundle').Controller
    ): void;
    moveOutOf(
      _dir: Direction,
      _cursor: Cursor,
      _updown?: 'up' | 'down' | undefined
    ): void;
    deleteOutOf(_dir: Direction, _cursor: Cursor): void;
    selectOutOf(_dir: Direction, _cursor: Cursor): void;
    parent: MQNode;
    _el: Element | Text | undefined;
    id: number;
    ctrlSeq: string | undefined;
    ariaLabel: string | undefined;
    mathspeakName: string | undefined;
    sides:
      | {
          [-1]: {
            ch: string;
            ctrlSeq: string;
          };
          1: {
            ch: string;
            ctrlSeq: string;
          };
        }
      | undefined;
    blocks: MathBlock[] | undefined;
    upInto: MQNode | undefined;
    downInto: MQNode | undefined;
    upOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined) | undefined;
    downOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined) | undefined;
    isPartOfOperator: boolean | undefined;
    toString(): string;
    setDOM(el: Element | Text | undefined): any;
    domFrag(): import('../../domFragment').DOMFragment;
    createDir(dir: Direction, cursor: Cursor): any;
    bubble(yield_: (ancestor: MQNode) => boolean | undefined): any;
    postOrder(yield_: (el: MQNode) => void): MQNode;
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
    eachChild(yield_: (el: MQNode) => boolean | void | undefined): any;
    foldChildren<T>(fold: T, yield_: (fold: T, el: MQNode) => T): T;
    withDirAdopt(
      dir: Direction,
      parent: MQNode,
      withDir: NodeRef,
      oppDir: NodeRef
    ): any;
    adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef): MQNode;
    disown(): any;
    remove(): any;
    shouldIgnoreSubstitutionInSimpleSubscript(options: Options): boolean;
    getSelfNode(): MQNode;
    latex(): string;
    checkCursorContextOpen(
      ctx: import('../../shared_types').LatexContext
    ): void;
    checkCursorContextClose(
      ctx: import('../../shared_types').LatexContext
    ): void;
    finalizeTree(_options: Options, _dir?: Direction | undefined): void;
    blur(_cursor?: Cursor | undefined): void;
    focus(): void;
    intentionalBlur(): void;
    reflow(): void;
    registerInnerField(_innerFields: any, _mathField: any): void;
    chToCmd(_ch: string, _options?: Options | undefined): any;
    fixDigitGrouping(_opts: Options): void;
    writeLatex(_cursor: Cursor, _latex: string): void;
    write(_cursor: Cursor, _ch: string): void;
    [-1]: NodeRef;
    1: NodeRef;
  };
  idCounter: number;
  uniqueNodeId(): number;
  getNodeOfElement(
    el: Element | undefined
  ): import('../../tree').NodeBase | undefined;
  linkElementByBlockNode(
    elm: Element,
    blockNode: import('../../tree').NodeBase
  ): void;
  linkElementByCmdNode(
    elm: Element,
    cmdNode: MathCommand | import('../text').TextBlock
  ): void;
};
export declare class Equality extends BinaryOperator {
  constructor();
  createLeftOf(cursor: Cursor): void;
}
export {};
//# sourceMappingURL=basicSymbols.d.ts.map
