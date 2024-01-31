import { MathBlock, VanillaSymbol } from 'src/commands/math';
import { Controller_keystroke, MQNode } from './keystroke';
import { Fragment, LatexCmds } from 'src/tree';
import { LatexCmdsSingleChar, LatexContext } from 'src/shared_types';
import { R, L } from 'src/utils';
import { Parser } from './parser.util';
import { Digit, Letter, PlusMinus } from 'src/commands/math/basicSymbols';
import { domFrag } from 'src/domFragment';
import { baseOptionProcessors } from 'src/publicapi';
import { RootMathCommand } from 'src/commands/text';

export class TempSingleCharNode extends MQNode {
  constructor(_char: string) {
    super();
  }
}

// Parser MathBlock
export const latexMathParser = (function () {
  function commandToBlock(cmd: MQNode | Fragment): MathBlock {
    // can also take in a Fragment
    const block = new MathBlock();
    cmd.adopt(block, 0, 0);
    return block;
  }
  function joinBlocks(blocks: MathBlock[]) {
    const firstBlock = blocks[0] || new MathBlock();

    for (let i = 1; i < blocks.length; i += 1) {
      blocks[i].children().adopt(firstBlock, firstBlock.getEnd(R), 0);
    }

    return firstBlock;
  }

  const string = Parser.string;
  const regex = Parser.regex;
  const letter = Parser.letter;
  const digit = Parser.digit;
  const any = Parser.any;
  const optWhitespace = Parser.optWhitespace;
  const succeed = Parser.succeed;
  const fail = Parser.fail;

  // Parsers yielding either MathCommands, or Fragments of MathCommands
  //   (either way, something that can be adopted by a MathBlock)
  const variable = letter.map(function (c) {
    return new Letter(c);
  });
  const number = digit.map(function (c) {
    return new Digit(c);
  });
  const symbol = regex(/^[^${}\\_^]/).map(function (c) {
    return new VanillaSymbol(c);
  });

  const controlSequence = regex(/^[^\\a-eg-zA-Z]/) // hotfix #164; match MathBlock::write
    .or(
      string('\\').then(
        regex(/^[a-z]+/i)
          .or(regex(/^\s+/).result(' '))
          .or(any)
      )
    )
    .then(function (ctrlSeq) {
      // TODO - is Parser<MQNode> correct?
      const cmdKlass = (LatexCmds as LatexCmdsSingleChar)[ctrlSeq];

      if (cmdKlass) {
        if (cmdKlass.constructor) {
          const actualClass = cmdKlass as typeof TempSingleCharNode; // TODO - figure out how to know the difference
          return new actualClass(ctrlSeq).parser();
        } else {
          const builder = cmdKlass as (c: string) => TempSingleCharNode; // TODO - figure out how to know the difference
          return builder(ctrlSeq).parser();
        }
      } else {
        return fail('unknown command: \\' + ctrlSeq);
      }
    });
  const command = controlSequence.or(variable).or(number).or(symbol);
  // Parsers yielding MathBlocks
  const mathGroup: Parser<MathBlock> = string('{')
    .then(function () {
      return mathSequence;
    })
    .skip(string('}'));
  const mathBlock = optWhitespace.then(
    mathGroup.or(command.map(commandToBlock))
  );
  const mathSequence = mathBlock.many().map(joinBlocks).skip(optWhitespace);

  const optMathBlock = string('[')
    .then(
      mathBlock
        .then(function (block) {
          return block.join('latex') !== ']' ? succeed(block) : fail('');
        })
        .many()
        .map(joinBlocks)
        .skip(optWhitespace)
    )
    .skip(string(']'));
  const latexMath: typeof mathSequence & {
    block: typeof mathBlock;
    optBlock: typeof optMathBlock;
  } = mathSequence as any;

  latexMath.block = mathBlock;
  latexMath.optBlock = optMathBlock;
  return latexMath;
})();

baseOptionProcessors.maxDepth = function (depth: number | undefined) {
  return typeof depth === 'number' ? depth : undefined;
};

export class Controller_latex extends Controller_keystroke {
  cleanLatex(latex: string) {
    //prune unnecessary spaces
    return latex.replace(/(\\[a-z]+) (?![a-z])/gi, '$1');
  }
  exportLatex() {
    return this.cleanLatex(this.root.latex());
  }
  writeLatex(latex: string) {
    const cursor = this.notify('edit').cursor;
    cursor.parent.writeLatex(cursor, latex);

    return this;
  }
  exportLatexSelection() {
    const ctx: LatexContext = {
      latex: '',
      startIndex: -1,
      endIndex: -1,
    };

    const selection = this.cursor.selection;
    if (selection) {
      ctx.startSelectionBefore = selection.getEnd(L);
      ctx.endSelectionAfter = selection.getEnd(R);
    } else {
      const cursorL = this.cursor[L];
      if (cursorL) {
        ctx.startSelectionAfter = cursorL;
      } else {
        ctx.startSelectionBefore = this.cursor.parent;
      }

      const cursorR = this.cursor[R];
      if (cursorR) {
        ctx.endSelectionBefore = cursorR;
      } else {
        ctx.endSelectionAfter = this.cursor.parent;
      }
    }

    this.root.latexRecursive(ctx);

    // need to clean the latex
    const originalLatex = ctx.latex;
    const cleanLatex = this.cleanLatex(originalLatex);
    let startIndex = ctx.startIndex;
    let endIndex = ctx.endIndex;

    // assumes that the cleaning process will only remove characters. We
    // run through the originalLatex and cleanLatex to find differences.
    // when we find differences we see how many characters are dropped until
    // we sync back up. While detecting missing characters we decrement the
    // startIndex and endIndex if appropriate.
    let j = 0;
    for (let i = 0; i < ctx.endIndex; i++) {
      if (originalLatex[i] !== cleanLatex[j]) {
        if (i < ctx.startIndex) {
          startIndex -= 1;
        }
        endIndex -= 1;

        // do not increment j. We wan to keep looking at this same
        // cleanLatex character until we find it in the originalLatex
      } else {
        j += 1; //move to next cleanLatex character
      }
    }

    return {
      latex: cleanLatex,
      startIndex: startIndex,
      endIndex: endIndex,
    };
  }

  classifyLatexForEfficientUpdate(latex: unknown) {
    if (typeof latex !== 'string') return;

    const matches = latex.match(/-?[0-9.]+$/g);
    if (matches && matches.length === 1) {
      return {
        latex: latex,
        prefix: latex.substr(0, latex.length - matches[0].length),
        digits: matches[0],
      };
    }

    return;
  }
  private updateLatexMathEfficiently(latex: unknown, oldLatex: unknown) {
    // Note, benchmark/update.html is useful for measuring the
    // performance of renderLatexMathEfficiently
    const root = this.root;
    let oldClassification;
    const classification = this.classifyLatexForEfficientUpdate(latex);
    if (classification) {
      oldClassification = this.classifyLatexForEfficientUpdate(oldLatex);
      if (
        !oldClassification ||
        oldClassification.prefix !== classification.prefix
      ) {
        return false;
      }
    } else {
      return false;
    }

    // check if minus sign is changing
    let oldDigits = oldClassification.digits;
    let newDigits = classification.digits;
    let oldMinusSign = false;
    let newMinusSign = false;
    if (oldDigits[0] === '-') {
      oldMinusSign = true;
      oldDigits = oldDigits.substr(1);
    }
    if (newDigits[0] === '-') {
      newMinusSign = true;
      newDigits = newDigits.substr(1);
    }

    // start at the very end
    let charNode = this.root.getEnd(R);
    const oldCharNodes = [];
    for (let i = oldDigits.length - 1; i >= 0; i--) {
      // the tree does not match what we expect
      if (!charNode || charNode.ctrlSeq !== oldDigits[i]) {
        return false;
      }

      // the trailing digits are not just under the root. We require the root
      // to be the parent so that we can be sure we do not need a reflow to
      // grow parens.
      if (charNode.parent !== root) {
        return false;
      }

      // push to the start. We're traversing backwards
      oldCharNodes.unshift(charNode);

      // move left one character
      charNode = charNode[L];
    }

    // remove the minus sign
    if (oldMinusSign && !newMinusSign) {
      const oldMinusNode = charNode;
      if (!oldMinusNode) return false;
      if (oldMinusNode.ctrlSeq !== '-') return false;
      if (oldMinusNode[R] !== oldCharNodes[0]) return false;
      if (oldMinusNode.parent !== root) return false;

      const oldMinusNodeL = oldMinusNode[L];
      if (oldMinusNodeL && oldMinusNodeL.parent !== root) return false;

      oldCharNodes[0][L] = oldMinusNode[L];

      if (root.getEnd(L) === oldMinusNode) {
        root.setEnds({ [L]: oldCharNodes[0], [R]: root.getEnd(R) });
      }
      if (oldMinusNodeL) oldMinusNodeL[R] = oldCharNodes[0];

      oldMinusNode.domFrag().remove();
    }

    // add a minus sign
    if (!oldMinusSign && newMinusSign) {
      const newMinusNode = new PlusMinus('-');
      const minusSpan = document.createElement('span');
      minusSpan.textContent = '-';
      newMinusNode.setDOM(minusSpan);

      const oldCharNodes0L = oldCharNodes[0][L];
      if (oldCharNodes0L) oldCharNodes0L[R] = newMinusNode;
      if (root.getEnd(L) === oldCharNodes[0]) {
        root.setEnds({ [L]: newMinusNode, [R]: root.getEnd(R) });
      }

      newMinusNode.parent = root;
      newMinusNode[L] = oldCharNodes[0][L];
      newMinusNode[R] = oldCharNodes[0];
      oldCharNodes[0][L] = newMinusNode;

      newMinusNode.contactWeld(this.cursor); // decide if binary operator
      newMinusNode.domFrag().insertBefore(oldCharNodes[0].domFrag());
    }

    // update the text of the current nodes
    const commonLength = Math.min(oldDigits.length, newDigits.length);
    for (let i = 0; i < commonLength; i++) {
      const newText = newDigits[i];
      charNode = oldCharNodes[i];
      if (charNode.ctrlSeq !== newText) {
        charNode.ctrlSeq = newText;
        charNode.domFrag().oneElement().textContent = newText;
        charNode.mathspeakName = newText;
      }
    }

    // remove the extra digits at the end
    if (oldDigits.length > newDigits.length) {
      charNode = oldCharNodes[newDigits.length - 1];
      root.setEnds({ [L]: root.getEnd(L), [R]: charNode });
      charNode[R] = 0;

      for (let i = oldDigits.length - 1; i >= commonLength; i--) {
        oldCharNodes[i].domFrag().remove();
      }
    }

    // add new digits after the existing ones
    if (newDigits.length > oldDigits.length) {
      const frag = document.createDocumentFragment();

      for (let i = commonLength; i < newDigits.length; i++) {
        const span = document.createElement('span');
        span.className = 'mq-digit';
        span.textContent = newDigits[i];

        const newNode = new Digit(newDigits[i]);
        newNode.parent = root;
        newNode.setDOM(span);
        frag.appendChild(span);

        // splice this node in
        newNode[L] = root.getEnd(R);
        newNode[R] = 0;

        const newNodeL = newNode[L] as MQNode;
        newNodeL[R] = newNode;
        root.setEnds({ [L]: root.getEnd(L), [R]: newNode });
      }

      root.domFrag().oneElement().appendChild(frag);
    }

    const currentLatex = this.exportLatex();
    if (currentLatex !== latex) {
      console.warn(
        'tried updating latex efficiently but did not work. Attempted: ' +
          latex +
          ' but wrote: ' +
          currentLatex
      );
      return false;
    }

    const rightMost = root.getEnd(R);
    if (rightMost) {
      rightMost.fixDigitGrouping(this.cursor.options);
    }

    return true;
  }
  private renderLatexMathFromScratch(latex: unknown) {
    const root = this.root,
      cursor = this.cursor;
    const all = Parser.all;
    const eof = Parser.eof;

    const block = latexMathParser
      .skip(eof)
      .or(all.result<false>(false))
      .parse(latex);

    root.setEnds({ [L]: 0, [R]: 0 });

    if (block) {
      block.children().adopt(root, 0, 0);
    }

    if (block) {
      const frag = root.domFrag();
      frag.children().remove();
      frag.oneElement().appendChild(block.html());
      root.finalizeInsert(cursor.options, cursor);
    } else {
      root.domFrag().empty();
    }
  }
  renderLatexMath(latex: unknown) {
    const cursor = this.cursor;
    const root = this.root;
    this.notify('replace');
    cursor.clearSelection();
    const oldLatex = this.exportLatex();
    if (!root.getEnd(L) || !root.getEnd(R) || oldLatex !== latex) {
      this.updateLatexMathEfficiently(latex, oldLatex) ||
        this.renderLatexMathFromScratch(latex);
      this.updateMathspeak();
    }
    cursor.insAtRightEnd(root);
  }
  renderLatexText(latex: string) {
    const root = this.root,
      cursor = this.cursor;

    root.domFrag().children().slice(1).remove();
    root.setEnds({ [L]: 0, [R]: 0 });
    delete cursor.selection;
    cursor.show().insAtRightEnd(root);

    const regex = Parser.regex;
    const string = Parser.string;
    const eof = Parser.eof;
    const all = Parser.all;

    // Parser RootMathCommand
    const mathMode = string('$')
      .then(latexMathParser)
      // because TeX is insane, math mode doesn't necessarily
      // have to end.  So we allow for the case that math mode
      // continues to the end of the stream.
      .skip(string('$').or(eof))
      .map(function (block) {
        // HACK FIXME: this shouldn't have to have access to cursor
        const rootMathCommand = new RootMathCommand(cursor);

        rootMathCommand.createBlocks();
        const rootMathBlock = rootMathCommand.getEnd(L);
        block.children().adopt(rootMathBlock as MQNode, 0, 0);

        return rootMathCommand;
      });
    const escapedDollar = string('\\$').result('$');
    const textChar = escapedDollar
      .or(regex(/^[^$]/))
      .map((ch) => new VanillaSymbol(ch));
    const latexText = mathMode.or(textChar).many();
    const commands = latexText
      .skip(eof)
      .or(all.result<false>(false))
      .parse(latex);

    if (commands) {
      for (let i = 0; i < commands.length; i += 1) {
        commands[i].adopt(root, root.getEnd(R), 0);
      }

      domFrag(root.html()).appendTo(root.domFrag().oneElement());

      root.finalizeInsert(cursor.options, cursor);
    }
  }
}
