import {
  Controller_keystroke,
  Digit,
  L,
  LatexCmds,
  Letter,
  MQNode,
  MathBlock,
  Parser,
  PlusMinus,
  R,
  RootMathCommand,
  VanillaSymbol,
  baseOptionProcessors,
  domFrag,
} from '../bundle';
export class TempSingleCharNode extends MQNode {
  constructor(_char) {
    super();
  }
}
export var latexMathParser = (function () {
  function commandToBlock(cmd) {
    var block = new MathBlock();
    cmd.adopt(block, 0, 0);
    return block;
  }
  function joinBlocks(blocks) {
    var firstBlock = blocks[0] || new MathBlock();
    for (var i = 1; i < blocks.length; i += 1) {
      blocks[i].children().adopt(firstBlock, firstBlock.getEnd(R), 0);
    }
    return firstBlock;
  }
  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var digit = Parser.digit;
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var succeed = Parser.succeed;
  var fail = Parser.fail;
  var variable = letter.map(function (c) {
    return new Letter(c);
  });
  var number = digit.map(function (c) {
    return new Digit(c);
  });
  var symbol = regex(/^[^${}\\_^]/).map(function (c) {
    return new VanillaSymbol(c);
  });
  var controlSequence = regex(/^[^\\a-eg-zA-Z]/)
    .or(
      string('\\').then(
        regex(/^[a-z]+/i)
          .or(regex(/^\s+/).result(' '))
          .or(any)
      )
    )
    .then(function (ctrlSeq) {
      var cmdKlass = LatexCmds[ctrlSeq];
      if (cmdKlass) {
        if (cmdKlass.constructor) {
          var actualClass = cmdKlass;
          return new actualClass(ctrlSeq).parser();
        } else {
          var builder = cmdKlass;
          return builder(ctrlSeq).parser();
        }
      } else {
        return fail('unknown command: \\' + ctrlSeq);
      }
    });
  var command = controlSequence.or(variable).or(number).or(symbol);
  var mathGroup = string('{')
    .then(function () {
      return mathSequence;
    })
    .skip(string('}'));
  var mathBlock = optWhitespace.then(mathGroup.or(command.map(commandToBlock)));
  var mathSequence = mathBlock.many().map(joinBlocks).skip(optWhitespace);
  var optMathBlock = string('[')
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
  var latexMath = mathSequence;
  latexMath.block = mathBlock;
  latexMath.optBlock = optMathBlock;
  return latexMath;
})();
baseOptionProcessors.maxDepth = function (depth) {
  return typeof depth === 'number' ? depth : undefined;
};
export class Controller_latex extends Controller_keystroke {
  cleanLatex(latex) {
    return latex.replace(/(\\[a-z]+) (?![a-z])/gi, '$1');
  }
  exportLatex() {
    return this.cleanLatex(this.root.latex());
  }
  writeLatex(latex) {
    var cursor = this.notify('edit').cursor;
    cursor.parent.writeLatex(cursor, latex);
    return this;
  }
  exportLatexSelection() {
    var ctx = {
      latex: '',
      startIndex: -1,
      endIndex: -1,
    };
    var selection = this.cursor.selection;
    if (selection) {
      ctx.startSelectionBefore = selection.getEnd(L);
      ctx.endSelectionAfter = selection.getEnd(R);
    } else {
      var cursorL = this.cursor[L];
      if (cursorL) {
        ctx.startSelectionAfter = cursorL;
      } else {
        ctx.startSelectionBefore = this.cursor.parent;
      }
      var cursorR = this.cursor[R];
      if (cursorR) {
        ctx.endSelectionBefore = cursorR;
      } else {
        ctx.endSelectionAfter = this.cursor.parent;
      }
    }
    this.root.latexRecursive(ctx);
    var originalLatex = ctx.latex;
    var cleanLatex = this.cleanLatex(originalLatex);
    var startIndex = ctx.startIndex;
    var endIndex = ctx.endIndex;
    var j = 0;
    for (var i = 0; i < ctx.endIndex; i++) {
      if (originalLatex[i] !== cleanLatex[j]) {
        if (i < ctx.startIndex) {
          startIndex -= 1;
        }
        endIndex -= 1;
      } else {
        j += 1;
      }
    }
    return {
      latex: cleanLatex,
      startIndex: startIndex,
      endIndex: endIndex,
    };
  }
  classifyLatexForEfficientUpdate(latex) {
    if (typeof latex !== 'string') return;
    var matches = latex.match(/-?[0-9.]+$/g);
    if (matches && matches.length === 1) {
      return {
        latex: latex,
        prefix: latex.substr(0, latex.length - matches[0].length),
        digits: matches[0],
      };
    }
    return;
  }
  updateLatexMathEfficiently(latex, oldLatex) {
    var root = this.root;
    var oldClassification;
    var classification = this.classifyLatexForEfficientUpdate(latex);
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
    var oldDigits = oldClassification.digits;
    var newDigits = classification.digits;
    var oldMinusSign = false;
    var newMinusSign = false;
    if (oldDigits[0] === '-') {
      oldMinusSign = true;
      oldDigits = oldDigits.substr(1);
    }
    if (newDigits[0] === '-') {
      newMinusSign = true;
      newDigits = newDigits.substr(1);
    }
    var charNode = this.root.getEnd(R);
    var oldCharNodes = [];
    for (var i = oldDigits.length - 1; i >= 0; i--) {
      if (!charNode || charNode.ctrlSeq !== oldDigits[i]) {
        return false;
      }
      if (charNode.parent !== root) {
        return false;
      }
      oldCharNodes.unshift(charNode);
      charNode = charNode[L];
    }
    if (oldMinusSign && !newMinusSign) {
      var oldMinusNode = charNode;
      if (!oldMinusNode) return false;
      if (oldMinusNode.ctrlSeq !== '-') return false;
      if (oldMinusNode[R] !== oldCharNodes[0]) return false;
      if (oldMinusNode.parent !== root) return false;
      var oldMinusNodeL = oldMinusNode[L];
      if (oldMinusNodeL && oldMinusNodeL.parent !== root) return false;
      oldCharNodes[0][L] = oldMinusNode[L];
      if (root.getEnd(L) === oldMinusNode) {
        root.setEnds({ [L]: oldCharNodes[0], [R]: root.getEnd(R) });
      }
      if (oldMinusNodeL) oldMinusNodeL[R] = oldCharNodes[0];
      oldMinusNode.domFrag().remove();
    }
    if (!oldMinusSign && newMinusSign) {
      var newMinusNode = new PlusMinus('-');
      var minusSpan = document.createElement('span');
      minusSpan.textContent = '-';
      newMinusNode.setDOM(minusSpan);
      var oldCharNodes0L = oldCharNodes[0][L];
      if (oldCharNodes0L) oldCharNodes0L[R] = newMinusNode;
      if (root.getEnd(L) === oldCharNodes[0]) {
        root.setEnds({ [L]: newMinusNode, [R]: root.getEnd(R) });
      }
      newMinusNode.parent = root;
      newMinusNode[L] = oldCharNodes[0][L];
      newMinusNode[R] = oldCharNodes[0];
      oldCharNodes[0][L] = newMinusNode;
      newMinusNode.contactWeld(this.cursor);
      newMinusNode.domFrag().insertBefore(oldCharNodes[0].domFrag());
    }
    var commonLength = Math.min(oldDigits.length, newDigits.length);
    for (var i = 0; i < commonLength; i++) {
      var newText = newDigits[i];
      charNode = oldCharNodes[i];
      if (charNode.ctrlSeq !== newText) {
        charNode.ctrlSeq = newText;
        charNode.domFrag().oneElement().textContent = newText;
        charNode.mathspeakName = newText;
      }
    }
    if (oldDigits.length > newDigits.length) {
      charNode = oldCharNodes[newDigits.length - 1];
      root.setEnds({ [L]: root.getEnd(L), [R]: charNode });
      charNode[R] = 0;
      for (var i = oldDigits.length - 1; i >= commonLength; i--) {
        oldCharNodes[i].domFrag().remove();
      }
    }
    if (newDigits.length > oldDigits.length) {
      var frag = document.createDocumentFragment();
      for (var i = commonLength; i < newDigits.length; i++) {
        var span = document.createElement('span');
        span.className = 'mq-digit';
        span.textContent = newDigits[i];
        var newNode = new Digit(newDigits[i]);
        newNode.parent = root;
        newNode.setDOM(span);
        frag.appendChild(span);
        newNode[L] = root.getEnd(R);
        newNode[R] = 0;
        var newNodeL = newNode[L];
        newNodeL[R] = newNode;
        root.setEnds({ [L]: root.getEnd(L), [R]: newNode });
      }
      root.domFrag().oneElement().appendChild(frag);
    }
    var currentLatex = this.exportLatex();
    if (currentLatex !== latex) {
      console.warn(
        'tried updating latex efficiently but did not work. Attempted: ' +
          latex +
          ' but wrote: ' +
          currentLatex
      );
      return false;
    }
    var rightMost = root.getEnd(R);
    if (rightMost) {
      rightMost.fixDigitGrouping(this.cursor.options);
    }
    return true;
  }
  renderLatexMathFromScratch(latex) {
    var root = this.root,
      cursor = this.cursor;
    var all = Parser.all;
    var eof = Parser.eof;
    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);
    root.setEnds({ [L]: 0, [R]: 0 });
    if (block) {
      block.children().adopt(root, 0, 0);
    }
    if (block) {
      var frag = root.domFrag();
      frag.children().remove();
      frag.oneElement().appendChild(block.html());
      root.finalizeInsert(cursor.options, cursor);
    } else {
      root.domFrag().empty();
    }
  }
  renderLatexMath(latex) {
    var cursor = this.cursor;
    var root = this.root;
    this.notify('replace');
    cursor.clearSelection();
    var oldLatex = this.exportLatex();
    if (!root.getEnd(L) || !root.getEnd(R) || oldLatex !== latex) {
      this.updateLatexMathEfficiently(latex, oldLatex) ||
        this.renderLatexMathFromScratch(latex);
      this.updateMathspeak();
    }
    cursor.insAtRightEnd(root);
  }
  renderLatexText(latex) {
    var root = this.root,
      cursor = this.cursor;
    root.domFrag().children().slice(1).remove();
    root.setEnds({ [L]: 0, [R]: 0 });
    delete cursor.selection;
    cursor.show().insAtRightEnd(root);
    var regex = Parser.regex;
    var string = Parser.string;
    var eof = Parser.eof;
    var all = Parser.all;
    var mathMode = string('$')
      .then(latexMathParser)
      .skip(string('$').or(eof))
      .map(function (block) {
        var rootMathCommand = new RootMathCommand(cursor);
        rootMathCommand.createBlocks();
        var rootMathBlock = rootMathCommand.getEnd(L);
        block.children().adopt(rootMathBlock, 0, 0);
        return rootMathCommand;
      });
    var escapedDollar = string('\\$').result('$');
    var textChar = escapedDollar
      .or(regex(/^[^$]/))
      .map((ch) => new VanillaSymbol(ch));
    var latexText = mathMode.or(textChar).many();
    var commands = latexText.skip(eof).or(all.result(false)).parse(latex);
    if (commands) {
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(root, root.getEnd(R), 0);
      }
      domFrag(root.html()).appendTo(root.domFrag().oneElement());
      root.finalizeInsert(cursor.options, cursor);
    }
  }
}
