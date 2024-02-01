import {
  Cursor,
  MQNode,
  Controller,
  DOMView,
  Direction,
  Fragment,
  LatexContext,
  MathCommand,
  MathspeakOptions,
  Parser,
  RootMathBlock,
} from '../bundle';
export declare class TextBlock extends MQNode {
  ctrlSeq: string;
  ariaLabel: string;
  replacedText?: string;
  anticursorPosition?: number;
  replaces(replacedText: Fragment | string): void;
  setDOMFrag(el: Element | undefined): this;
  createLeftOf(cursor: Cursor): void;
  parser(): Parser<Fragment | this>;
  textContents(): string;
  text(): string;
  latexRecursive(ctx: LatexContext): void;
  html(): HTMLElement;
  mathspeakTemplate: string[];
  mathspeak(opts?: MathspeakOptions): string;
  isTextBlock(): boolean;
  moveTowards(dir: Direction, cursor: Cursor): void;
  moveOutOf(dir: Direction, cursor: Cursor): void;
  unselectInto(dir: Direction, cursor: Cursor): void;
  selectTowards(dir: Direction, cursor: Cursor): void;
  deleteTowards(dir: Direction, cursor: Cursor): void;
  selectOutOf(dir: Direction, cursor: Cursor): void;
  deleteOutOf(_dir: Direction, cursor: Cursor): void;
  write(cursor: Cursor, ch: string): void;
  writeLatex(cursor: Cursor, latex: string): void;
  seek(clientX: number, cursor: Cursor): void;
  blur(cursor: Cursor): void;
  focus(): void;
}
export declare class RootMathCommand extends MathCommand {
  cursor: Cursor;
  constructor(cursor: Cursor);
  domView: DOMView;
  createBlocks(): void;
  latexRecursive(ctx: LatexContext): void;
}
export declare class RootTextBlock extends RootMathBlock {
  keystroke(key: string, e: KeyboardEvent, ctrlr: Controller): void;
  write(cursor: Cursor, ch: string): void;
}
//# sourceMappingURL=text.d.ts.map
