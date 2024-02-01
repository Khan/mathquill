import {
  BinaryOperator,
  CharCmds,
  Controller,
  DOMView,
  Digit,
  EMBEDS,
  Equality,
  Fragment,
  L,
  LatexCmds,
  Letter,
  MQNode,
  MQSymbol,
  MathBlock,
  MathCommand,
  NodeBase,
  Options,
  Parser,
  Point,
  R,
  RootBlockMixin,
  U_DOT_ABOVE,
  U_INTEGRAL,
  U_NARY_COPRODUCT,
  U_NARY_PRODUCT,
  U_NARY_SUMMATION,
  U_ZERO_WIDTH_SPACE,
  domFrag,
  h,
  latexMathParser,
  noop,
  parseHTML,
  pray,
} from '../../bundle';
var SVG_SYMBOLS = {
  sqrt: {
    width: '',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 32 54' }, [
        h('path', {
          d: 'M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33',
        }),
      ]),
  },
  '|': {
    width: '.4em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M4.4 0 L4.4 54 L5.6 54 L5.6 0' }),
      ]),
  },
  '[': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
        h('path', { d: 'M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1' }),
      ]),
  },
  ']': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
        h('path', { d: 'M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1' }),
      ]),
  },
  '(': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
        h('path', {
          d: 'M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0',
        }),
      ]),
  },
  ')': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
        h('path', {
          d: 'M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0',
        }),
      ]),
  },
  '{': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
        h('path', {
          d: 'M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0',
        }),
      ]),
  },
  '}': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
        h('path', {
          d: 'M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0',
        }),
      ]),
  },
  '&#8741;': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0' }),
      ]),
  },
  '&lang;': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0' }),
      ]),
  },
  '&rang;': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0' }),
      ]),
  },
};
class Style extends MathCommand {
  constructor(ctrlSeq, tagName, attrs, ariaLabel, opts) {
    super(
      ctrlSeq,
      new DOMView(1, (blocks) => h.block(tagName, attrs, blocks[0]))
    );
    this.ariaLabel = ariaLabel || ctrlSeq.replace(/^\\/, '');
    this.mathspeakTemplate = [
      'Start' + this.ariaLabel + ',',
      'End' + this.ariaLabel,
    ];
    this.shouldNotSpeakDelimiters = opts && opts.shouldNotSpeakDelimiters;
  }
  mathspeak(opts) {
    if (!this.shouldNotSpeakDelimiters || (opts && opts.ignoreShorthand)) {
      return super.mathspeak();
    }
    return this.foldChildren('', function (speech, block) {
      return speech + ' ' + block.mathspeak(opts);
    }).trim();
  }
}
LatexCmds.mathrm = class extends Style {
  constructor() {
    super('\\mathrm', 'span', { class: 'mq-roman mq-font' }, 'Roman Font', {
      shouldNotSpeakDelimiters: true,
    });
  }
  isTextBlock() {
    return true;
  }
};
LatexCmds.mathit = () =>
  new Style('\\mathit', 'i', { class: 'mq-font' }, 'Italic Font');
LatexCmds.mathbf = () =>
  new Style('\\mathbf', 'b', { class: 'mq-font' }, 'Bold Font');
LatexCmds.mathsf = () =>
  new Style(
    '\\mathsf',
    'span',
    { class: 'mq-sans-serif mq-font' },
    'Serif Font'
  );
LatexCmds.mathtt = () =>
  new Style('\\mathtt', 'span', { class: 'mq-monospace mq-font' }, 'Math Text');
LatexCmds.underline = () =>
  new Style(
    '\\underline',
    'span',
    { class: 'mq-non-leaf mq-underline' },
    'Underline'
  );
LatexCmds.overline = LatexCmds.bar = () =>
  new Style(
    '\\overline',
    'span',
    { class: 'mq-non-leaf mq-overline' },
    'Overline'
  );
LatexCmds.overrightarrow = () =>
  new Style(
    '\\overrightarrow',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-right' },
    'Over Right Arrow'
  );
LatexCmds.overleftarrow = () =>
  new Style(
    '\\overleftarrow',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-left' },
    'Over Left Arrow'
  );
LatexCmds.overleftrightarrow = () =>
  new Style(
    '\\overleftrightarrow ',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-leftright' },
    'Over Left and Right Arrow'
  );
LatexCmds.overarc = () =>
  new Style(
    '\\overarc',
    'span',
    { class: 'mq-non-leaf mq-overarc' },
    'Over Arc'
  );
LatexCmds.dot = () => {
  return new MathCommand(
    '\\dot',
    new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-dot-recurring-inner' }, [
          h('span', { class: 'mq-dot-recurring' }, [h.text(U_DOT_ABOVE)]),
          h.block('span', { class: 'mq-empty-box' }, blocks[0]),
        ]),
      ])
    )
  );
};
LatexCmds.textcolor = class extends MathCommand {
  setColor(color) {
    this.color = color;
    this.domView = new DOMView(1, (blocks) =>
      h.block(
        'span',
        { class: 'mq-textcolor', style: 'color:' + color },
        blocks[0]
      )
    );
    this.ariaLabel = color.replace(/^\\/, '');
    this.mathspeakTemplate = [
      'Start ' + this.ariaLabel + ',',
      'End ' + this.ariaLabel,
    ];
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    var blocks0 = this.blocks[0];
    ctx.latex += '\\textcolor{' + this.color + '}{';
    blocks0.latexRecursive(ctx);
    ctx.latex += '}';
    this.checkCursorContextClose(ctx);
  }
  parser() {
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;
    var regex = Parser.regex;
    return optWhitespace
      .then(string('{'))
      .then(regex(/^[#\w\s.,()%-]*/))
      .skip(string('}'))
      .then((color) => {
        this.setColor(color);
        return super.parser();
      });
  }
  isStyleBlock() {
    return true;
  }
};
var Class = (LatexCmds['class'] = class extends MathCommand {
  parser() {
    var string = Parser.string,
      regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then((cls) => {
        this.cls = cls || '';
        this.domView = new DOMView(1, (blocks) =>
          h.block('span', { class: `mq-class ${cls}` }, blocks[0])
        );
        this.ariaLabel = cls + ' class';
        this.mathspeakTemplate = [
          'Start ' + this.ariaLabel + ',',
          'End ' + this.ariaLabel,
        ];
        return super.parser();
      });
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    var blocks0 = this.blocks[0];
    ctx.latex += '\\class{' + this.cls + '}{';
    blocks0.latexRecursive(ctx);
    ctx.latex += '}';
    this.checkCursorContextClose(ctx);
  }
  isStyleBlock() {
    return true;
  }
});
var intRgx = /^[+-]?[\d]+$/;
function getCtrlSeqsFromBlock(block) {
  if (!block) return '';
  var chars = '';
  block.eachChild((child) => {
    if (child.ctrlSeq !== undefined) chars += child.ctrlSeq;
  });
  return chars;
}
Options.prototype.charsThatBreakOutOfSupSub = '';
export class SupSub extends MathCommand {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '_{...}^{...}';
  }
  setEnds(ends) {
    pray(
      'SupSub ends must be MathBlocks',
      ends[L] instanceof MathBlock && ends[R] instanceof MathBlock
    );
    this.ends = ends;
  }
  getEnd(dir) {
    return this.ends[dir];
  }
  createLeftOf(cursor) {
    if (
      !this.replacedFragment &&
      !cursor[L] &&
      cursor.options.supSubsRequireOperand
    )
      return;
    return super.createLeftOf(cursor);
  }
  contactWeld(cursor) {
    for (var dir = L; dir; dir = dir === L ? R : false) {
      var thisDir = this[dir];
      var pt;
      if (thisDir instanceof SupSub) {
        for (
          var supsub = 'sub';
          supsub;
          supsub = supsub === 'sub' ? 'sup' : false
        ) {
          var src = this[supsub],
            dest = thisDir[supsub];
          if (!src) continue;
          if (!dest) thisDir.addBlock(src.disown());
          else if (!src.isEmpty()) {
            src
              .domFrag()
              .children()
              .insAtDirEnd(-dir, dest.domFrag().oneElement());
            var children = src.children().disown();
            pt = new Point(dest, children.getEnd(R), dest.getEnd(L));
            if (dir === L) children.adopt(dest, dest.getEnd(R), 0);
            else children.adopt(dest, 0, dest.getEnd(L));
          } else {
            pt = new Point(dest, 0, dest.getEnd(L));
          }
          this.placeCursor = (function (dest, src) {
            return function (cursor) {
              cursor.insAtDirEnd(-dir, dest || src);
            };
          })(dest, src);
        }
        this.remove();
        if (cursor && cursor[L] === this) {
          if (dir === R && pt) {
            if (pt[L]) {
              cursor.insRightOf(pt[L]);
            } else {
              cursor.insAtLeftEnd(pt.parent);
            }
          } else cursor.insRightOf(thisDir);
        }
        break;
      }
    }
  }
  finalizeTree() {
    var endsL = this.getEnd(L);
    endsL.write = function (cursor, ch) {
      if (
        cursor.options.autoSubscriptNumerals &&
        this === this.parent.sub &&
        '0123456789'.indexOf(ch) >= 0
      ) {
        var cmd = this.chToCmd(ch, cursor.options);
        if (cmd instanceof MQSymbol) cursor.deleteSelection();
        else cursor.clearSelection().insRightOf(this.parent);
        cmd.createLeftOf(cursor.show());
        cursor.controller.aria
          .queue('Baseline')
          .alert(cmd.mathspeak({ createdLeftOf: cursor }));
        return;
      }
      if (
        cursor[L] &&
        !cursor[R] &&
        !cursor.selection &&
        cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1
      ) {
        cursor.insRightOf(this.parent);
        cursor.controller.aria.queue('Baseline');
      }
      MathBlock.prototype.write.call(this, cursor, ch);
    };
  }
  moveTowards(dir, cursor, updown) {
    if (cursor.options.autoSubscriptNumerals && !this.sup) {
      cursor.insDirOf(dir, this);
    } else super.moveTowards(dir, cursor, updown);
  }
  deleteTowards(dir, cursor) {
    if (cursor.options.autoSubscriptNumerals && this.sub) {
      var cmd = this.sub.getEnd(-dir);
      if (cmd instanceof MQSymbol) cmd.remove();
      else if (cmd) cmd.deleteTowards(dir, cursor.insAtDirEnd(-dir, this.sub));
      if (this.sub.isEmpty()) {
        this.sub.deleteOutOf(L, cursor.insAtLeftEnd(this.sub));
        if (this.sup) cursor.insDirOf(-dir, this);
      }
    } else super.deleteTowards(dir, cursor);
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    if (this.sub) {
      ctx.latex += '_{';
      var beforeLength = ctx.latex.length;
      this.sub.latexRecursive(ctx);
      var afterLength = ctx.latex.length;
      if (beforeLength === afterLength) {
        ctx.latex += ' ';
      }
      ctx.latex += '}';
    }
    if (this.sup) {
      ctx.latex += '^{';
      var beforeLength = ctx.latex.length;
      this.sup.latexRecursive(ctx);
      var afterLength = ctx.latex.length;
      if (beforeLength === afterLength) {
        ctx.latex += ' ';
      }
      ctx.latex += '}';
    }
    this.checkCursorContextClose(ctx);
  }
  text() {
    function text(prefix, block) {
      var l = (block && block.text()) || '';
      return block
        ? prefix + (l.length === 1 ? l : '(' + (l || ' ') + ')')
        : '';
    }
    return text('_', this.sub) + text('^', this.sup);
  }
  addBlock(block) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = this.sub.upOutOf = block;
      block.adopt(this, this.sub, 0).downOutOf = this.sub;
      block.setDOM(
        domFrag(h('span', { class: 'mq-sup' }))
          .append(block.domFrag().children())
          .prependTo(this.domFrag().oneElement())
          .oneElement()
      );
      NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
    } else {
      this.sub = this.downInto = this.sup.downOutOf = block;
      block.adopt(this, 0, this.sup).upOutOf = this.sup;
      this.domFrag().removeClass('mq-sup-only');
      block.setDOM(
        domFrag(h('span', { class: 'mq-sub' }))
          .append(block.domFrag().children())
          .appendTo(this.domFrag().oneElement())
          .oneElement()
      );
      NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
      this.domFrag().append(
        domFrag(
          h('span', { style: 'display:inline-block;width:0' }, [
            h.text(U_ZERO_WIDTH_SPACE),
          ])
        )
      );
    }
    for (var i = 0; i < 2; i += 1)
      (function (cmd, supsub, oppositeSupsub, updown) {
        var cmdSubSub = cmd[supsub];
        cmdSubSub.deleteOutOf = function (dir, cursor) {
          cursor.insDirOf(this[dir] ? -dir : dir, this.parent);
          if (!this.isEmpty()) {
            var end = this.getEnd(dir);
            this.children()
              .disown()
              .withDirAdopt(dir, cursor.parent, cursor[dir], cursor[-dir])
              .domFrag()
              .insDirOf(-dir, cursor.domFrag());
            cursor[-dir] = end;
          }
          cmd.supsub = oppositeSupsub;
          delete cmd[supsub];
          delete cmd[`${updown}Into`];
          var cmdOppositeSupsub = cmd[oppositeSupsub];
          cmdOppositeSupsub[`${updown}OutOf`] = insLeftOfMeUnlessAtEnd;
          delete cmdOppositeSupsub.deleteOutOf;
          if (supsub === 'sub') {
            cmd.domFrag().addClass('mq-sup-only').children().last().remove();
          }
          this.remove();
        };
      })(
        this,
        'sub sup'.split(' ')[i],
        'sup sub'.split(' ')[i],
        'down up'.split(' ')[i]
      );
  }
}
function insLeftOfMeUnlessAtEnd(cursor) {
  var cmd = this.parent;
  var ancestorCmd = cursor;
  do {
    if (ancestorCmd[R]) return cursor.insLeftOf(cmd);
    ancestorCmd = ancestorCmd.parent.parent;
  } while (ancestorCmd !== cmd);
  cursor.insRightOf(cmd);
  return undefined;
}
export class SubscriptCommand extends SupSub {
  constructor() {
    super(...arguments);
    this.supsub = 'sub';
    this.domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-supsub mq-non-leaf' }, [
        h.block('span', { class: 'mq-sub' }, blocks[0]),
        h('span', { style: 'display:inline-block;width:0' }, [
          h.text(U_ZERO_WIDTH_SPACE),
        ]),
      ])
    );
    this.textTemplate = ['_'];
    this.mathspeakTemplate = ['Subscript,', ', Baseline'];
    this.ariaLabel = 'subscript';
  }
  finalizeTree() {
    this.downInto = this.sub = this.getEnd(L);
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
    super.finalizeTree();
  }
}
LatexCmds.subscript = LatexCmds._ = SubscriptCommand;
LatexCmds.superscript =
  LatexCmds.supscript =
  LatexCmds['^'] =
    class SuperscriptCommand extends SupSub {
      constructor() {
        super(...arguments);
        this.supsub = 'sup';
        this.domView = new DOMView(1, (blocks) =>
          h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
            h.block('span', { class: 'mq-sup' }, blocks[0]),
          ])
        );
        this.textTemplate = ['^(', ')'];
        this.ariaLabel = 'superscript';
        this.mathspeakTemplate = ['Superscript,', ', Baseline'];
      }
      mathspeak(opts) {
        var child = this.upInto;
        if (child !== undefined) {
          var innerText = getCtrlSeqsFromBlock(child);
          if ((!opts || !opts.ignoreShorthand) && intRgx.test(innerText)) {
            if (innerText === '0') {
              return 'to the 0 power';
            } else if (innerText === '2') {
              return 'squared';
            } else if (innerText === '3') {
              return 'cubed';
            }
            var suffix = '';
            if (/^[+-]?\d{1,3}$/.test(innerText)) {
              if (/(11|12|13|4|5|6|7|8|9|0)$/.test(innerText)) {
                suffix = 'th';
              } else if (/1$/.test(innerText)) {
                suffix = 'st';
              } else if (/2$/.test(innerText)) {
                suffix = 'nd';
              } else if (/3$/.test(innerText)) {
                suffix = 'rd';
              }
            }
            var innerMathspeak =
              typeof child === 'object' ? child.mathspeak() : innerText;
            return 'to the ' + innerMathspeak + suffix + ' power';
          }
        }
        return super.mathspeak();
      }
      finalizeTree() {
        this.upInto = this.sup = this.getEnd(R);
        this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
        super.finalizeTree();
      }
    };
export class SummationNotation extends MathCommand {
  constructor(ch, symbol, ariaLabel) {
    super();
    this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
    var domView = new DOMView(2, (blocks) =>
      h('span', { class: 'mq-large-operator mq-non-leaf' }, [
        h('span', { class: 'mq-to' }, [h.block('span', {}, blocks[1])]),
        h('big', {}, [h.text(symbol)]),
        h('span', { class: 'mq-from' }, [h.block('span', {}, blocks[0])]),
      ])
    );
    MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(this, ch, domView);
  }
  createLeftOf(cursor) {
    super.createLeftOf(cursor);
    if (cursor.options.sumStartsWithNEquals) {
      new Letter('n').createLeftOf(cursor);
      new Equality().createLeftOf(cursor);
    }
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += this.ctrlSeq + '_{';
    var beforeLength = ctx.latex.length;
    this.getEnd(L).latexRecursive(ctx);
    var afterLength = ctx.latex.length;
    if (afterLength === beforeLength) {
      ctx.latex += ' ';
    }
    ctx.latex += '}^{';
    beforeLength = ctx.latex.length;
    this.getEnd(R).latexRecursive(ctx);
    afterLength = ctx.latex.length;
    if (beforeLength === afterLength) {
      ctx.latex += ' ';
    }
    ctx.latex += '}';
    this.checkCursorContextClose(ctx);
  }
  mathspeak() {
    return (
      'Start ' +
      this.ariaLabel +
      ' from ' +
      this.getEnd(L).mathspeak() +
      ' to ' +
      this.getEnd(R).mathspeak() +
      ', end ' +
      this.ariaLabel +
      ', '
    );
  }
  parser() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;
    var self = this;
    var blocks = (self.blocks = [new MathBlock(), new MathBlock()]);
    for (var i = 0; i < blocks.length; i += 1) {
      blocks[i].adopt(self, self.getEnd(R), 0);
    }
    return optWhitespace
      .then(string('_').or(string('^')))
      .then(function (supOrSub) {
        var child = blocks[supOrSub === '_' ? 0 : 1];
        return block.then(function (block) {
          block.children().adopt(child, child.getEnd(R), 0);
          return succeed(self);
        });
      })
      .many()
      .result(self);
  }
  finalizeTree() {
    var endsL = this.getEnd(L);
    var endsR = this.getEnd(R);
    endsL.ariaLabel = 'lower bound';
    endsR.ariaLabel = 'upper bound';
    this.downInto = endsL;
    this.upInto = endsR;
    endsL.upOutOf = endsR;
    endsR.downOutOf = endsL;
  }
}
LatexCmds['∑'] =
  LatexCmds.sum =
  LatexCmds.summation =
    () => new SummationNotation('\\sum ', U_NARY_SUMMATION, 'sum');
LatexCmds['∏'] =
  LatexCmds.prod =
  LatexCmds.product =
    () => new SummationNotation('\\prod ', U_NARY_PRODUCT, 'product');
LatexCmds.coprod = LatexCmds.coproduct = () =>
  new SummationNotation('\\coprod ', U_NARY_COPRODUCT, 'co product');
LatexCmds['∫'] =
  LatexCmds['int'] =
  LatexCmds.integral =
    class extends SummationNotation {
      constructor() {
        super('\\int ', '', 'integral');
        this.ariaLabel = 'integral';
        this.domView = new DOMView(2, (blocks) =>
          h('span', { class: 'mq-int mq-non-leaf' }, [
            h('big', {}, [h.text(U_INTEGRAL)]),
            h('span', { class: 'mq-supsub mq-non-leaf' }, [
              h('span', { class: 'mq-sup' }, [
                h.block('span', { class: 'mq-sup-inner' }, blocks[1]),
              ]),
              h.block('span', { class: 'mq-sub' }, blocks[0]),
              h('span', { style: 'display:inline-block;width:0' }, [
                h.text(U_ZERO_WIDTH_SPACE),
              ]),
            ]),
          ])
        );
      }
      createLeftOf(cursor) {
        MathCommand.prototype.createLeftOf.call(this, cursor);
      }
    };
var Fraction =
  (LatexCmds.frac =
  LatexCmds.dfrac =
  LatexCmds.cfrac =
  LatexCmds.fraction =
    class FracNode extends MathCommand {
      constructor() {
        super(...arguments);
        this.ctrlSeq = '\\frac';
        this.domView = new DOMView(2, (blocks) =>
          h('span', { class: 'mq-fraction mq-non-leaf' }, [
            h.block('span', { class: 'mq-numerator' }, blocks[0]),
            h.block('span', { class: 'mq-denominator' }, blocks[1]),
            h('span', { style: 'display:inline-block;width:0' }, [
              h.text(U_ZERO_WIDTH_SPACE),
            ]),
          ])
        );
        this.textTemplate = ['(', ')/(', ')'];
      }
      finalizeTree() {
        var endsL = this.getEnd(L);
        var endsR = this.getEnd(R);
        this.upInto = endsR.upOutOf = endsL;
        this.downInto = endsL.downOutOf = endsR;
        endsL.ariaLabel = 'numerator';
        endsR.ariaLabel = 'denominator';
        if (this.getFracDepth() > 1) {
          this.mathspeakTemplate = [
            'StartNestedFraction,',
            'NestedOver',
            ', EndNestedFraction',
          ];
        } else {
          this.mathspeakTemplate = ['StartFraction,', 'Over', ', EndFraction'];
        }
      }
      mathspeak(opts) {
        if (opts && opts.createdLeftOf) {
          var cursor = opts.createdLeftOf;
          return cursor.parent.mathspeak();
        }
        var numText = getCtrlSeqsFromBlock(this.getEnd(L));
        var denText = getCtrlSeqsFromBlock(this.getEnd(R));
        if (
          (!opts || !opts.ignoreShorthand) &&
          intRgx.test(numText) &&
          intRgx.test(denText)
        ) {
          var isSingular = numText === '1' || numText === '-1';
          var newDenSpeech = '';
          if (denText === '2') {
            newDenSpeech = isSingular ? 'half' : 'halves';
          } else if (denText === '3') {
            newDenSpeech = isSingular ? 'third' : 'thirds';
          } else if (denText === '4') {
            newDenSpeech = isSingular ? 'quarter' : 'quarters';
          } else if (denText === '5') {
            newDenSpeech = isSingular ? 'fifth' : 'fifths';
          } else if (denText === '6') {
            newDenSpeech = isSingular ? 'sixth' : 'sixths';
          } else if (denText === '7') {
            newDenSpeech = isSingular ? 'seventh' : 'sevenths';
          } else if (denText === '8') {
            newDenSpeech = isSingular ? 'eighth' : 'eighths';
          } else if (denText === '9') {
            newDenSpeech = isSingular ? 'ninth' : 'ninths';
          }
          if (newDenSpeech !== '') {
            var output = '';
            var precededByInteger = false;
            for (
              var sibling = this[L];
              sibling && sibling[L] !== undefined;
              sibling = sibling[L]
            ) {
              if (sibling.ctrlSeq === '\\ ') {
                continue;
              } else if (intRgx.test(sibling.ctrlSeq || '')) {
                precededByInteger = true;
              } else {
                precededByInteger = false;
                break;
              }
            }
            if (precededByInteger) {
              output += 'and ';
            }
            output += this.getEnd(L).mathspeak() + ' ' + newDenSpeech;
            return output;
          }
        }
        return super.mathspeak();
      }
      getFracDepth() {
        var level = 0;
        var walkUp = function (item, level) {
          if (
            item instanceof MQNode &&
            item.ctrlSeq &&
            item.ctrlSeq.toLowerCase().search('frac') >= 0
          )
            level += 1;
          if (item && item.parent) return walkUp(item.parent, level);
          else return level;
        };
        return walkUp(this, level);
      }
    });
var LiveFraction =
  (LatexCmds.over =
  CharCmds['/'] =
    class extends Fraction {
      createLeftOf(cursor) {
        if (!this.replacedFragment) {
          var leftward = cursor[L];
          if (!cursor.options.typingSlashCreatesNewFraction) {
            while (
              leftward &&
              !(
                leftward instanceof BinaryOperator ||
                leftward instanceof (LatexCmds.text || noop) ||
                leftward instanceof SummationNotation ||
                leftward.ctrlSeq === '\\ ' ||
                /^[,;:]$/.test(leftward.ctrlSeq)
              )
            )
              leftward = leftward[L];
          }
          if (
            leftward instanceof SummationNotation &&
            leftward[R] instanceof SupSub
          ) {
            leftward = leftward[R];
            const leftwardR = leftward[R];
            if (
              leftwardR instanceof SupSub &&
              leftwardR.ctrlSeq != leftward.ctrlSeq
            )
              leftward = leftward[R];
          }
          if (leftward !== cursor[L] && !cursor.isTooDeep(1)) {
            const leftwardR = leftward[R];
            const cursorL = cursor[L];
            this.replaces(
              new Fragment(leftwardR || cursor.parent.getEnd(L), cursorL)
            );
            cursor[L] = leftward;
          }
        }
        super.createLeftOf(cursor);
      }
    });
export var AnsBuilder = () =>
  new MQSymbol(
    '\\operatorname{ans}',
    h('span', { class: 'mq-ans' }, [h.text('ans')]),
    'ans'
  );
LatexCmds.ans = AnsBuilder;
export var PercentOfBuilder = () =>
  new MQSymbol(
    '\\%\\operatorname{of}',
    h('span', { class: 'mq-nonSymbola mq-operator-name' }, [h.text('% of ')]),
    'percent of'
  );
LatexCmds.percent = LatexCmds.percentof = PercentOfBuilder;
class Token extends MQSymbol {
  constructor() {
    super(...arguments);
    this.tokenId = '';
    this.ctrlSeq = '\\token';
    this.textTemplate = ['token(', ')'];
    this.mathspeakTemplate = ['StartToken,', ', EndToken'];
    this.ariaLabel = 'token';
  }
  html() {
    var out = h('span', {
      class: 'mq-token mq-ignore-mousedown',
      'data-mq-token': this.tokenId,
    });
    this.setDOM(out);
    NodeBase.linkElementByCmdNode(out, this);
    return out;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += '\\token{' + this.tokenId + '}';
    this.checkCursorContextClose(ctx);
  }
  mathspeak() {
    var ariaLabelArray = [];
    this.domFrag()
      .children()
      .eachElement((el) => {
        var label = el.getAttribute('aria-label');
        if (typeof label === 'string' && label !== '')
          ariaLabelArray.push(label);
      });
    return ariaLabelArray.length > 0
      ? ariaLabelArray.join(' ').trim()
      : 'token ' + this.tokenId;
  }
  parser() {
    var self = this;
    return latexMathParser.block.map(function (block) {
      var digit = block.getEnd(L);
      if (digit) {
        self.tokenId += digit.ctrlSeq;
        while ((digit = digit[R])) {
          self.tokenId += digit.ctrlSeq;
        }
      }
      return self;
    });
  }
}
LatexCmds.token = Token;
class SquareRoot extends MathCommand {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\sqrt';
    this.domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf mq-sqrt-container' }, [
        h('span', { class: 'mq-scaled mq-sqrt-prefix' }, [
          SVG_SYMBOLS.sqrt.html(),
        ]),
        h.block('span', { class: 'mq-non-leaf mq-sqrt-stem' }, blocks[0]),
      ])
    );
    this.textTemplate = ['sqrt(', ')'];
    this.mathspeakTemplate = ['StartRoot,', ', EndRoot'];
    this.ariaLabel = 'root';
  }
  parser() {
    return latexMathParser.optBlock
      .then(function (optBlock) {
        return latexMathParser.block.map(function (block) {
          var nthroot = new NthRoot();
          nthroot.blocks = [optBlock, block];
          optBlock.adopt(nthroot, 0, 0);
          block.adopt(nthroot, optBlock, 0);
          return nthroot;
        });
      })
      .or(super.parser());
  }
}
LatexCmds.sqrt = SquareRoot;
LatexCmds.hat = class Hat extends MathCommand {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\hat';
    this.domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-hat-prefix' }, [h.text('^')]),
        h.block('span', { class: 'mq-hat-stem' }, blocks[0]),
      ])
    );
    this.textTemplate = ['hat(', ')'];
  }
};
class NthRoot extends SquareRoot {
  constructor() {
    super(...arguments);
    this.domView = new DOMView(2, (blocks) =>
      h('span', { class: 'mq-nthroot-container mq-non-leaf' }, [
        h.block('sup', { class: 'mq-nthroot mq-non-leaf' }, blocks[0]),
        h('span', { class: 'mq-scaled mq-sqrt-container' }, [
          h('span', { class: 'mq-sqrt-prefix mq-scaled' }, [
            SVG_SYMBOLS.sqrt.html(),
          ]),
          h.block('span', { class: 'mq-sqrt-stem mq-non-leaf' }, blocks[1]),
        ]),
      ])
    );
    this.textTemplate = ['sqrt[', '](', ')'];
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += '\\sqrt[';
    this.getEnd(L).latexRecursive(ctx);
    ctx.latex += ']{';
    this.getEnd(R).latexRecursive(ctx);
    ctx.latex += '}';
    this.checkCursorContextClose(ctx);
  }
  mathspeak() {
    var indexMathspeak = this.getEnd(L).mathspeak();
    var radicandMathspeak = this.getEnd(R).mathspeak();
    this.getEnd(L).ariaLabel = 'Index';
    this.getEnd(R).ariaLabel = 'Radicand';
    if (indexMathspeak === '3') {
      return 'Start Cube Root, ' + radicandMathspeak + ', End Cube Root';
    } else {
      return (
        'Root Index ' +
        indexMathspeak +
        ', Start Root, ' +
        radicandMathspeak +
        ', End Root'
      );
    }
  }
}
LatexCmds.nthroot = NthRoot;
LatexCmds.cbrt = class extends NthRoot {
  createLeftOf(cursor) {
    super.createLeftOf(cursor);
    new Digit('3').createLeftOf(cursor);
    cursor.controller.moveRight();
  }
};
class DiacriticAbove extends MathCommand {
  constructor(ctrlSeq, html, textTemplate) {
    var domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-diacritic-above' }, [html]),
        h.block('span', { class: 'mq-diacritic-stem' }, blocks[0]),
      ])
    );
    super(ctrlSeq, domView, textTemplate);
  }
}
LatexCmds.vec = () =>
  new DiacriticAbove('\\vec', h.entityText('&rarr;'), ['vec(', ')']);
LatexCmds.tilde = () =>
  new DiacriticAbove('\\tilde', h.text('~'), ['tilde(', ')']);
class DelimsNode extends MathCommand {
  setDOM(el) {
    super.setDOM(el);
    var children = this.domFrag().children();
    if (!children.isEmpty()) {
      this.delimFrags = {
        [L]: children.first(),
        [R]: children.last(),
      };
    }
    return this;
  }
}
export class Bracket extends DelimsNode {
  constructor(side, open, close, ctrlSeq, end) {
    super('\\left' + ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {
      [L]: { ch: open, ctrlSeq: ctrlSeq },
      [R]: { ch: close, ctrlSeq: end },
    };
  }
  numBlocks() {
    return 1;
  }
  html() {
    var leftSymbol = this.getSymbol(L);
    var rightSymbol = this.getSymbol(R);
    this.domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
        h(
          'span',
          {
            style: 'width:' + leftSymbol.width,
            class:
              'mq-scaled mq-bracket-l mq-paren' +
              (this.side === R ? ' mq-ghost' : ''),
          },
          [leftSymbol.html()]
        ),
        h.block(
          'span',
          {
            style:
              'margin-left:' +
              leftSymbol.width +
              ';margin-right:' +
              rightSymbol.width,
            class: 'mq-bracket-middle mq-non-leaf',
          },
          blocks[0]
        ),
        h(
          'span',
          {
            style: 'width:' + rightSymbol.width,
            class:
              'mq-scaled mq-bracket-r mq-paren' +
              (this.side === L ? ' mq-ghost' : ''),
          },
          [rightSymbol.html()]
        ),
      ])
    );
    return super.html();
  }
  getSymbol(side) {
    var ch = this.sides[side || R].ch;
    return SVG_SYMBOLS[ch] || { width: '0', html: '' };
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += '\\left' + this.sides[L].ctrlSeq;
    this.getEnd(L).latexRecursive(ctx);
    ctx.latex += '\\right' + this.sides[R].ctrlSeq;
    this.checkCursorContextClose(ctx);
  }
  mathspeak(opts) {
    var open = this.sides[L].ch,
      close = this.sides[R].ch;
    if (open === '|' && close === '|') {
      this.mathspeakTemplate = ['StartAbsoluteValue,', ', EndAbsoluteValue'];
      this.ariaLabel = 'absolute value';
    } else if (opts && opts.createdLeftOf && this.side) {
      var ch = '';
      if (this.side === L) ch = this.textTemplate[0];
      else if (this.side === R) ch = this.textTemplate[1];
      return (this.side === L ? 'left ' : 'right ') + BRACKET_NAMES[ch];
    } else {
      this.mathspeakTemplate = [
        'left ' + BRACKET_NAMES[open] + ',',
        ', right ' + BRACKET_NAMES[close],
      ];
      this.ariaLabel = BRACKET_NAMES[open] + ' block';
    }
    return super.mathspeak();
  }
  matchBrack(opts, expectedSide, node) {
    return (
      node instanceof Bracket &&
      node.side &&
      node.side !== -expectedSide &&
      (!opts.restrictMismatchedBrackets ||
        OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch ||
        { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) &&
      node
    );
  }
  closeOpposing(brack) {
    brack.side = 0;
    brack.sides[this.side] = this.sides[this.side];
    var brackFrag =
      brack.delimFrags[this.side === L ? L : R].removeClass('mq-ghost');
    this.replaceBracket(brackFrag, this.side);
  }
  createLeftOf(cursor) {
    var brack;
    var side;
    if (!this.replacedFragment) {
      var opts = cursor.options;
      if (this.sides[L].ch === '|') {
        brack =
          this.matchBrack(opts, R, cursor[R]) ||
          this.matchBrack(opts, L, cursor[L]) ||
          this.matchBrack(opts, 0, cursor.parent.parent);
      } else {
        brack =
          this.matchBrack(opts, -this.side, cursor[-this.side]) ||
          this.matchBrack(opts, -this.side, cursor.parent.parent);
      }
    }
    if (brack) {
      side = this.side = -brack.side;
      this.closeOpposing(brack);
      if (brack === cursor.parent.parent && cursor[side]) {
        new Fragment(cursor[side], cursor.parent.getEnd(side), -side)
          .disown()
          .withDirAdopt(-side, brack.parent, brack, brack[side])
          .domFrag()
          .insDirOf(side, brack.domFrag());
      }
      brack.bubble(function (node) {
        node.reflow();
        return undefined;
      });
    } else {
      (brack = this), (side = brack.side);
      if (brack.replacedFragment) brack.side = 0;
      else if (cursor[-side]) {
        brack.replaces(
          new Fragment(cursor[-side], cursor.parent.getEnd(-side), side)
        );
        cursor[-side] = 0;
      }
      super.createLeftOf(cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.getEnd(L));
    else cursor.insRightOf(brack);
  }
  placeCursor() {}
  unwrap() {
    this.getEnd(L)
      .children()
      .disown()
      .adopt(this.parent, this, this[R])
      .domFrag()
      .insertAfter(this.domFrag());
    this.remove();
  }
  deleteSide(side, outward, cursor) {
    var parent = this.parent,
      sib = this[side],
      farEnd = parent.getEnd(side);
    if (side === this.side) {
      this.unwrap();
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
      return;
    }
    var opts = cursor.options,
      wasSolid = !this.side;
    this.side = -side;
    if (this.matchBrack(opts, side, this.getEnd(L).getEnd(this.side))) {
      this.closeOpposing(this.getEnd(L).getEnd(this.side));
      var origEnd = this.getEnd(L).getEnd(side);
      this.unwrap();
      if (origEnd) origEnd.siblingCreated(cursor.options, side);
      if (sib) {
        cursor.insDirOf(-side, sib);
      } else {
        cursor.insAtDirEnd(side, parent);
      }
    } else {
      if (this.matchBrack(opts, side, this.parent.parent)) {
        this.parent.parent.closeOpposing(this);
        this.parent.parent.unwrap();
      } else if (outward && wasSolid) {
        this.unwrap();
        sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
        return;
      } else {
        this.sides[side] = getOppBracketSide(this);
        this.delimFrags[L].removeClass('mq-ghost');
        this.delimFrags[R].removeClass('mq-ghost');
        var brackFrag = this.delimFrags[side].addClass('mq-ghost');
        this.replaceBracket(brackFrag, side);
      }
      if (sib) {
        var leftEnd = this.getEnd(L);
        var origEnd = leftEnd.getEnd(side);
        leftEnd.domFrag().removeClass('mq-empty');
        new Fragment(sib, farEnd, -side)
          .disown()
          .withDirAdopt(-side, leftEnd, origEnd, 0)
          .domFrag()
          .insAtDirEnd(side, leftEnd.domFrag().oneElement());
        if (origEnd) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side, sib);
      } else
        outward
          ? cursor.insDirOf(side, this)
          : cursor.insAtDirEnd(side, this.getEnd(L));
    }
  }
  replaceBracket(brackFrag, side) {
    var symbol = this.getSymbol(side);
    brackFrag.children().replaceWith(domFrag(symbol.html()));
    brackFrag.oneElement().style.width = symbol.width;
    if (side === L) {
      var next = brackFrag.next();
      if (!next.isEmpty()) {
        next.oneElement().style.marginLeft = symbol.width;
      }
    } else {
      var prev = brackFrag.prev();
      if (!prev.isEmpty()) {
        prev.oneElement().style.marginRight = symbol.width;
      }
    }
  }
  deleteTowards(dir, cursor) {
    this.deleteSide(-dir, false, cursor);
  }
  finalizeTree() {
    this.getEnd(L).deleteOutOf = function (dir, cursor) {
      this.parent.deleteSide(dir, true, cursor);
    };
    this.finalizeTree = this.intentionalBlur = function () {
      this.delimFrags[this.side === L ? R : L].removeClass('mq-ghost');
      this.side = 0;
    };
  }
  siblingCreated(_opts, dir) {
    if (dir === -this.side) this.finalizeTree();
  }
}
function getOppBracketSide(bracket) {
  var side = bracket.side;
  var data = bracket.sides[side];
  return {
    ch: OPP_BRACKS[data.ch],
    ctrlSeq: OPP_BRACKS[data.ctrlSeq],
  };
}
var OPP_BRACKS = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '\\{': '\\}',
  '\\}': '\\{',
  '&lang;': '&rang;',
  '&rang;': '&lang;',
  '\\langle ': '\\rangle ',
  '\\rangle ': '\\langle ',
  '|': '|',
  '\\lVert ': '\\rVert ',
  '\\rVert ': '\\lVert ',
};
var BRACKET_NAMES = {
  '&lang;': 'angle-bracket',
  '&rang;': 'angle-bracket',
  '|': 'pipe',
};
function bindCharBracketPair(open, ctrlSeq, name) {
  ctrlSeq = ctrlSeq || open;
  var close = OPP_BRACKS[open];
  var end = OPP_BRACKS[ctrlSeq];
  CharCmds[open] = () => new Bracket(L, open, close, ctrlSeq, end);
  CharCmds[close] = () => new Bracket(R, open, close, ctrlSeq, end);
  BRACKET_NAMES[open] = BRACKET_NAMES[close] = name;
}
bindCharBracketPair('(', '', 'parenthesis');
bindCharBracketPair('[', '', 'bracket');
bindCharBracketPair('{', '\\{', 'brace');
LatexCmds.langle = () =>
  new Bracket(L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = () =>
  new Bracket(R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = () => new Bracket(L, '|', '|', '|', '|');
LatexCmds.lVert = () =>
  new Bracket(L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.rVert = () =>
  new Bracket(R, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.left = class extends MathCommand {
  parser() {
    var regex = Parser.regex;
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(regex(/^(?:[([|]|\\\{|\\langle(?![a-zA-Z])|\\lVert(?![a-zA-Z]))/))
      .then(function (ctrlSeq) {
        var open = ctrlSeq.replace(/^\\/, '');
        if (ctrlSeq == '\\langle') {
          open = '&lang;';
          ctrlSeq = ctrlSeq + ' ';
        }
        if (ctrlSeq == '\\lVert') {
          open = '&#8741;';
          ctrlSeq = ctrlSeq + ' ';
        }
        return latexMathParser.then(function (block) {
          return string('\\right')
            .skip(optWhitespace)
            .then(
              regex(/^(?:[\])|]|\\\}|\\rangle(?![a-zA-Z])|\\rVert(?![a-zA-Z]))/)
            )
            .map(function (end) {
              var close = end.replace(/^\\/, '');
              if (end == '\\rangle') {
                close = '&rang;';
                end = end + ' ';
              }
              if (end == '\\rVert') {
                close = '&#8741;';
                end = end + ' ';
              }
              var cmd = new Bracket(0, open, close, ctrlSeq, end);
              cmd.blocks = [block];
              block.adopt(cmd, 0, 0);
              return cmd;
            });
        });
      });
  }
};
LatexCmds.right = class extends MathCommand {
  parser() {
    return Parser.fail('unmatched \\right');
  }
};
var leftBinomialSymbol = SVG_SYMBOLS['('];
var rightBinomialSymbol = SVG_SYMBOLS[')'];
class Binomial extends DelimsNode {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\binom';
    this.domView = new DOMView(2, (blocks) =>
      h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
        h(
          'span',
          {
            style: 'width:' + leftBinomialSymbol.width,
            class: 'mq-paren mq-bracket-l mq-scaled',
          },
          [leftBinomialSymbol.html()]
        ),
        h(
          'span',
          {
            style:
              'margin-left:' +
              leftBinomialSymbol.width +
              '; margin-right:' +
              rightBinomialSymbol.width,
            class: 'mq-non-leaf mq-bracket-middle',
          },
          [
            h('span', { class: 'mq-array mq-non-leaf' }, [
              h.block('span', {}, blocks[0]),
              h.block('span', {}, blocks[1]),
            ]),
          ]
        ),
        h(
          'span',
          {
            style: 'width:' + rightBinomialSymbol.width,
            class: 'mq-paren mq-bracket-r mq-scaled',
          },
          [rightBinomialSymbol.html()]
        ),
      ])
    );
    this.textTemplate = ['choose(', ',', ')'];
    this.mathspeakTemplate = ['StartBinomial,', 'Choose', ', EndBinomial'];
    this.ariaLabel = 'binomial';
  }
}
LatexCmds.binom = LatexCmds.binomial = Binomial;
LatexCmds.choose = class extends Binomial {
  createLeftOf(cursor) {
    LiveFraction.prototype.createLeftOf(cursor);
  }
};
class MathFieldNode extends MathCommand {
  constructor() {
    super(...arguments);
    this.ctrlSeq = '\\MathQuillMathField';
    this.domView = new DOMView(1, (blocks) => {
      return h('span', { class: 'mq-editable-field' }, [
        h.block(
          'span',
          { class: 'mq-root-block', 'aria-hidden': 'true' },
          blocks[0]
        ),
      ]);
    });
  }
  parser() {
    var self = this,
      string = Parser.string,
      regex = Parser.regex,
      succeed = Parser.succeed;
    return string('[')
      .then(regex(/^[a-z][a-z0-9]*/i))
      .skip(string(']'))
      .map(function (name) {
        self.name = name;
      })
      .or(succeed(undefined))
      .then(super.parser());
  }
  finalizeTree(options) {
    var ctrlr = new Controller(
      this.getEnd(L),
      this.domFrag().oneElement(),
      options
    );
    ctrlr.KIND_OF_MQ = 'MathField';
    ctrlr.editable = true;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(ctrlr.root);
    RootBlockMixin(ctrlr.root);
    function pushDownAriaHidden(node) {
      if (node.parentNode && !domFrag(node).hasClass('mq-root-block')) {
        pushDownAriaHidden(node.parentNode);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        var element = node;
        if (element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          domFrag(node)
            .children()
            .eachElement((child) => {
              child.setAttribute('aria-hidden', 'true');
            });
        }
      }
    }
    pushDownAriaHidden(this.domFrag().parent().oneElement());
    this.domFrag().oneElement().removeAttribute('aria-hidden');
  }
  registerInnerField(innerFields, MathField) {
    var controller = this.getEnd(L).controller;
    var newField = new MathField(controller);
    innerFields[this.name] = newField;
    innerFields.push(newField);
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    this.getEnd(L).latexRecursive(ctx);
    this.checkCursorContextClose(ctx);
  }
  text() {
    return this.getEnd(L).text();
  }
}
LatexCmds.editable = LatexCmds.MathQuillMathField = MathFieldNode;
export class EmbedNode extends MQSymbol {
  setOptions(options) {
    function noop() {
      return '';
    }
    this.text = options.text || noop;
    this.domView = new DOMView(0, () =>
      h('span', {}, [parseHTML(options.htmlString || '')])
    );
    this.latex = options.latex || noop;
    return this;
  }
  latexRecursive(ctx) {
    this.checkCursorContextOpen(ctx);
    ctx.latex += this.latex();
    this.checkCursorContextClose(ctx);
  }
  parser() {
    var self = this,
      string = Parser.string,
      regex = Parser.regex,
      succeed = Parser.succeed;
    return string('{')
      .then(regex(/^[a-z][a-z0-9]*/i))
      .skip(string('}'))
      .then(function (name) {
        return string('[')
          .then(regex(/^[-\w\s]*/))
          .skip(string(']'))
          .or(succeed(undefined))
          .map(function (data) {
            return self.setOptions(EMBEDS[name](data));
          });
      });
  }
}
LatexCmds.embed = EmbedNode;
