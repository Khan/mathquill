import {
  CharCmds,
  DOMView,
  L,
  LatexCmds,
  MathCommand,
  R,
  TextBlock,
  VanillaSymbol,
  h,
  isMQNodeClass,
} from '../../bundle';
CharCmds['\\'] = class LatexCommandInput extends MathCommand {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\';
    this.domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-latex-command-input-wrapper mq-non-leaf' }, [
        h('span', { class: 'mq-latex-command-input mq-non-leaf' }, [
          h.text('\\'),
          h.block('span', {}, blocks[0]),
        ]),
      ])
    );
    this.textTemplate = ['\\'];
  }
  replaces(replacedFragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function () {
      return false;
    };
  }
  createBlocks() {
    super.createBlocks();
    var endsL = this.getEnd(L);
    endsL.focus = function () {
      this.parent.domFrag().addClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.domFrag().removeClass('mq-empty');
      return this;
    };
    endsL.blur = function () {
      this.parent.domFrag().removeClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.domFrag().addClass('mq-empty');
      return this;
    };
    endsL.write = function (cursor, ch) {
      cursor.show().deleteSelection();
      if (ch.match(/[a-z]/i)) {
        new VanillaSymbol(ch).createLeftOf(cursor);
        cursor.controller.aria.alert(ch);
      } else {
        var cmd = this.parent.renderCommand(cursor);
        cursor.controller.aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
        if (ch !== '\\' || !this.isEmpty()) cursor.parent.write(cursor, ch);
        else cursor.controller.aria.alert();
      }
    };
    var originalKeystroke = endsL.keystroke;
    endsL.keystroke = function (key, e, ctrlr) {
      if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
        var cmd = this.parent.renderCommand(ctrlr.cursor);
        ctrlr.aria.alert(cmd.mathspeak({ createdLeftOf: ctrlr.cursor }));
        e === null || e === void 0 ? void 0 : e.preventDefault();
        return;
      }
      return originalKeystroke.call(this, key, e, ctrlr);
    };
  }
  createLeftOf(cursor) {
    super.createLeftOf(cursor);
    if (this._replacedFragment) {
      var frag = this.domFrag();
      var el = frag.oneElement();
      this._replacedFragment.domFrag().addClass('mq-blur');
      var rewriteMousedownEventTarget = (e) => {
        {
          e.target = el;
          el.dispatchEvent(e);
          return false;
        }
      };
      el.addEventListener('mousedown', rewriteMousedownEventTarget);
      el.addEventListener('mouseup', rewriteMousedownEventTarget);
      this._replacedFragment.domFrag().insertBefore(frag.children().first());
    }
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += '\\';
    this.getEnd(L).latexRecursive(ctx);
    ctx.latex += ' ';
    this.checkCursorContextClose(ctx);
  }
  renderCommand(cursor) {
    this.setDOM(this.domFrag().children().lastElement());
    this.remove();
    if (this[R]) {
      cursor.insLeftOf(this[R]);
    } else {
      cursor.insAtRightEnd(this.parent);
    }
    var latex = this.getEnd(L).latex();
    if (!latex) latex = ' ';
    var cmd = LatexCmds[latex];
    if (cmd) {
      let node;
      if (isMQNodeClass(cmd)) {
        node = new cmd(latex);
      } else {
        node = cmd(latex);
      }
      if (this._replacedFragment) node.replaces(this._replacedFragment);
      node.createLeftOf(cursor);
      return node;
    } else {
      const node = new TextBlock();
      node.replaces(latex);
      node.createLeftOf(cursor);
      cursor.insRightOf(node);
      if (this._replacedFragment) {
        this._replacedFragment.remove();
      }
      return node;
    }
  }
};
