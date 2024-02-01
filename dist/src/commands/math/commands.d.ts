import {
  BracketSide,
  Cursor,
  CursorOptions,
  DOMFragment,
  DOMView,
  Direction,
  EmbedOptions,
  Ends,
  L,
  LatexContext,
  MQSymbol,
  MathBlock,
  MathCommand,
  MathspeakOptions,
  NodeRef,
  Parser,
  R,
} from '../../bundle';
export declare class SupSub extends MathCommand {
  ctrlSeq: string;
  sub?: MathBlock;
  sup?: MathBlock;
  supsub: 'sup' | 'sub';
  ends: Ends<MathBlock>;
  setEnds(ends: Ends<MathBlock>): void;
  getEnd(dir: Direction): MathBlock;
  createLeftOf(cursor: Cursor): void;
  contactWeld(cursor: Cursor): void;
  finalizeTree(): void;
  moveTowards(dir: Direction, cursor: Cursor, updown?: 'up' | 'down'): void;
  deleteTowards(dir: Direction, cursor: Cursor): void;
  latexRecursive(ctx: LatexContext): void;
  text(): string;
  addBlock(block: MathBlock): void;
}
export declare class SubscriptCommand extends SupSub {
  supsub: 'sub';
  domView: DOMView;
  textTemplate: string[];
  mathspeakTemplate: string[];
  ariaLabel: string;
  finalizeTree(): void;
}
export declare class SummationNotation extends MathCommand {
  constructor(ch: string, symbol: string, ariaLabel?: string);
  createLeftOf(cursor: Cursor): void;
  latexRecursive(ctx: LatexContext): void;
  mathspeak(): string;
  parser(): Parser<this>;
  finalizeTree(): void;
}
export declare var AnsBuilder: () => MQSymbol;
export declare var PercentOfBuilder: () => MQSymbol;
declare class DelimsNode extends MathCommand {
  delimFrags: Ends<DOMFragment>;
  setDOM(el: Element | undefined): this;
}
export declare class Bracket extends DelimsNode {
  side: BracketSide;
  sides: {
    [L]: {
      ch: string;
      ctrlSeq: string;
    };
    [R]: {
      ch: string;
      ctrlSeq: string;
    };
  };
  constructor(
    side: BracketSide,
    open: string,
    close: string,
    ctrlSeq: string,
    end: string
  );
  numBlocks(): 1;
  html(): Element | DocumentFragment;
  getSymbol(side: BracketSide):
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      }
    | {
        width: string;
        html: () => SVGElement;
      };
  latexRecursive(ctx: LatexContext): void;
  mathspeak(opts?: MathspeakOptions): string;
  matchBrack(
    opts: CursorOptions,
    expectedSide: BracketSide,
    node: NodeRef | undefined
  ): false | 0 | Bracket;
  closeOpposing(brack: Bracket): void;
  createLeftOf(cursor: Cursor): void;
  placeCursor(): void;
  unwrap(): void;
  deleteSide(side: Direction, outward: boolean, cursor: Cursor): void;
  replaceBracket(brackFrag: DOMFragment, side: BracketSide): void;
  deleteTowards(dir: Direction, cursor: Cursor): void;
  finalizeTree(): void;
  siblingCreated(_opts: CursorOptions, dir: Direction): void;
}
export declare class EmbedNode extends MQSymbol {
  setOptions(options: EmbedOptions): this;
  latexRecursive(ctx: LatexContext): void;
  parser(): Parser<this>;
}
export {};
//# sourceMappingURL=commands.d.ts.map
