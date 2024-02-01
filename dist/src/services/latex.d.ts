import { Controller_keystroke, MQNode, MathBlock, Parser } from '../bundle';
export declare class TempSingleCharNode extends MQNode {
  constructor(_char: string);
}
export declare var latexMathParser: Parser<MathBlock> & {
  block: Parser<MathBlock>;
  optBlock: Parser<MathBlock>;
};
export declare class Controller_latex extends Controller_keystroke {
  cleanLatex(latex: string): string;
  exportLatex(): string;
  writeLatex(latex: string): this;
  exportLatexSelection(): {
    latex: string;
    startIndex: number;
    endIndex: number;
  };
  classifyLatexForEfficientUpdate(latex: unknown):
    | {
        latex: string;
        prefix: string;
        digits: string;
      }
    | undefined;
  updateLatexMathEfficiently(latex: unknown, oldLatex: unknown): boolean;
  renderLatexMathFromScratch(latex: unknown): void;
  renderLatexMath(latex: unknown): void;
  renderLatexText(latex: string): void;
}
//# sourceMappingURL=latex.d.ts.map
