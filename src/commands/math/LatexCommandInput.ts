/****************************************
 * Input box to type backslash commands
 ***************************************/

import { MQNode } from 'src/services/keystroke';
import { TempSingleCharNode } from 'src/services/latex';
import { LatexContext } from 'src/shared_types';
import { CharCmds, Fragment, LatexCmds, isMQNodeClass } from 'src/tree';
import { L, R } from 'src/utils';
import { DOMView, MathCommand, VanillaSymbol } from '../math';
import { Cursor } from 'src/cursor';
import { h } from 'src/dom';
import { TextBlock } from '../text';

CharCmds['\\'] = class LatexCommandInput extends MathCommand {
  ctrlSeq = '\\';
  _replacedFragment?: Fragment;

  replaces(replacedFragment: Fragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function () {
      return false;
    };
  }
  domView = new DOMView(1, (blocks) =>
    h('span', { class: 'mq-latex-command-input-wrapper mq-non-leaf' }, [
      h('span', { class: 'mq-latex-command-input mq-non-leaf' }, [
        h.text('\\'),
        h.block('span', {}, blocks[0]),
      ]),
    ])
  );
  textTemplate = ['\\'];
  createBlocks() {
    super.createBlocks();
    const endsL = this.getEnd(L);

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
        // TODO needs tests
        cursor.controller.aria.alert(ch);
      } else {
        const cmd = (this.parent as LatexCommandInput).renderCommand(cursor);
        // TODO needs tests
        cursor.controller.aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
        if (ch !== '\\' || !this.isEmpty()) cursor.parent.write(cursor, ch);
        else cursor.controller.aria.alert();
      }
    };

    const originalKeystroke = endsL.keystroke;
    endsL.keystroke = function (key, e, ctrlr) {
      if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
        const cmd = (this.parent as LatexCommandInput).renderCommand(
          ctrlr.cursor
        );
        // TODO needs tests
        ctrlr.aria.alert(cmd.mathspeak({ createdLeftOf: ctrlr.cursor }));
        e?.preventDefault();
        return;
      }

      return originalKeystroke.call(this, key, e, ctrlr);
    };
  }
  createLeftOf(cursor: Cursor) {
    super.createLeftOf(cursor);

    if (this._replacedFragment) {
      const frag = this.domFrag();
      const el = frag.oneElement();
      this._replacedFragment.domFrag().addClass('mq-blur');

      //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
      const rewriteMousedownEventTarget = (e: MouseEvent) => {
        {
          // TODO - overwritting e.target
          (e as any).target = el;
          el.dispatchEvent(e);
          return false;
        }
      };

      el.addEventListener('mousedown', rewriteMousedownEventTarget);
      el.addEventListener('mouseup', rewriteMousedownEventTarget);

      this._replacedFragment.domFrag().insertBefore(frag.children().first());
    }
  }
  latexRecursive(ctx: LatexContext) {
    this.checkCursorContextOpen(ctx);

    ctx.latex += '\\';
    this.getEnd(L).latexRecursive(ctx);
    ctx.latex += ' ';

    this.checkCursorContextClose(ctx);
  }
  renderCommand(cursor: Cursor) {
    this.setDOM(this.domFrag().children().lastElement());
    this.remove();
    if (this[R]) {
      cursor.insLeftOf(this[R] as MQNode);
    } else {
      cursor.insAtRightEnd(this.parent);
    }

    let latex = this.getEnd(L).latex();
    if (!latex) latex = ' ';
    const cmd = LatexCmds[latex];

    if (cmd) {
      let node: MQNode;
      if (isMQNodeClass(cmd)) {
        node = new (cmd as typeof TempSingleCharNode)(latex);
      } else {
        node = cmd(latex);
      }
      if (this._replacedFragment)
        (node as MathCommand).replaces(this._replacedFragment);
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
