import {
  Anticursor,
  MQNode,
  API,
  DOMView,
  Fragment,
  L,
  LatexCmds,
  MathBlock,
  MathCommand,
  NodeBase,
  Parser,
  R,
  RootMathBlock,
  VanillaSymbol,
  h,
  pray,
  prayDirection,
} from '../bundle';
export class TextBlock extends MQNode {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\text';
    this.ariaLabel = 'Text';
    this.mathspeakTemplate = ['StartText', 'EndText'];
  }
  replaces(replacedText) {
    if (replacedText instanceof Fragment) {
      this.replacedText = replacedText.remove().domFrag().text();
    } else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  }
  setDOMFrag(el) {
    super.setDOM(el);
    var endsL = this.getEnd(L);
    if (endsL) {
      var children = this.domFrag().children();
      if (!children.isEmpty()) {
        endsL.setDOM(children.oneText());
      }
    }
    return this;
  }
  createLeftOf(cursor) {
    var textBlock = this;
    super.createLeftOf(cursor);
    cursor.insAtRightEnd(textBlock);
    if (textBlock.replacedText)
      for (var i = 0; i < textBlock.replacedText.length; i += 1)
        textBlock.write(cursor, textBlock.replacedText.charAt(i));
    var textBlockR = textBlock[R];
    if (textBlockR) textBlockR.siblingCreated(cursor.options, L);
    var textBlockL = textBlock[L];
    if (textBlockL) textBlockL.siblingCreated(cursor.options, R);
    textBlock.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }
  parser() {
    var textBlock = this;
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{'))
      .then(regex(/^[^}]*/))
      .skip(string('}'))
      .map(function (text) {
        if (text.length === 0) return new Fragment(0, 0);
        new TextPiece(text).adopt(textBlock, 0, 0);
        return textBlock;
      });
  }
  textContents() {
    return this.foldChildren('', function (text, child) {
      return text + child.textStr;
    });
  }
  text() {
    return '"' + this.textContents() + '"';
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    var contents = this.textContents();
    if (contents.length > 0) {
      ctx.latex += this.ctrlSeq + '{';
      ctx.latex += contents
        .replace(/\\/g, '\\backslash ')
        .replace(/[{}]/g, '\\$&');
      ctx.latex += '}';
    }
    this.checkCursorContextClose(ctx);
  }
  html() {
    var out = h('span', { class: 'mq-text-mode' }, [
      h.text(this.textContents()),
    ]);
    this.setDOM(out);
    NodeBase.linkElementByCmdNode(out, this);
    return out;
  }
  mathspeak(opts) {
    if (opts && opts.ignoreShorthand) {
      return (
        this.mathspeakTemplate[0] +
        ', ' +
        this.textContents() +
        ', ' +
        this.mathspeakTemplate[1]
      );
    } else {
      return this.textContents();
    }
  }
  isTextBlock() {
    return true;
  }
  moveTowards(dir, cursor) {
    cursor.insAtDirEnd(-dir, this);
    cursor.controller.aria.queueDirEndOf(-dir).queue(cursor.parent, true);
  }
  moveOutOf(dir, cursor) {
    cursor.insDirOf(dir, this);
    cursor.controller.aria.queueDirOf(dir).queue(this);
  }
  unselectInto(dir, cursor) {
    this.moveTowards(dir, cursor);
  }
  selectTowards(dir, cursor) {
    MathCommand.prototype.selectTowards.call(this, dir, cursor);
  }
  deleteTowards(dir, cursor) {
    MathCommand.prototype.deleteTowards.call(this, dir, cursor);
  }
  selectOutOf(dir, cursor) {
    cursor.insDirOf(dir, this);
  }
  deleteOutOf(_dir, cursor) {
    if (this.isEmpty()) cursor.insRightOf(this);
  }
  write(cursor, ch) {
    cursor.show().deleteSelection();
    if (ch !== '$') {
      var cursorL = cursor[L];
      if (!cursorL) new TextPiece(ch).createLeftOf(cursor);
      else if (cursorL instanceof TextPiece) cursorL.appendText(ch);
    } else if (this.isEmpty()) {
      cursor.insRightOf(this);
      new VanillaSymbol('\\$', h.text('$')).createLeftOf(cursor);
    } else if (!cursor[R]) cursor.insRightOf(this);
    else if (!cursor[L]) cursor.insLeftOf(this);
    else {
      var leftBlock = new TextBlock();
      var leftPc = this.getEnd(L);
      if (leftPc) {
        leftPc.disown().domFrag().detach();
        leftPc.adopt(leftBlock, 0, 0);
      }
      cursor.insLeftOf(this);
      super.createLeftOf.call(leftBlock, cursor);
    }
    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
    cursor.controller.aria.alert(ch);
  }
  writeLatex(cursor, latex) {
    var cursorL = cursor[L];
    if (!cursorL) new TextPiece(latex).createLeftOf(cursor);
    else if (cursorL instanceof TextPiece) cursorL.appendText(latex);
    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }
  seek(clientX, cursor) {
    cursor.hide();
    var textPc = TextBlockFuseChildren(this);
    if (!textPc) return;
    var textNode = this.domFrag().children().oneText();
    var range = document.createRange();
    range.selectNodeContents(textNode);
    var rects = range.getClientRects();
    if (rects.length === 1) {
      var { width, left } = rects[0];
      var avgChWidth = width / this.textContents().length;
      var approxPosition = Math.round((clientX - left) / avgChWidth);
      if (approxPosition <= 0) {
        cursor.insAtLeftEnd(this);
      } else if (approxPosition >= textPc.textStr.length) {
        cursor.insAtRightEnd(this);
      } else {
        cursor.insLeftOf(textPc.splitRight(approxPosition));
      }
    } else {
      cursor.insAtLeftEnd(this);
    }
    var displ =
      clientX - cursor.show().getBoundingClientRectWithoutMargin().left;
    var dir = displ && displ < 0 ? L : R;
    var prevDispl = dir;
    while (cursor[dir] && displ * prevDispl > 0) {
      cursor[dir].moveTowards(dir, cursor);
      prevDispl = displ;
      displ = clientX - cursor.getBoundingClientRectWithoutMargin().left;
    }
    if (dir * displ < -dir * prevDispl) cursor[-dir].moveTowards(-dir, cursor);
    if (!cursor.anticursor) {
      var cursorL = cursor[L];
      this.anticursorPosition = cursorL && cursorL.textStr.length;
    } else if (cursor.anticursor.parent === this) {
      var cursorL = cursor[L];
      var cursorPosition = cursorL && cursorL.textStr.length;
      if (this.anticursorPosition === cursorPosition) {
        cursor.anticursor = Anticursor.fromCursor(cursor);
      } else {
        var newTextPc;
        if (this.anticursorPosition < cursorPosition) {
          newTextPc = cursorL.splitRight(this.anticursorPosition);
          cursor[L] = newTextPc;
        } else {
          var cursorR = cursor[R];
          newTextPc = cursorR.splitRight(
            this.anticursorPosition - cursorPosition
          );
        }
        cursor.anticursor = new Anticursor(this, newTextPc[L], newTextPc);
      }
    }
  }
  blur(cursor) {
    MathBlock.prototype.blur.call(this, cursor);
    if (!cursor) return;
    if (this.textContents() === '') {
      this.remove();
      if (cursor[L] === this) cursor[L] = this[L];
      else if (cursor[R] === this) cursor[R] = this[R];
    } else TextBlockFuseChildren(this);
  }
  focus() {
    MathBlock.prototype.focus.call(this);
  }
}
function TextBlockFuseChildren(self) {
  self.domFrag().oneElement().normalize();
  var children = self.domFrag().children();
  if (children.isEmpty()) return;
  var textPcDom = children.oneText();
  pray('only node in TextBlock span is Text node', textPcDom.nodeType === 3);
  var textPc = new TextPiece(textPcDom.data);
  textPc.setDOM(textPcDom);
  self.children().disown();
  textPc.adopt(self, 0, 0);
  return textPc;
}
class TextPiece extends MQNode {
  constructor(text) {
    super();
    this.textStr = text;
  }
  html() {
    var out = h.text(this.textStr);
    this.setDOM(out);
    return out;
  }
  appendText(text) {
    this.textStr += text;
    this.domFrag().oneText().appendData(text);
  }
  prependText(text) {
    this.textStr = text + this.textStr;
    this.domFrag().oneText().insertData(0, text);
  }
  insTextAtDirEnd(text, dir) {
    prayDirection(dir);
    if (dir === R) this.appendText(text);
    else this.prependText(text);
  }
  splitRight(i) {
    var newPc = new TextPiece(this.textStr.slice(i)).adopt(
      this.parent,
      this,
      this[R]
    );
    newPc.setDOM(this.domFrag().oneText().splitText(i));
    this.textStr = this.textStr.slice(0, i);
    return newPc;
  }
  endChar(dir, text) {
    return text.charAt(dir === L ? 0 : -1 + text.length);
  }
  moveTowards(dir, cursor) {
    prayDirection(dir);
    var ch = this.endChar(-dir, this.textStr);
    var from = this[-dir];
    if (from instanceof TextPiece) from.insTextAtDirEnd(ch, dir);
    else new TextPiece(ch).createDir(-dir, cursor);
    return this.deleteTowards(dir, cursor);
  }
  mathspeak() {
    return this.textStr;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += this.textStr;
    this.checkCursorContextClose(ctx);
  }
  deleteTowards(dir, cursor) {
    if (this.textStr.length > 1) {
      var deletedChar;
      if (dir === R) {
        this.domFrag().oneText().deleteData(0, 1);
        deletedChar = this.textStr[0];
        this.textStr = this.textStr.slice(1);
      } else {
        this.domFrag()
          .oneText()
          .deleteData(-1 + this.textStr.length, 1);
        deletedChar = this.textStr[this.textStr.length - 1];
        this.textStr = this.textStr.slice(0, -1);
      }
      cursor.controller.aria.queue(deletedChar);
    } else {
      this.remove();
      cursor[dir] = this[dir];
      cursor.controller.aria.queue(this.textStr);
    }
  }
  selectTowards(dir, cursor) {
    prayDirection(dir);
    var anticursor = cursor.anticursor;
    if (!anticursor) return;
    var ch = this.endChar(-dir, this.textStr);
    if (anticursor[dir] === this) {
      var newPc = new TextPiece(ch).createDir(dir, cursor);
      anticursor[dir] = newPc;
      cursor.insDirOf(dir, newPc);
    } else {
      var from = this[-dir];
      if (from instanceof TextPiece) from.insTextAtDirEnd(ch, dir);
      else {
        var newPc = new TextPiece(ch).createDir(-dir, cursor);
        var selection = cursor.selection;
        if (selection) {
          newPc.domFrag().insDirOf(-dir, selection.domFrag());
        }
      }
      if (this.textStr.length === 1 && anticursor[-dir] === this) {
        anticursor[-dir] = this[-dir];
      }
    }
    return this.deleteTowards(dir, cursor);
  }
}
LatexCmds.text =
  LatexCmds.textnormal =
  LatexCmds.textrm =
  LatexCmds.textup =
  LatexCmds.textmd =
    TextBlock;
function makeTextBlock(latex, ariaLabel, tagName, attrs) {
  return class extends TextBlock {
    constructor() {
      super(...arguments);
      this.ctrlSeq = latex;
      this.mathspeakTemplate = ['Start' + ariaLabel, 'End' + ariaLabel];
      this.ariaLabel = ariaLabel;
    }
    html() {
      var out = h(tagName, attrs, [h.text(this.textContents())]);
      this.setDOM(out);
      NodeBase.linkElementByCmdNode(out, this);
      return out;
    }
  };
}
LatexCmds.em =
  LatexCmds.italic =
  LatexCmds.italics =
  LatexCmds.emph =
  LatexCmds.textit =
  LatexCmds.textsl =
    makeTextBlock('\\textit', 'Italic', 'i', { class: 'mq-text-mode' });
LatexCmds.strong =
  LatexCmds.bold =
  LatexCmds.textbf =
    makeTextBlock('\\textbf', 'Bold', 'b', { class: 'mq-text-mode' });
LatexCmds.sf = LatexCmds.textsf = makeTextBlock(
  '\\textsf',
  'Sans serif font',
  'span',
  { class: 'mq-sans-serif mq-text-mode' }
);
LatexCmds.tt = LatexCmds.texttt = makeTextBlock(
  '\\texttt',
  'Mono space font',
  'span',
  { class: 'mq-monospace mq-text-mode' }
);
LatexCmds.textsc = makeTextBlock('\\textsc', 'Variable font', 'span', {
  style: 'font-variant:small-caps',
  class: 'mq-text-mode',
});
LatexCmds.uppercase = makeTextBlock('\\uppercase', 'Uppercase', 'span', {
  style: 'text-transform:uppercase',
  class: 'mq-text-mode',
});
LatexCmds.lowercase = makeTextBlock('\\lowercase', 'Lowercase', 'span', {
  style: 'text-transform:lowercase',
  class: 'mq-text-mode',
});
export class RootMathCommand extends MathCommand {
  constructor(cursor) {
    super('$');
    this.domView = new DOMView(1, (blocks) =>
      h.block('span', { class: 'mq-math-mode' }, blocks[0])
    );
    this.cursor = cursor;
  }
  createBlocks() {
    super.createBlocks();
    var endsL = this.getEnd(L);
    endsL.cursor = this.cursor;
    endsL.write = function (cursor, ch) {
      if (ch !== '$') MathBlock.prototype.write.call(this, cursor, ch);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent);
        this.parent.deleteTowards(undefined, cursor);
        new VanillaSymbol('\\$', h.text('$')).createLeftOf(cursor.show());
      } else if (!cursor[R]) cursor.insRightOf(this.parent);
      else if (!cursor[L]) cursor.insLeftOf(this.parent);
      else MathBlock.prototype.write.call(this, cursor, ch);
    };
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += '$';
    this.getEnd(L).latexRecursive(ctx);
    ctx.latex += '$';
    this.checkCursorContextClose(ctx);
  }
}
export class RootTextBlock extends RootMathBlock {
  keystroke(key, e, ctrlr) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return super.keystroke(key, e, ctrlr);
  }
  write(cursor, ch) {
    cursor.show().deleteSelection();
    if (ch === '$') new RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = h.entityText('&lt;');
      else if (ch === '>') html = h.entityText('&gt;');
      new VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  }
}
API.TextField = function (APIClasses) {
  var _a;
  return (
    (_a = class TextField extends APIClasses.EditableField {
      __mathquillify() {
        super.mathquillify('mq-editable-field mq-text-mode');
        return this;
      }
      latex(latex) {
        if (latex) {
          this.__controller.renderLatexText(latex);
          if (this.__controller.blurred)
            this.__controller.cursor.hide().parent.blur();
          var _this = this;
          return _this;
        }
        return this.__controller.exportLatex();
      }
    }),
    (_a.RootBlock = RootTextBlock),
    _a
  );
};
