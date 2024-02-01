import {
  API,
  CharCmds,
  Digit,
  L,
  LatexCmds,
  Letter,
  MQNode,
  MQSelection,
  NodeBase,
  Options,
  Parser,
  R,
  RootBlockMixin,
  domFrag,
  getBoundingClientRect,
  h,
  latexMathParser,
  noop,
  pray,
} from '../bundle';
export class MathElement extends MQNode {
  finalizeInsert(options, cursor) {
    var self = this;
    self.postOrder(function (node) {
      node.finalizeTree(options);
    });
    self.postOrder(function (node) {
      node.contactWeld(cursor);
    });
    self.postOrder(function (node) {
      node.blur(cursor);
    });
    self.postOrder(function (node) {
      node.reflow();
    });
    var selfR = self[R];
    var selfL = self[L];
    if (selfR) selfR.siblingCreated(options, L);
    if (selfL) selfL.siblingCreated(options, R);
    self.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }
  prepareInsertionAt(cursor) {
    var maxDepth = cursor.options.maxDepth;
    if (maxDepth !== undefined) {
      var cursorDepth = cursor.depth();
      if (cursorDepth > maxDepth) {
        return false;
      }
      this.removeNodesDeeperThan(maxDepth - cursorDepth);
    }
    return true;
  }
  removeNodesDeeperThan(cutoff) {
    var depth = 0;
    var queue = [[this, depth]];
    var current;
    while ((current = queue.shift())) {
      var c = current;
      c[0].children().each(function (child) {
        var i = child instanceof MathBlock ? 1 : 0;
        depth = c[1] + i;
        if (depth <= cutoff) {
          queue.push([child, depth]);
        } else {
          (i ? child.children() : child).remove();
        }
        return undefined;
      });
    }
  }
}
export class DOMView {
  constructor(childCount, render) {
    this.childCount = childCount;
    this.render = render;
  }
}
export class MathCommand extends MathElement {
  constructor(ctrlSeq, domView, textTemplate) {
    super();
    this.textTemplate = [''];
    this.mathspeakTemplate = [''];
    this.setCtrlSeqHtmlAndText(ctrlSeq, domView, textTemplate);
  }
  setEnds(ends) {
    pray('MathCommand ends are never empty', ends[L] && ends[R]);
    this.ends = ends;
  }
  getEnd(dir) {
    return this.ends[dir];
  }
  setCtrlSeqHtmlAndText(ctrlSeq, domView, textTemplate) {
    if (!this.ctrlSeq) this.ctrlSeq = ctrlSeq;
    if (domView) this.domView = domView;
    if (textTemplate) this.textTemplate = textTemplate;
  }
  replaces(replacedFragment) {
    replacedFragment.disown();
    this.replacedFragment = replacedFragment;
  }
  isEmpty() {
    return this.foldChildren(true, function (isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  }
  parser() {
    var block = latexMathParser.block;
    return block.times(this.numBlocks()).map((blocks) => {
      this.blocks = blocks;
      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(this, this.getEnd(R), 0);
      }
      return this;
    });
  }
  createLeftOf(cursor) {
    var cmd = this;
    var replacedFragment = cmd.replacedFragment;
    cmd.createBlocks();
    super.createLeftOf(cursor);
    if (replacedFragment) {
      var cmdEndsL = cmd.getEnd(L);
      replacedFragment.adopt(cmdEndsL, 0, 0);
      replacedFragment.domFrag().appendTo(cmdEndsL.domFrag().oneElement());
      cmd.placeCursor(cursor);
      cmd.prepareInsertionAt(cursor);
    }
    cmd.finalizeInsert(cursor.options, cursor);
    cmd.placeCursor(cursor);
  }
  createBlocks() {
    var cmd = this,
      numBlocks = cmd.numBlocks(),
      blocks = (cmd.blocks = Array(numBlocks));
    for (var i = 0; i < numBlocks; i += 1) {
      var newBlock = (blocks[i] = new MathBlock());
      newBlock.adopt(cmd, cmd.getEnd(R), 0);
    }
  }
  placeCursor(cursor) {
    cursor.insAtRightEnd(
      this.foldChildren(this.getEnd(L), function (leftward, child) {
        return leftward.isEmpty() ? leftward : child;
      })
    );
  }
  moveTowards(dir, cursor, updown) {
    var updownInto;
    if (updown === 'up') {
      updownInto = this.upInto;
    } else if (updown === 'down') {
      updownInto = this.downInto;
    }
    var el = updownInto || this.getEnd(-dir);
    cursor.insAtDirEnd(-dir, el);
    cursor.controller.aria.queueDirEndOf(-dir).queue(cursor.parent, true);
  }
  deleteTowards(dir, cursor) {
    if (this.isEmpty()) cursor[dir] = this.remove()[dir];
    else this.moveTowards(dir, cursor);
  }
  selectTowards(dir, cursor) {
    cursor[-dir] = this;
    cursor[dir] = this[dir];
  }
  selectChildren() {
    return new MQSelection(this, this);
  }
  unselectInto(dir, cursor) {
    var antiCursor = cursor.anticursor;
    var ancestor = antiCursor.ancestors[this.id];
    cursor.insAtDirEnd(-dir, ancestor);
  }
  seek(clientX, cursor) {
    function getBounds(node) {
      var el = node.domFrag().oneElement();
      var l = getBoundingClientRect(el).left;
      var r = l + el.offsetWidth;
      return {
        [L]: l,
        [R]: r,
      };
    }
    var cmd = this;
    var cmdBounds = getBounds(cmd);
    if (clientX < cmdBounds[L]) return cursor.insLeftOf(cmd);
    if (clientX > cmdBounds[R]) return cursor.insRightOf(cmd);
    var leftLeftBound = cmdBounds[L];
    cmd.eachChild(function (block) {
      var blockBounds = getBounds(block);
      if (clientX < blockBounds[L]) {
        if (clientX - leftLeftBound < blockBounds[L] - clientX) {
          if (block[L]) cursor.insAtRightEnd(block[L]);
          else cursor.insLeftOf(cmd);
        } else cursor.insAtLeftEnd(block);
        return false;
      } else if (clientX > blockBounds[R]) {
        if (block[R]) leftLeftBound = blockBounds[R];
        else {
          if (cmdBounds[R] - clientX < clientX - blockBounds[R]) {
            cursor.insRightOf(cmd);
          } else cursor.insAtRightEnd(block);
        }
        return undefined;
      } else {
        block.seek(clientX, cursor);
        return false;
      }
    });
    return undefined;
  }
  numBlocks() {
    return this.domView.childCount;
  }
  html() {
    var blocks = this.blocks;
    pray('domView is defined', this.domView);
    var template = this.domView;
    var dom = template.render(blocks || []);
    this.setDOM(dom);
    NodeBase.linkElementByCmdNode(dom, this);
    return dom;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += this.ctrlSeq || '';
    this.eachChild((child) => {
      ctx.latex += '{';
      var beforeLength = ctx.latex.length;
      child.latexRecursive(ctx);
      var afterLength = ctx.latex.length;
      if (beforeLength === afterLength) {
        ctx.latex += ' ';
      }
      ctx.latex += '}';
    });
    this.checkCursorContextClose(ctx);
  }
  text() {
    var cmd = this;
    var i = 0;
    return cmd.foldChildren(cmd.textTemplate[i], function (text, child) {
      i += 1;
      var child_text = child.text();
      if (
        text &&
        cmd.textTemplate[i] === '(' &&
        child_text[0] === '(' &&
        child_text.slice(-1) === ')'
      )
        return text + child_text.slice(1, -1) + cmd.textTemplate[i];
      return text + child_text + (cmd.textTemplate[i] || '');
    });
  }
  mathspeak() {
    var cmd = this;
    var i = 0;
    return cmd.foldChildren(
      cmd.mathspeakTemplate[i] || 'Start' + cmd.ctrlSeq + ' ',
      function (speech, block) {
        i += 1;
        return (
          speech +
          ' ' +
          block.mathspeak() +
          ' ' +
          (cmd.mathspeakTemplate[i] + ' ' || 'End' + cmd.ctrlSeq + ' ')
        );
      }
    );
  }
}
export class MQSymbol extends MathCommand {
  constructor(ctrlSeq, html, text, mathspeak) {
    super();
    this.setCtrlSeqHtmlTextAndMathspeak(
      ctrlSeq,
      html ? new DOMView(0, () => html.cloneNode(true)) : undefined,
      text,
      mathspeak
    );
  }
  setCtrlSeqHtmlTextAndMathspeak(ctrlSeq, html, text, mathspeak) {
    if (!text && !!ctrlSeq) {
      text = ctrlSeq.replace(/^\\/, '');
    }
    this.mathspeakName = mathspeak || text;
    super.setCtrlSeqHtmlAndText(ctrlSeq, html, [text || '']);
  }
  parser() {
    return Parser.succeed(this);
  }
  numBlocks() {
    return 0;
  }
  replaces(replacedFragment) {
    replacedFragment.remove();
  }
  createBlocks() {}
  moveTowards(dir, cursor) {
    cursor.domFrag().insDirOf(dir, this.domFrag());
    cursor[-dir] = this;
    cursor[dir] = this[dir];
    cursor.controller.aria.queue(this);
  }
  deleteTowards(dir, cursor) {
    cursor[dir] = this.remove()[dir];
  }
  seek(clientX, cursor) {
    var el = this.domFrag().oneElement();
    var left = getBoundingClientRect(el).left;
    if (clientX - left < el.offsetWidth / 2) cursor.insLeftOf(this);
    else cursor.insRightOf(this);
    return cursor;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += this.ctrlSeq || '';
    this.checkCursorContextClose(ctx);
  }
  text() {
    return this.textTemplate.join('');
  }
  mathspeak(_opts) {
    return this.mathspeakName || '';
  }
  placeCursor() {}
  isEmpty() {
    return true;
  }
}
export class VanillaSymbol extends MQSymbol {
  constructor(ch, html, mathspeak) {
    super(ch, h('span', {}, [html || h.text(ch)]), undefined, mathspeak);
  }
}
export function bindVanillaSymbol(ch, htmlEntity, mathspeak) {
  return () =>
    new VanillaSymbol(
      ch,
      htmlEntity ? h.entityText(htmlEntity) : undefined,
      mathspeak
    );
}
export class BinaryOperator extends MQSymbol {
  constructor(ctrlSeq, html, text, mathspeak, treatLikeSymbol) {
    if (treatLikeSymbol) {
      super(
        ctrlSeq,
        h('span', {}, [html || h.text(ctrlSeq || '')]),
        undefined,
        mathspeak
      );
    } else {
      super(
        ctrlSeq,
        h('span', { class: 'mq-binary-operator' }, html ? [html] : []),
        text,
        mathspeak
      );
    }
  }
}
export function bindBinaryOperator(ctrlSeq, htmlEntity, text, mathspeak) {
  return () =>
    new BinaryOperator(
      ctrlSeq,
      htmlEntity ? h.entityText(htmlEntity) : undefined,
      text,
      mathspeak
    );
}
export class MathBlock extends MathElement {
  constructor() {
    super(...arguments);
    this.ariaLabel = 'block';
  }
  join(methodName) {
    return this.foldChildren('', function (fold, child) {
      return fold + child[methodName]();
    });
  }
  html() {
    var fragment = document.createDocumentFragment();
    this.eachChild((el) => {
      var childHtml = el.html();
      fragment.appendChild(childHtml);
      return undefined;
    });
    return fragment;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    this.eachChild((child) => child.latexRecursive(ctx));
    this.checkCursorContextClose(ctx);
  }
  text() {
    var endsL = this.getEnd(L);
    var endsR = this.getEnd(R);
    return endsL === endsR && endsL !== 0 ? endsL.text() : this.join('text');
  }
  mathspeak() {
    var tempOp = '';
    var autoOps = {};
    if (this.controller) autoOps = this.controller.options.autoOperatorNames;
    return this.foldChildren([], function (speechArray, cmd) {
      if (cmd.isPartOfOperator) {
        tempOp += cmd.mathspeak();
      } else {
        if (tempOp !== '') {
          if (autoOps._maxLength > 0) {
            var x = autoOps[tempOp.toLowerCase()];
            if (typeof x === 'string') tempOp = x;
          }
          speechArray.push(tempOp + ' ');
          tempOp = '';
        }
        var mathspeakText = cmd.mathspeak();
        var cmdText = cmd.ctrlSeq;
        if (
          isNaN(cmdText) &&
          cmdText !== '.' &&
          (!cmd.parent ||
            !cmd.parent.parent ||
            !cmd.parent.parent.isTextBlock())
        ) {
          mathspeakText = ' ' + mathspeakText + ' ';
        }
        speechArray.push(mathspeakText);
      }
      return speechArray;
    })
      .join('')
      .replace(/ +(?= )/g, '')
      .replace(/(\.)([0-9]+)/g, function (_match, p1, p2) {
        return p1 + p2.split('').join(' ').trim();
      });
  }
  keystroke(key, e, ctrlr) {
    if (
      ctrlr.options.spaceBehavesLikeTab &&
      (key === 'Spacebar' || key === 'Shift-Spacebar')
    ) {
      e === null || e === void 0 ? void 0 : e.preventDefault();
      ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
      return;
    }
    return super.keystroke(key, e, ctrlr);
  }
  moveOutOf(dir, cursor, updown) {
    var updownInto;
    if (updown === 'up') {
      updownInto = this.parent.upInto;
    } else if (updown === 'down') {
      updownInto = this.parent.downInto;
    }
    if (!updownInto && this[dir]) {
      var otherDir = -dir;
      cursor.insAtDirEnd(otherDir, this[dir]);
      cursor.controller.aria.queueDirEndOf(otherDir).queue(cursor.parent, true);
    } else {
      cursor.insDirOf(dir, this.parent);
      cursor.controller.aria.queueDirOf(dir).queue(this.parent);
    }
  }
  selectOutOf(dir, cursor) {
    cursor.insDirOf(dir, this.parent);
  }
  deleteOutOf(_dir, cursor) {
    cursor.unwrapGramp();
  }
  seek(clientX, cursor) {
    var node = this.getEnd(R);
    if (!node) return cursor.insAtRightEnd(this);
    var el = node.domFrag().oneElement();
    var left = getBoundingClientRect(el).left;
    if (left + el.offsetWidth < clientX) {
      return cursor.insAtRightEnd(this);
    }
    var endsL = this.getEnd(L);
    if (clientX < getBoundingClientRect(endsL.domFrag().oneElement()).left)
      return cursor.insAtLeftEnd(this);
    while (clientX < getBoundingClientRect(node.domFrag().oneElement()).left)
      node = node[L];
    return node.seek(clientX, cursor);
  }
  chToCmd(ch, options) {
    var cons;
    if (ch.match(/^[a-eg-zA-Z]$/)) return new Letter(ch);
    else if (/^\d$/.test(ch)) return new Digit(ch);
    else if (options && options.typingSlashWritesDivisionSymbol && ch === '/')
      return LatexCmds['÷'](ch);
    else if (options && options.typingAsteriskWritesTimesSymbol && ch === '*')
      return LatexCmds['×'](ch);
    else if (options && options.typingPercentWritesPercentOf && ch === '%')
      return LatexCmds.percentof(ch);
    else if ((cons = CharCmds[ch] || LatexCmds[ch])) {
      if (cons.constructor) {
        return new cons(ch);
      } else {
        return cons(ch);
      }
    } else return new VanillaSymbol(ch);
  }
  write(cursor, ch) {
    var cmd = this.chToCmd(ch, cursor.options);
    if (cursor.selection) cmd.replaces(cursor.replaceSelection());
    if (!cursor.isTooDeep()) {
      cmd.createLeftOf(cursor.show());
      if (ch === '/') {
        cursor.controller.aria.alert('over');
      } else {
        cursor.controller.aria.alert(cmd.mathspeak({ createdLeftOf: cursor }));
      }
    }
  }
  writeLatex(cursor, latex) {
    var all = Parser.all;
    var eof = Parser.eof;
    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);
    if (block && !block.isEmpty() && block.prepareInsertionAt(cursor)) {
      block.children().adopt(cursor.parent, cursor[L], cursor[R]);
      domFrag(block.html()).insertBefore(cursor.domFrag());
      cursor[L] = block.getEnd(R);
      block.finalizeInsert(cursor.options, cursor);
      var blockEndsR = block.getEnd(R);
      var blockEndsL = block.getEnd(L);
      var blockEndsRR = blockEndsR[R];
      var blockEndsLL = blockEndsL[L];
      if (blockEndsRR) blockEndsRR.siblingCreated(cursor.options, L);
      if (blockEndsLL) blockEndsLL.siblingCreated(cursor.options, R);
      cursor.parent.bubble(function (node) {
        node.reflow();
        return undefined;
      });
    }
  }
  focus() {
    this.domFrag().addClass('mq-hasCursor');
    this.domFrag().removeClass('mq-empty');
    return this;
  }
  blur(cursor) {
    this.domFrag().removeClass('mq-hasCursor');
    if (this.isEmpty()) {
      this.domFrag().addClass('mq-empty');
      if (
        cursor &&
        this.isQuietEmptyDelimiter(cursor.options.quietEmptyDelimiters)
      ) {
        this.domFrag().addClass('mq-quiet-delimiter');
      }
    }
    return this;
  }
}
Options.prototype.mouseEvents = true;
API.StaticMath = function (APIClasses) {
  var _a;
  return (
    (_a = class StaticMath extends APIClasses.AbstractMathQuill {
      __mathquillify(opts, _interfaceVersion) {
        this.config(opts);
        super.mathquillify('mq-math-mode');
        this.__controller.setupStaticField();
        if (this.__options.mouseEvents) {
          this.__controller.addMouseEventListener();
          this.__controller.staticMathTextareaEvents();
        }
        return this;
      }
      constructor(el) {
        super(el);
        var innerFields = (this.innerFields = []);
        this.__controller.root.postOrder(function (node) {
          node.registerInnerField(innerFields, APIClasses.InnerMathField);
        });
      }
      latex(_latex, ...args) {
        var returned = super.latex.apply(this, args);
        if (args.length > 0) {
          var innerFields = (this.innerFields = []);
          this.__controller.root.postOrder(function (node) {
            node.registerInnerField(innerFields, APIClasses.InnerMathField);
          });
          this.__controller.updateMathspeak();
        }
        return returned;
      }
      setAriaLabel(ariaLabel) {
        this.__controller.setAriaLabel(ariaLabel);
        return this;
      }
      getAriaLabel() {
        return this.__controller.getAriaLabel();
      }
    }),
    (_a.RootBlock = MathBlock),
    _a
  );
};
export class RootMathBlock extends MathBlock {}
RootBlockMixin(RootMathBlock.prototype);
API.MathField = function (APIClasses) {
  var _a;
  return (
    (_a = class MathField extends APIClasses.EditableField {
      __mathquillify(opts, interfaceVersion) {
        this.config(opts);
        if (interfaceVersion > 1) this.__controller.root.reflow = noop;
        super.mathquillify('mq-editable-field mq-math-mode');
        delete this.__controller.root.reflow;
        return this;
      }
    }),
    (_a.RootBlock = RootMathBlock),
    _a
  );
};
API.InnerMathField = function (APIClasses) {
  pray('MathField class is defined', APIClasses.MathField);
  return class extends APIClasses.MathField {
    makeStatic() {
      this.__controller.editable = false;
      this.__controller.root.blur();
      this.__controller.unbindEditablesEvents();
      domFrag(this.__controller.container).removeClass('mq-editable-field');
    }
    makeEditable() {
      this.__controller.editable = true;
      this.__controller.editablesTextareaEvents();
      this.__controller.cursor.insAtRightEnd(this.__controller.root);
      domFrag(this.__controller.container).addClass('mq-editable-field');
    }
  };
};
