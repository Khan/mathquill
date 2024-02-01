import {
  Controller,
  Cursor,
  CursorOptions,
  Direction,
  Ends,
  Fragment,
  JoinMethod,
  LatexContext,
  MQNode,
  MQSelection,
  MathspeakOptions,
  Parser,
} from '../bundle';
export declare class MathElement extends MQNode {
  finalizeInsert(options: CursorOptions, cursor: Cursor): void;
  prepareInsertionAt(cursor: Cursor): boolean;
  removeNodesDeeperThan(cutoff: number): void;
}
export declare class DOMView {
  readonly childCount: number;
  readonly render: (blocks: MathBlock[]) => Element;
  constructor(childCount: number, render: (blocks: MathBlock[]) => Element);
}
export declare class MathCommand extends MathElement {
  replacedFragment: Fragment | undefined;
  domView: DOMView;
  ends: Ends<MQNode>;
  constructor(ctrlSeq?: string, domView?: DOMView, textTemplate?: string[]);
  setEnds(ends: Ends<MQNode>): void;
  getEnd(dir: Direction): MQNode;
  setCtrlSeqHtmlAndText(
    ctrlSeq?: string,
    domView?: DOMView,
    textTemplate?: string[]
  ): void;
  replaces(replacedFragment: Fragment): void;
  isEmpty(): boolean;
  parser(): Parser<MQNode | Fragment>;
  createLeftOf(cursor: Cursor): void;
  createBlocks(): void;
  placeCursor(cursor: Cursor): void;
  moveTowards(dir: Direction, cursor: Cursor, updown?: 'up' | 'down'): void;
  deleteTowards(dir: Direction, cursor: Cursor): void;
  selectTowards(dir: Direction, cursor: Cursor): void;
  selectChildren(): MQSelection;
  unselectInto(dir: Direction, cursor: Cursor): void;
  seek(clientX: number, cursor: Cursor): Cursor | undefined;
  numBlocks(): number;
  html(): Element | DocumentFragment;
  latexRecursive(ctx: LatexContext): void;
  textTemplate: string[];
  text(): string;
  mathspeakTemplate: string[];
  mathspeak(): string;
}
export declare class MQSymbol extends MathCommand {
  constructor(
    ctrlSeq?: string,
    html?: HTMLElement,
    text?: string,
    mathspeak?: string
  );
  setCtrlSeqHtmlTextAndMathspeak(
    ctrlSeq?: string,
    html?: DOMView,
    text?: string,
    mathspeak?: string
  ): void;
  parser(): Parser<MQNode | Fragment>;
  numBlocks(): 0;
  replaces(replacedFragment: Fragment): void;
  createBlocks(): void;
  moveTowards(dir: Direction, cursor: Cursor): void;
  deleteTowards(dir: Direction, cursor: Cursor): void;
  seek(clientX: number, cursor: Cursor): Cursor;
  latexRecursive(ctx: LatexContext): void;
  text(): string;
  mathspeak(_opts?: MathspeakOptions): string;
  placeCursor(): void;
  isEmpty(): boolean;
}
export declare class VanillaSymbol extends MQSymbol {
  constructor(ch: string, html?: ChildNode, mathspeak?: string);
}
export declare function bindVanillaSymbol(
  ch: string,
  htmlEntity?: string,
  mathspeak?: string
): () => VanillaSymbol;
export declare class BinaryOperator extends MQSymbol {
  constructor(
    ctrlSeq?: string,
    html?: ChildNode,
    text?: string,
    mathspeak?: string,
    treatLikeSymbol?: boolean
  );
}
export declare function bindBinaryOperator(
  ctrlSeq?: string,
  htmlEntity?: string,
  text?: string,
  mathspeak?: string
): () => BinaryOperator;
export declare class MathBlock extends MathElement {
  controller?: Controller;
  join(methodName: JoinMethod): string;
  html(): DocumentFragment;
  latexRecursive(ctx: LatexContext): void;
  text(): string;
  mathspeak(): string;
  ariaLabel: string;
  keystroke(key: string, e: KeyboardEvent | undefined, ctrlr: Controller): void;
  moveOutOf(dir: Direction, cursor: Cursor, updown?: 'up' | 'down'): void;
  selectOutOf(dir: Direction, cursor: Cursor): void;
  deleteOutOf(_dir: Direction, cursor: Cursor): void;
  seek(clientX: number, cursor: Cursor): void | Cursor;
  chToCmd(ch: string, options: CursorOptions): any;
  write(cursor: Cursor, ch: string): void;
  writeLatex(cursor: Cursor, latex: string): void;
  focus(): this;
  blur(cursor: Cursor): this;
}
export declare class RootMathBlock extends MathBlock {}
//# sourceMappingURL=math.d.ts.map
