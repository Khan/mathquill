import {
  AnsBuilder,
  BinaryOperator,
  Bracket,
  CharCmds,
  DOMView,
  Fragment,
  L,
  LatexCmds,
  MQSymbol,
  MathBlock,
  MathCommand,
  Options,
  Parser,
  PercentOfBuilder,
  R,
  SubscriptCommand,
  SummationNotation,
  SupSub,
  U_NO_BREAK_SPACE,
  VanillaSymbol,
  baseOptionProcessors,
  bindBinaryOperator,
  bindVanillaSymbol,
  domFrag,
  h,
  isMQNodeClass,
  latexMathParser,
  max,
  min,
} from '../../bundle';
class DigitGroupingChar extends MQSymbol {
  finalizeTree(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  siblingDeleted(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  siblingCreated(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  sharedSiblingMethod(opts, dir) {
    if (dir !== L && this[R] instanceof DigitGroupingChar) return;
    this.fixDigitGrouping(opts);
  }
  fixDigitGrouping(opts) {
    if (!opts.enableDigitGrouping) return;
    var left = this;
    var right = this;
    var spacesFound = 0;
    var dots = [];
    var SPACE = '\\ ';
    var DOT = '.';
    var node = left;
    do {
      if (/^[0-9]$/.test(node.ctrlSeq)) {
        left = node;
      } else if (node.ctrlSeq === SPACE) {
        left = node;
        spacesFound += 1;
      } else if (node.ctrlSeq === DOT) {
        left = node;
        dots.push(node);
      } else {
        break;
      }
    } while ((node = left[L]));
    while ((node = right[R])) {
      if (/^[0-9]$/.test(node.ctrlSeq)) {
        right = node;
      } else if (node.ctrlSeq === SPACE) {
        right = node;
        spacesFound += 1;
      } else if (node.ctrlSeq === DOT) {
        right = node;
        dots.push(node);
      } else {
        break;
      }
    }
    while (right !== left && left && left.ctrlSeq === SPACE) {
      left = left[R];
      spacesFound -= 1;
    }
    while (right !== left && right && right.ctrlSeq === SPACE) {
      right = right[L];
      spacesFound -= 1;
    }
    if (left === right && left && left.ctrlSeq === SPACE) return;
    var disableFormatting = spacesFound > 0 || dots.length > 1;
    if (disableFormatting) {
      this.removeGroupingBetween(left, right);
    } else if (dots[0]) {
      if (dots[0] !== left) {
        this.addGroupingBetween(dots[0][L], left);
      }
      if (dots[0] !== right) {
        this.removeGroupingBetween(dots[0][R], right);
      }
    } else {
      this.addGroupingBetween(right, left);
    }
  }
  removeGroupingBetween(left, right) {
    var node = left;
    do {
      if (node instanceof DigitGroupingChar) {
        node.setGroupingClass(undefined);
      }
      if (!node || node === right) break;
    } while ((node = node[R]));
  }
  addGroupingBetween(start, end) {
    var node = start;
    var count = 0;
    var totalDigits = 0;
    while (node) {
      totalDigits += 1;
      if (node === end) break;
      node = node[L];
    }
    var numDigitsInFirstGroup = totalDigits % 3;
    if (numDigitsInFirstGroup === 0) numDigitsInFirstGroup = 3;
    node = start;
    while (node) {
      count += 1;
      var cls = undefined;
      if (totalDigits >= 4) {
        if (count === totalDigits) {
          cls = 'mq-group-leading-' + numDigitsInFirstGroup;
        } else if (count % 3 === 0) {
          if (count !== totalDigits) {
            cls = 'mq-group-start';
          }
        }
        if (!cls) {
          cls = 'mq-group-other';
        }
      }
      if (node instanceof DigitGroupingChar) {
        node.setGroupingClass(cls);
      }
      if (node === end) break;
      node = node[L];
    }
  }
  setGroupingClass(cls) {
    if (this._groupingClass === cls) return;
    if (this._groupingClass) this.domFrag().removeClass(this._groupingClass);
    if (cls) this.domFrag().addClass(cls);
    this._groupingClass = cls;
  }
}
export class Digit extends DigitGroupingChar {
  constructor(ch, mathspeak) {
    super(
      ch,
      h('span', { class: 'mq-digit' }, [h.text(ch)]),
      undefined,
      mathspeak
    );
  }
  createLeftOf(cursor) {
    var cursorL = cursor[L];
    var cursorLL = cursorL && cursorL[L];
    var cursorParentParentSub =
      cursor.parent.parent instanceof SupSub
        ? cursor.parent.parent.sub
        : undefined;
    if (
      cursor.options.autoSubscriptNumerals &&
      cursor.parent !== cursorParentParentSub &&
      ((cursorL instanceof letiable && cursorL.isItalic !== false) ||
        (cursorL instanceof SupSub &&
          cursorLL instanceof letiable &&
          cursorLL.isItalic !== false))
    ) {
      new SubscriptCommand().createLeftOf(cursor);
      super.createLeftOf(cursor);
      cursor.insRightOf(cursor.parent.parent);
    } else super.createLeftOf(cursor);
  }
  mathspeak(opts) {
    if (opts && opts.createdLeftOf) {
      var cursor = opts.createdLeftOf;
      var cursorL = cursor[L];
      var cursorLL = cursorL && cursorL[L];
      var cursorParentParentSub =
        cursor.parent.parent instanceof SupSub
          ? cursor.parent.parent.sub
          : undefined;
      if (
        cursor.options.autoSubscriptNumerals &&
        cursor.parent !== cursorParentParentSub &&
        ((cursorL instanceof letiable && cursorL.isItalic !== false) ||
          (cursor[L] instanceof SupSub &&
            cursorLL instanceof letiable &&
            cursorLL.isItalic !== false))
      ) {
        return 'Subscript ' + super.mathspeak() + ' Baseline';
      }
    }
    return super.mathspeak();
  }
}
class letiable extends MQSymbol {
  constructor(chOrCtrlSeq, html) {
    super(chOrCtrlSeq, h('var', {}, [html || h.text(chOrCtrlSeq)]));
  }
  text() {
    var text = this.ctrlSeq || '';
    if (this.isPartOfOperator) {
      if (text[0] == '\\') {
        text = text.slice(1, text.length);
      } else if (text[text.length - 1] == ' ') {
        text = text.slice(0, -1);
      }
    } else {
      if (
        this[L] &&
        !(this[L] instanceof letiable) &&
        !(this[L] instanceof BinaryOperator) &&
        this[L].ctrlSeq !== '\\ '
      )
        text = '*' + text;
      if (
        this[R] &&
        !(this[R] instanceof BinaryOperator) &&
        !(this[R] instanceof SupSub)
      )
        text += '*';
    }
    return text;
  }
  mathspeak() {
    var text = this.ctrlSeq || '';
    if (
      this.isPartOfOperator ||
      text.length > 1 ||
      (this.parent && this.parent.parent && this.parent.parent.isTextBlock())
    ) {
      return super.mathspeak();
    } else {
      return '"' + text + '"';
    }
  }
}
function bindletiable(ch, htmlEntity, _unusedMathspeak) {
  return () => new letiable(ch, h.entityText(htmlEntity));
}
Options.prototype.autoCommands = {
  _maxLength: 0,
};
baseOptionProcessors.autoCommands = function (cmds) {
  if (typeof cmds !== 'string' || !/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"' + cmds + '" not a space-delimited list of only letters';
  }
  var list = cmds.split(' ');
  var dict = {};
  var maxLength = 0;
  for (var i = 0; i < list.length; i += 1) {
    var cmd = list[i];
    if (cmd.length < 2) {
      throw 'autocommand "' + cmd + '" not minimum length of 2';
    }
    if (LatexCmds[cmd] === OperatorName) {
      throw '"' + cmd + '" is a built-in operator name';
    }
    dict[cmd] = 1;
    maxLength = max(maxLength, cmd.length);
  }
  dict._maxLength = maxLength;
  return dict;
};
Options.prototype.quietEmptyDelimiters = {};
baseOptionProcessors.quietEmptyDelimiters = function (dlms = '') {
  var list = dlms.split(' ');
  var dict = {};
  for (var i = 0; i < list.length; i += 1) {
    var dlm = list[i];
    dict[dlm] = 1;
  }
  return dict;
};
Options.prototype.autoParenthesizedFunctions = { _maxLength: 0 };
baseOptionProcessors.autoParenthesizedFunctions = function (cmds) {
  if (typeof cmds !== 'string' || !/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"' + cmds + '" not a space-delimited list of only letters';
  }
  var list = cmds.split(' ');
  var dict = {};
  var maxLength = 0;
  for (var i = 0; i < list.length; i += 1) {
    var cmd = list[i];
    if (cmd.length < 2) {
      throw 'autocommand "' + cmd + '" not minimum length of 2';
    }
    dict[cmd] = 1;
    maxLength = max(maxLength, cmd.length);
  }
  dict._maxLength = maxLength;
  return dict;
};
export class Letter extends letiable {
  constructor(ch) {
    super(ch);
    this.letter = ch;
  }
  checkAutoCmds(cursor) {
    if (this.shouldIgnoreSubstitutionInSimpleSubscript(cursor.options)) {
      return;
    }
    var autoCmds = cursor.options.autoCommands;
    var maxLength = autoCmds._maxLength || 0;
    if (maxLength > 0) {
      var str = '';
      var l = this;
      var i = 0;
      while (l instanceof Letter && l.ctrlSeq === l.letter && i < maxLength) {
        str = l.letter + str;
        l = l[L];
        i += 1;
      }
      while (str.length) {
        if (autoCmds.hasOwnProperty(str)) {
          l = this;
          for (i = 1; l && i < str.length; i += 1, l = l[L]);
          new Fragment(l, this).remove();
          cursor[L] = l[L];
          var cmd = LatexCmds[str];
          var node;
          if (isMQNodeClass(cmd)) {
            node = new cmd(str);
          } else {
            node = cmd(str);
          }
          return node.createLeftOf(cursor);
        }
        str = str.slice(1);
      }
    }
  }
  autoParenthesize(cursor) {
    var right = cursor.parent.getEnd(R);
    if (right && right instanceof Bracket && right.ctrlSeq === '\\left(') {
      return;
    }
    if (this.shouldIgnoreSubstitutionInSimpleSubscript(cursor.options)) {
      return;
    }
    var str = '';
    var l = this;
    var i = 0;
    var autoParenthesizedFunctions = cursor.options.autoParenthesizedFunctions;
    var maxLength = autoParenthesizedFunctions._maxLength || 0;
    var autoOperatorNames = cursor.options.autoOperatorNames;
    while (l instanceof Letter && i < maxLength) {
      (str = l.letter + str), (l = l[L]), (i += 1);
    }
    while (str.length) {
      if (
        autoParenthesizedFunctions.hasOwnProperty(str) &&
        autoOperatorNames.hasOwnProperty(str)
      ) {
        return cursor.parent.write(cursor, '(');
      }
      str = str.slice(1);
    }
  }
  createLeftOf(cursor) {
    super.createLeftOf(cursor);
    this.checkAutoCmds(cursor);
    this.autoParenthesize(cursor);
  }
  italicize(bool) {
    this.isItalic = bool;
    this.isPartOfOperator = !bool;
    this.domFrag().toggleClass('mq-operator-name', !bool);
    return this;
  }
  finalizeTree(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  siblingDeleted(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  siblingCreated(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  sharedSiblingMethod(opts, dir) {
    if (dir !== L && this[R] instanceof Letter) return;
    this.autoUnItalicize(opts);
  }
  autoUnItalicize(opts) {
    var autoOps = opts.autoOperatorNames;
    if (autoOps._maxLength === 0) return;
    if (this.shouldIgnoreSubstitutionInSimpleSubscript(opts)) {
      return;
    }
    var str = this.letter;
    var l;
    var r;
    for (l = this[L]; l instanceof Letter; l = l[L]) str = l.letter + str;
    for (r = this[R]; r instanceof Letter; r = r[R]) str += r.letter;
    var lR = l && l[R];
    var rL = r && r[L];
    new Fragment(lR || this.parent.getEnd(L), rL || this.parent.getEnd(R)).each(
      function (el) {
        if (el instanceof Letter) {
          el.italicize(true)
            .domFrag()
            .removeClass('mq-first mq-last mq-followed-by-supsub');
          el.ctrlSeq = el.letter;
        }
        return undefined;
      }
    );
    var autoOpsLength = autoOps._maxLength || 0;
    outer: for (
      var i = 0, first = l[R] || this.parent.getEnd(L);
      first && i < str.length;
      i += 1, first = first[R]
    ) {
      for (var len = min(autoOpsLength, str.length - i); len > 0; len -= 1) {
        var word = str.slice(i, i + len);
        var last = undefined;
        if (autoOps.hasOwnProperty(word)) {
          for (var j = 0, letter = first; j < len; j += 1, letter = letter[R]) {
            if (letter instanceof Letter) {
              letter.italicize(false);
              last = letter;
            }
          }
          var isBuiltIn = BuiltInOpNames.hasOwnProperty(word);
          first.ctrlSeq =
            (isBuiltIn ? '\\' : '\\operatorname{') + first.ctrlSeq;
          last.ctrlSeq += isBuiltIn ? ' ' : '}';
          if (TwoWordOpNames.hasOwnProperty(word)) {
            var lastL = last[L];
            var lastLL = lastL && lastL[L];
            var lastLLL = lastLL && lastLL[L];
            lastLLL.domFrag().addClass('mq-last');
          }
          if (!this.shouldOmitPadding(first[L]))
            first.domFrag().addClass('mq-first');
          if (!this.shouldOmitPadding(last[R])) {
            if (last[R] instanceof SupSub) {
              var supsub = last[R];
              var respace =
                (supsub.siblingCreated =
                supsub.siblingDeleted =
                  function () {
                    supsub
                      .domFrag()
                      .toggleClass(
                        'mq-after-operator-name',
                        !(supsub[R] instanceof Bracket)
                      );
                  });
              respace();
            } else {
              last
                .domFrag()
                .toggleClass('mq-last', !(last[R] instanceof Bracket));
            }
          }
          i += len - 1;
          first = last;
          continue outer;
        }
      }
    }
  }
  shouldOmitPadding(node) {
    if (!node) return true;
    if (node.ctrlSeq === '.') return true;
    if (node instanceof BinaryOperator) return true;
    if (node instanceof SummationNotation) return true;
    return false;
  }
}
var BuiltInOpNames = {};
Options.prototype.autoOperatorNames = defaultAutoOpNames();
var TwoWordOpNames = { limsup: 1, liminf: 1, projlim: 1, injlim: 1 };
function defaultAutoOpNames() {
  var AutoOpNames = {
    _maxLength: 9,
  };
  var mostOps = (
    'arg deg det dim exp gcd hom inf ker lg lim ln log max min sup' +
    ' limsup liminf injlim projlim Pr'
  ).split(' ');
  for (var i = 0; i < mostOps.length; i += 1) {
    BuiltInOpNames[mostOps[i]] = AutoOpNames[mostOps[i]] = 1;
  }
  var builtInTrigs =
    'sin cos tan arcsin arccos arctan sinh cosh tanh sec csc cot coth'.split(
      ' '
    );
  for (var i = 0; i < builtInTrigs.length; i += 1) {
    BuiltInOpNames[builtInTrigs[i]] = 1;
  }
  var autoTrigs = 'sin cos tan sec cosec csc cotan cot ctg'.split(' ');
  for (var i = 0; i < autoTrigs.length; i += 1) {
    AutoOpNames[autoTrigs[i]] =
      AutoOpNames['arc' + autoTrigs[i]] =
      AutoOpNames[autoTrigs[i] + 'h'] =
      AutoOpNames['ar' + autoTrigs[i] + 'h'] =
      AutoOpNames['arc' + autoTrigs[i] + 'h'] =
        1;
  }
  var moreNonstandardOps = 'gcf hcf lcm proj span'.split(' ');
  for (var i = 0; i < moreNonstandardOps.length; i += 1) {
    AutoOpNames[moreNonstandardOps[i]] = 1;
  }
  return AutoOpNames;
}
baseOptionProcessors.autoOperatorNames = function (cmds) {
  if (typeof cmds !== 'string') {
    throw '"' + cmds + '" not a space-delimited list';
  }
  if (!/^[a-z|-]+(?: [a-z|-]+)*$/i.test(cmds)) {
    throw '"' + cmds + '" not a space-delimited list of letters or "|"';
  }
  var list = cmds.split(' ');
  var dict = {};
  var maxLength = 0;
  for (var i = 0; i < list.length; i += 1) {
    var cmd = list[i];
    if (cmd.length < 2) {
      throw '"' + cmd + '" not minimum length of 2';
    }
    if (cmd.indexOf('|') < 0) {
      dict[cmd] = cmd;
      maxLength = max(maxLength, cmd.length);
    } else {
      var cmdArray = cmd.split('|');
      if (cmdArray.length > 2) {
        throw '"' + cmd + '" has more than 1 mathspeak delimiter';
      }
      if (cmdArray[0].length < 2) {
        throw '"' + cmd[0] + '" not minimum length of 2';
      }
      dict[cmdArray[0]] = cmdArray[1].replace(/-/g, ' ');
      maxLength = max(maxLength, cmdArray[0].length);
    }
  }
  dict._maxLength = maxLength;
  return dict;
};
class OperatorName extends MQSymbol {
  constructor(fn) {
    super(fn || '');
  }
  createLeftOf(cursor) {
    var fn = this.ctrlSeq;
    for (var i = 0; i < fn.length; i += 1) {
      new Letter(fn.charAt(i)).createLeftOf(cursor);
    }
  }
  parser() {
    var fn = this.ctrlSeq;
    var block = new MathBlock();
    for (var i = 0; i < fn.length; i += 1) {
      new Letter(fn.charAt(i)).adopt(block, block.getEnd(R), 0);
    }
    return Parser.succeed(block.children());
  }
}
for (var fn in Options.prototype.autoOperatorNames)
  if (Options.prototype.autoOperatorNames.hasOwnProperty(fn)) {
    LatexCmds[fn] = OperatorName;
  }
LatexCmds.operatorname = class extends MathCommand {
  createLeftOf() {}
  numBlocks() {
    return 1;
  }
  parser() {
    return latexMathParser.block.map(function (b) {
      var isAllLetters = true;
      var str = '';
      var children = b.children();
      children.each(function (child) {
        if (child instanceof Letter) {
          str += child.letter;
        } else {
          isAllLetters = false;
        }
        return undefined;
      });
      if (isAllLetters && str === 'ans') {
        return AnsBuilder();
      }
      return children;
    });
  }
};
LatexCmds.f = class extends Letter {
  constructor() {
    var letter = 'f';
    super(letter);
    this.letter = letter;
    this.domView = new DOMView(0, () =>
      h('var', { class: 'mq-f' }, [h.text('f')])
    );
  }
  italicize(bool) {
    this.domFrag().eachElement((el) => (el.textContent = 'f'));
    this.domFrag().toggleClass('mq-f', bool);
    return super.italicize(bool);
  }
};
LatexCmds[' '] = LatexCmds.space = () =>
  new DigitGroupingChar('\\ ', h('span', {}, [h.text(U_NO_BREAK_SPACE)]), ' ');
LatexCmds['.'] = () =>
  new DigitGroupingChar(
    '.',
    h('span', { class: 'mq-digit' }, [h.text('.')]),
    '.'
  );
LatexCmds["'"] = LatexCmds.prime = bindVanillaSymbol("'", '&prime;', 'prime');
LatexCmds['″'] = LatexCmds.dprime = bindVanillaSymbol(
  '″',
  '&Prime;',
  'double prime'
);
LatexCmds.backslash = bindVanillaSymbol('\\backslash ', '\\', 'backslash');
if (!CharCmds['\\']) CharCmds['\\'] = LatexCmds.backslash;
LatexCmds.$ = bindVanillaSymbol('\\$', '$', 'dollar');
LatexCmds.square = bindVanillaSymbol('\\square ', '\u25A1', 'square');
LatexCmds.mid = bindVanillaSymbol('\\mid ', '\u2223', 'mid');
class NonSymbolaSymbol extends MQSymbol {
  constructor(ch, html, _unusedMathspeak) {
    super(ch, h('span', { class: 'mq-nonSymbola' }, [html || h.text(ch)]));
  }
}
LatexCmds['@'] = () => new NonSymbolaSymbol('@');
LatexCmds['&'] = () =>
  new NonSymbolaSymbol('\\&', h.entityText('&amp;'), 'and');
LatexCmds['%'] = class extends NonSymbolaSymbol {
  constructor() {
    super('\\%', h.text('%'), 'percent');
  }
  parser() {
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;
    return optWhitespace
      .then(
        string('\\operatorname{of}').map(function () {
          return PercentOfBuilder();
        })
      )
      .or(super.parser());
  }
};
LatexCmds['∥'] = LatexCmds.parallel = bindVanillaSymbol(
  '\\parallel ',
  '&#x2225;',
  'parallel'
);
LatexCmds['∦'] = LatexCmds.nparallel = bindVanillaSymbol(
  '\\nparallel ',
  '&#x2226;',
  'not parallel'
);
LatexCmds['⟂'] = LatexCmds.perp = bindVanillaSymbol(
  '\\perp ',
  '&#x27C2;',
  'perpendicular'
);
LatexCmds.alpha =
  LatexCmds.beta =
  LatexCmds.gamma =
  LatexCmds.delta =
  LatexCmds.zeta =
  LatexCmds.eta =
  LatexCmds.theta =
  LatexCmds.iota =
  LatexCmds.kappa =
  LatexCmds.mu =
  LatexCmds.nu =
  LatexCmds.xi =
  LatexCmds.rho =
  LatexCmds.sigma =
  LatexCmds.tau =
  LatexCmds.chi =
  LatexCmds.psi =
  LatexCmds.omega =
    (latex) =>
      new letiable('\\' + latex + ' ', h.entityText('&' + latex + ';'));
LatexCmds.phi = bindletiable('\\phi ', '&#981;', 'phi');
LatexCmds.phiv = LatexCmds.letphi = bindletiable('\\letphi ', '&phi;', 'phi');
LatexCmds.epsilon = bindletiable('\\epsilon ', '&#1013;', 'epsilon');
LatexCmds.epsiv = LatexCmds.letepsilon = bindletiable(
  '\\letepsilon ',
  '&epsilon;',
  'epsilon'
);
LatexCmds.piv = LatexCmds.letpi = bindletiable('\\letpi ', '&piv;', 'piv');
LatexCmds.sigmaf =
  LatexCmds.sigmav =
  LatexCmds.letsigma =
    bindletiable('\\letsigma ', '&sigmaf;', 'sigma');
LatexCmds.thetav =
  LatexCmds.lettheta =
  LatexCmds.thetasym =
    bindletiable('\\lettheta ', '&thetasym;', 'theta');
LatexCmds.upsilon = LatexCmds.upsi = bindletiable(
  '\\upsilon ',
  '&upsilon;',
  'upsilon'
);
LatexCmds.gammad =
  LatexCmds.Gammad =
  LatexCmds.digamma =
    bindletiable('\\digamma ', '&#989;', 'gamma');
LatexCmds.kappav = LatexCmds.letkappa = bindletiable(
  '\\letkappa ',
  '&#1008;',
  'kappa'
);
LatexCmds.rhov = LatexCmds.letrho = bindletiable('\\letrho ', '&#1009;', 'rho');
LatexCmds.pi = LatexCmds['π'] = () =>
  new NonSymbolaSymbol('\\pi ', h.entityText('&pi;'), 'pi');
LatexCmds.lambda = () =>
  new NonSymbolaSymbol('\\lambda ', h.entityText('&lambda;'), 'lambda');
LatexCmds.Upsilon =
  LatexCmds.Upsi =
  LatexCmds.upsih =
  LatexCmds.Upsih =
    () =>
      new MQSymbol(
        '\\Upsilon ',
        h('var', { style: 'font-family: serif' }, [h.entityText('&upsih;')]),
        'capital upsilon'
      );
LatexCmds.Gamma =
  LatexCmds.Delta =
  LatexCmds.Theta =
  LatexCmds.Lambda =
  LatexCmds.Xi =
  LatexCmds.Pi =
  LatexCmds.Sigma =
  LatexCmds.Phi =
  LatexCmds.Psi =
  LatexCmds.Omega =
  LatexCmds.forall =
    (latex) =>
      new VanillaSymbol('\\' + latex + ' ', h.entityText('&' + latex + ';'));
export class LatexFragment extends MathCommand {
  constructor(latex) {
    super();
    this.latexStr = latex;
  }
  createLeftOf(cursor) {
    var block = latexMathParser.parse(this.latexStr);
    block.children().adopt(cursor.parent, cursor[L], cursor[R]);
    cursor[L] = block.getEnd(R);
    domFrag(block.html()).insertBefore(cursor.domFrag());
    block.finalizeInsert(cursor.options, cursor);
    var blockEndsR = block.getEnd(R);
    var blockEndsRR = blockEndsR && blockEndsR[R];
    if (blockEndsRR) blockEndsRR.siblingCreated(cursor.options, L);
    var blockEndsL = block.getEnd(L);
    var blockEndsLL = blockEndsL && blockEndsL[L];
    if (blockEndsLL) blockEndsLL.siblingCreated(cursor.options, R);
    cursor.parent.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }
  mathspeak() {
    return latexMathParser.parse(this.latexStr).mathspeak();
  }
  parser() {
    var frag = latexMathParser.parse(this.latexStr).children();
    return Parser.succeed(frag);
  }
}
LatexCmds['⁰'] = () => new LatexFragment('^0');
LatexCmds['¹'] = () => new LatexFragment('^1');
LatexCmds['²'] = () => new LatexFragment('^2');
LatexCmds['³'] = () => new LatexFragment('^3');
LatexCmds['⁴'] = () => new LatexFragment('^4');
LatexCmds['⁵'] = () => new LatexFragment('^5');
LatexCmds['⁶'] = () => new LatexFragment('^6');
LatexCmds['⁷'] = () => new LatexFragment('^7');
LatexCmds['⁸'] = () => new LatexFragment('^8');
LatexCmds['⁹'] = () => new LatexFragment('^9');
LatexCmds['¼'] = () => new LatexFragment('\\frac14');
LatexCmds['½'] = () => new LatexFragment('\\frac12');
LatexCmds['¾'] = () => new LatexFragment('\\frac34');
LatexCmds['√'] = () => new LatexFragment('\\sqrt{}');
function isBinaryOperator(node) {
  if (!node) return false;
  var nodeL = node[L];
  if (nodeL) {
    if (
      nodeL instanceof BinaryOperator ||
      /^(\\ )|[,;:([]$/.test(nodeL.ctrlSeq)
    ) {
      return false;
    }
  } else if (
    node.parent &&
    node.parent.parent &&
    node.parent.parent.isStyleBlock()
  ) {
    return isBinaryOperator(node.parent.parent);
  } else {
    return false;
  }
  return true;
}
export var PlusMinus = class extends BinaryOperator {
  constructor(ch, html, mathspeak) {
    super(ch, html, undefined, mathspeak, true);
  }
  contactWeld(cursor, dir) {
    this.sharedSiblingMethod(cursor.options, dir);
  }
  siblingCreated(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  siblingDeleted(opts, dir) {
    this.sharedSiblingMethod(opts, dir);
  }
  sharedSiblingMethod(_opts, dir) {
    if (dir === R) return;
    this.domFrag().oneElement().className = isBinaryOperator(this)
      ? 'mq-binary-operator'
      : '';
    return this;
  }
};
LatexCmds['+'] = class extends PlusMinus {
  constructor() {
    super('+', h.text('+'));
  }
  mathspeak() {
    return isBinaryOperator(this) ? 'plus' : 'positive';
  }
};
class MinusNode extends PlusMinus {
  constructor() {
    super('-', h.entityText('&minus;'));
  }
  mathspeak() {
    return isBinaryOperator(this) ? 'minus' : 'negative';
  }
}
LatexCmds['−'] = LatexCmds['—'] = LatexCmds['–'] = LatexCmds['-'] = MinusNode;
LatexCmds['±'] =
  LatexCmds.pm =
  LatexCmds.plusmn =
  LatexCmds.plusminus =
    () => new PlusMinus('\\pm ', h.entityText('&plusmn;'), 'plus-or-minus');
LatexCmds.mp =
  LatexCmds.mnplus =
  LatexCmds.minusplus =
    () => new PlusMinus('\\mp ', h.entityText('&#8723;'), 'minus-or-plus');
CharCmds['*'] =
  LatexCmds.sdot =
  LatexCmds.cdot =
    bindBinaryOperator('\\cdot ', '&middot;', '*', 'times');
class To extends BinaryOperator {
  constructor() {
    super('\\to ', h.entityText('&rarr;'), 'to');
  }
  deleteTowards(dir, cursor) {
    if (dir === L) {
      var l = cursor[L];
      new Fragment(l, this).remove();
      cursor[L] = l[L];
      new MinusNode().createLeftOf(cursor);
      cursor[L].bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.deleteTowards(dir, cursor);
  }
}
LatexCmds['→'] = LatexCmds.to = To;
class Inequality extends BinaryOperator {
  constructor(data, strict) {
    var strictness = strict ? 'Strict' : '';
    super(
      data[`ctrlSeq${strictness}`],
      h.entityText(data[`htmlEntity${strictness}`]),
      data[`text${strictness}`],
      data[`mathspeak${strictness}`]
    );
    this.data = data;
    this.strict = strict;
  }
  swap(strict) {
    this.strict = strict;
    var strictness = strict ? 'Strict' : '';
    this.ctrlSeq = this.data[`ctrlSeq${strictness}`];
    this.domFrag()
      .children()
      .replaceWith(domFrag(h.entityText(this.data[`htmlEntity${strictness}`])));
    this.textTemplate = [this.data[`text${strictness}`]];
    this.mathspeakName = this.data[`mathspeak${strictness}`];
  }
  deleteTowards(dir, cursor) {
    if (dir === L && !this.strict) {
      this.swap(true);
      this.bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.deleteTowards(dir, cursor);
  }
}
var less = {
  ctrlSeq: '\\le ',
  htmlEntity: '&le;',
  text: '≤',
  mathspeak: 'less than or equal to',
  ctrlSeqStrict: '<',
  htmlEntityStrict: '&lt;',
  textStrict: '<',
  mathspeakStrict: 'less than',
};
var greater = {
  ctrlSeq: '\\ge ',
  htmlEntity: '&ge;',
  text: '≥',
  mathspeak: 'greater than or equal to',
  ctrlSeqStrict: '>',
  htmlEntityStrict: '&gt;',
  textStrict: '>',
  mathspeakStrict: 'greater than',
};
class Greater extends Inequality {
  constructor() {
    super(greater, true);
  }
  createLeftOf(cursor) {
    var cursorL = cursor[L];
    if (cursorL instanceof BinaryOperator && cursorL.ctrlSeq === '-') {
      var l = cursorL;
      cursor[L] = l[L];
      l.remove();
      new To().createLeftOf(cursor);
      cursor[L].bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.createLeftOf(cursor);
  }
}
LatexCmds['<'] = LatexCmds.lt = () => new Inequality(less, true);
LatexCmds['>'] = LatexCmds.gt = Greater;
LatexCmds['≤'] =
  LatexCmds.le =
  LatexCmds.leq =
    () => new Inequality(less, false);
LatexCmds['≥'] =
  LatexCmds.ge =
  LatexCmds.geq =
    () => new Inequality(greater, false);
LatexCmds.infty =
  LatexCmds.infin =
  LatexCmds.infinity =
    bindVanillaSymbol('\\infty ', '&infin;', 'infinity');
LatexCmds['≠'] =
  LatexCmds.ne =
  LatexCmds.neq =
    bindBinaryOperator('\\ne ', '&ne;', 'not equal');
export class Equality extends BinaryOperator {
  constructor() {
    super('=', h.text('='), '=', 'equals');
  }
  createLeftOf(cursor) {
    var cursorL = cursor[L];
    if (cursorL instanceof Inequality && cursorL.strict) {
      cursorL.swap(false);
      cursorL.bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.createLeftOf(cursor);
  }
}
LatexCmds['='] = Equality;
LatexCmds['×'] =
  LatexCmds.times =
  LatexCmds.cross =
    bindBinaryOperator('\\times ', '&times;', '[x]', 'times');
LatexCmds['÷'] =
  LatexCmds.div =
  LatexCmds.divide =
  LatexCmds.divides =
    bindBinaryOperator('\\div ', '&divide;', '[/]', 'over');
class Sim extends BinaryOperator {
  constructor() {
    super('\\sim ', h.text('~'), '~', 'tilde');
  }
  createLeftOf(cursor) {
    if (cursor[L] instanceof Sim) {
      var l = cursor[L];
      cursor[L] = l[L];
      l.remove();
      new Approx().createLeftOf(cursor);
      cursor[L].bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.createLeftOf(cursor);
  }
}
class Approx extends BinaryOperator {
  constructor() {
    super('\\approx ', h.entityText('&approx;'), '≈', 'approximately equal');
  }
  deleteTowards(dir, cursor) {
    if (dir === L) {
      var l = cursor[L];
      new Fragment(l, this).remove();
      cursor[L] = l[L];
      new Sim().createLeftOf(cursor);
      cursor[L].bubble(function (node) {
        node.reflow();
        return undefined;
      });
      return;
    }
    super.deleteTowards(dir, cursor);
  }
}
LatexCmds.tildeNbsp = bindVanillaSymbol('~', U_NO_BREAK_SPACE, ' ');
LatexCmds.sim = Sim;
LatexCmds['≈'] = LatexCmds.approx = Approx;
CharCmds['~'] = LatexCmds.sim;
LatexCmds['~'] = LatexCmds.tildeNbsp;
baseOptionProcessors.interpretTildeAsSim = function (val) {
  var interpretAsSim = !!val;
  if (interpretAsSim) {
    LatexCmds['~'] = LatexCmds.sim;
  } else {
    LatexCmds['~'] = LatexCmds.tildeNbsp;
  }
  return interpretAsSim;
};
