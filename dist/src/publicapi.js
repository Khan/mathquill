import {
  Controller,
  EmbedNode,
  defaultSubstituteKeyboardEvents,
  L,
  LatexCmds,
  NodeBase,
  R,
  domFrag,
  getScrollX,
  getScrollY,
  h,
  pray,
} from './bundle';
export var API = {};
export var EMBEDS = {};
var processedOptions = {
  handlers: true,
  autoCommands: true,
  quietEmptyDelimiters: true,
  autoParenthesizedFunctions: true,
  autoOperatorNames: true,
  leftRightIntoCmdGoes: true,
  maxDepth: true,
  interpretTildeAsSim: true,
};
export const baseOptionProcessors = {};
export class Options {
  constructor(version) {
    this.version = version;
  }
  assertJquery() {
    pray('Interface versions > 2 do not depend on JQuery', this.version <= 2);
    pray('JQuery is set for interface v < 3', this.jQuery);
    return this.jQuery;
  }
}
class Progenote {}
var insistOnInterVer = function () {
  if (window.console)
    console.warn(
      'You are using the MathQuill API without specifying an interface version, ' +
        'which will fail in v1.0.0. Easiest fix is to do the following before ' +
        'doing anything else:\n' +
        '\n' +
        '    MathQuill = MathQuill.getInterface(1);\n' +
        '    // now MathQuill.MathField() works like it used to\n' +
        '\n' +
        'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
        '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide'
    );
};
var MQ1;
function MathQuill(el) {
  insistOnInterVer();
  if (!MQ1) {
    MQ1 = getInterface(1);
  }
  return MQ1(el);
}
MathQuill.prototype = Progenote.prototype;
MathQuill.VERSION = '{VERSION}';
MathQuill.interfaceVersion = function (v) {
  if (v !== 1) throw 'Only interface version 1 supported. You specified: ' + v;
  insistOnInterVer = function () {
    if (window.console)
      console.warn(
        'You called MathQuill.interfaceVersion(1); to specify the interface ' +
          'version, which will fail in v1.0.0. You can fix this easily by doing ' +
          'this before doing anything else:\n' +
          '\n' +
          '    MathQuill = MathQuill.getInterface(1);\n' +
          '    // now MathQuill.MathField() works like it used to\n' +
          '\n' +
          'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
          '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide'
      );
  };
  insistOnInterVer();
  return MathQuill;
};
MathQuill.getInterface = getInterface;
var MIN = (getInterface.MIN = 1),
  MAX = (getInterface.MAX = 3);
function getInterface(v) {
  if (v !== 1 && v !== 2 && v !== 3)
    throw (
      'Only interface versions between ' +
      MIN +
      ' and ' +
      MAX +
      ' supported. You specified: ' +
      v
    );
  const version = v;
  if (version < 3) {
    var jQuery = window.jQuery;
    if (!jQuery)
      throw `MathQuill interface version ${version} requires jQuery 1.5.2+ to be loaded first`;
    Options.prototype.jQuery = jQuery;
  }
  var optionProcessors = Object.assign(
    Object.assign({}, baseOptionProcessors),
    {
      handlers: (handlers) => ({
        fns: handlers || {},
        APIClasses,
      }),
    }
  );
  function config(currentOptions, newOptions) {
    for (var name in newOptions) {
      if (newOptions.hasOwnProperty(name)) {
        if (name === 'substituteKeyboardEvents' && version >= 3) {
          throw new Error(
            [
              "As of interface version 3, the 'substituteKeyboardEvents'",
              "option is no longer supported. Use 'overrideTypedText' and",
              "'overrideKeystroke' instead.",
            ].join(' ')
          );
        }
        var value = newOptions[name];
        var processor = optionProcessors[name];
        currentOptions[name] = processor ? processor(value) : value;
      }
    }
  }
  var BaseOptions =
    version < 3 ? Options : class BaseOptions extends Options {};
  class AbstractMathQuill extends Progenote {
    constructor(ctrlr) {
      super();
      this.__controller = ctrlr;
      this.__options = ctrlr.options;
      this.id = ctrlr.id;
      this.data = ctrlr.data;
    }
    mathquillify(classNames) {
      var ctrlr = this.__controller,
        root = ctrlr.root,
        el = ctrlr.container;
      ctrlr.createTextarea();
      var contents = domFrag(el).addClass(classNames).children().detach();
      root.setDOM(
        domFrag(h('span', { class: 'mq-root-block', 'aria-hidden': true }))
          .appendTo(el)
          .oneElement()
      );
      NodeBase.linkElementByBlockNode(root.domFrag().oneElement(), root);
      this.latex(contents.text());
      this.revert = function () {
        ctrlr.removeMouseEventListener();
        domFrag(el)
          .removeClass('mq-editable-field mq-math-mode mq-text-mode')
          .empty()
          .append(contents);
        return version < 3 ? this.__options.assertJquery()(el) : el;
      };
    }
    setAriaLabel(ariaLabel) {
      this.__controller.setAriaLabel(ariaLabel);
      return this;
    }
    getAriaLabel() {
      return this.__controller.getAriaLabel();
    }
    config(opts) {
      config(this.__options, opts);
      return this;
    }
    el() {
      return this.__controller.container;
    }
    text() {
      return this.__controller.exportText();
    }
    mathspeak() {
      return this.__controller.exportMathSpeak();
    }
    latex(latex) {
      if (arguments.length > 0) {
        this.__controller.renderLatexMath(latex);
        var cursor = this.__controller.cursor;
        if (this.__controller.blurred) cursor.hide().parent.blur(cursor);
        return this;
      }
      return this.__controller.exportLatex();
    }
    selection() {
      return this.__controller.exportLatexSelection();
    }
    html() {
      return this.__controller.root
        .domFrag()
        .oneElement()
        .innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g, '')
        .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
        .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
        .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
        .replace(/ class=(""|(?= |>))/g, '');
    }
    reflow() {
      this.__controller.root.postOrder(function (node) {
        node.reflow();
      });
      return this;
    }
    cursor() {
      return this.__controller.cursor;
    }
    controller() {
      return this.__controller;
    }
  }
  class EditableField extends AbstractMathQuill {
    mathquillify(classNames) {
      super.mathquillify(classNames);
      this.__controller.editable = true;
      this.__controller.addMouseEventListener();
      this.__controller.editablesTextareaEvents();
      return this;
    }
    focus() {
      this.__controller.getTextareaOrThrow().focus();
      this.__controller.scrollHoriz();
      return this;
    }
    blur() {
      this.__controller.getTextareaOrThrow().blur();
      return this;
    }
    write(latex) {
      this.__controller.writeLatex(latex);
      this.__controller.scrollHoriz();
      var cursor = this.__controller.cursor;
      if (this.__controller.blurred) cursor.hide().parent.blur(cursor);
      return this;
    }
    empty() {
      var root = this.__controller.root,
        cursor = this.__controller.cursor;
      root.setEnds({ [L]: 0, [R]: 0 });
      root.domFrag().empty();
      delete cursor.selection;
      cursor.insAtRightEnd(root);
      return this;
    }
    cmd(cmd) {
      var ctrlr = this.__controller.notify(undefined),
        cursor = ctrlr.cursor;
      if (/^\\[a-z]+$/i.test(cmd) && !cursor.isTooDeep()) {
        cmd = cmd.slice(1);
        var klass = LatexCmds[cmd];
        var node;
        if (klass) {
          if (klass.constructor) {
            node = new klass(cmd);
          } else {
            node = klass(cmd);
          }
          if (cursor.selection) node.replaces(cursor.replaceSelection());
          node.createLeftOf(cursor.show());
        } else;
      } else cursor.parent.write(cursor, cmd);
      ctrlr.scrollHoriz();
      if (ctrlr.blurred) cursor.hide().parent.blur(cursor);
      return this;
    }
    select() {
      this.__controller.selectAll();
      return this;
    }
    clearSelection() {
      this.__controller.cursor.clearSelection();
      return this;
    }
    moveToDirEnd(dir) {
      this.__controller
        .notify('move')
        .cursor.insAtDirEnd(dir, this.__controller.root);
      return this;
    }
    moveToLeftEnd() {
      return this.moveToDirEnd(L);
    }
    moveToRightEnd() {
      return this.moveToDirEnd(R);
    }
    keystroke(keysString, evt) {
      var keys = keysString.replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var i = 0; i < keys.length; i += 1) {
        this.__controller.keystroke(keys[i], evt);
      }
      return this;
    }
    typedText(text) {
      for (var i = 0; i < text.length; i += 1)
        this.__controller.typedText(text.charAt(i));
      return this;
    }
    dropEmbedded(pageX, pageY, options) {
      var clientX = pageX - getScrollX();
      var clientY = pageY - getScrollY();
      var el = document.elementFromPoint(clientX, clientY);
      this.__controller.seek(el, clientX, clientY);
      var cmd = new EmbedNode().setOptions(options);
      cmd.createLeftOf(this.__controller.cursor);
    }
    setAriaPostLabel(ariaPostLabel, timeout) {
      this.__controller.setAriaPostLabel(ariaPostLabel, timeout);
      return this;
    }
    getAriaPostLabel() {
      return this.__controller.getAriaPostLabel();
    }
    clickAt(clientX, clientY, target) {
      target = target || document.elementFromPoint(clientX, clientY);
      var ctrlr = this.__controller,
        root = ctrlr.root;
      var rootElement = root.domFrag().oneElement();
      if (!rootElement.contains(target)) target = rootElement;
      ctrlr.seek(target, clientX, clientY);
      if (ctrlr.blurred) this.focus();
      return this;
    }
    ignoreNextMousedown(fn) {
      this.__controller.cursor.options.ignoreNextMousedown = fn;
      return this;
    }
  }
  var APIClasses = {
    AbstractMathQuill,
    EditableField,
  };
  pray('API.StaticMath defined', API.StaticMath);
  APIClasses.StaticMath = API.StaticMath(APIClasses);
  pray('API.MathField defined', API.MathField);
  APIClasses.MathField = API.MathField(APIClasses);
  pray('API.InnerMathField defined', API.InnerMathField);
  APIClasses.InnerMathField = API.InnerMathField(APIClasses);
  if (API.TextField) {
    APIClasses.TextField = API.TextField(APIClasses);
  }
  const MQ = function (el) {
    if (!el || !el.nodeType) return null;
    let blockElement;
    const childArray = domFrag(el).children().toElementArray();
    for (const child of childArray) {
      if (child.classList.contains('mq-root-block')) {
        blockElement = child;
        break;
      }
    }
    const blockNode = NodeBase.getNodeOfElement(blockElement);
    const ctrlr = blockNode && blockNode.controller;
    const APIClass = ctrlr && APIClasses[ctrlr.KIND_OF_MQ];
    return ctrlr && APIClass ? new APIClass(ctrlr) : null;
  };
  MQ.L = L;
  MQ.R = R;
  MQ.config = function (opts) {
    config(BaseOptions.prototype, opts);
    return this;
  };
  MQ.registerEmbed = function (name, options) {
    if (!/^[a-z][a-z0-9]*$/i.test(name)) {
      throw 'Embed name must start with letter and be only letters and digits';
    }
    EMBEDS[name] = options;
  };
  MQ.StaticMath = createEntrypoint('StaticMath', APIClasses.StaticMath);
  MQ.MathField = createEntrypoint('MathField', APIClasses.MathField);
  MQ.InnerMathField = createEntrypoint(
    'InnerMathField',
    APIClasses.InnerMathField
  );
  if (APIClasses.TextField) {
    MQ.TextField = createEntrypoint('TextField', APIClasses.TextField);
  }
  MQ.prototype = AbstractMathQuill.prototype;
  MQ.EditableField = function () {
    throw "wtf don't call me, I'm 'abstract'";
  };
  MQ.EditableField.prototype = EditableField.prototype;
  if (version < 3) {
    MQ.saneKeyboardEvents = defaultSubstituteKeyboardEvents;
  }
  function createEntrypoint(kind, APIClass) {
    pray(kind + ' is defined', APIClass);
    function mqEntrypoint(el, opts) {
      if (!el || !el.nodeType) return null;
      const mq = MQ(el);
      if (mq instanceof APIClass) return mq;
      const ctrlr = new Controller(
        new APIClass.RootBlock(),
        el,
        new BaseOptions(version)
      );
      ctrlr.KIND_OF_MQ = kind;
      return new APIClass(ctrlr).__mathquillify(opts || {}, version);
    }
    mqEntrypoint.prototype = APIClass.prototype;
    return mqEntrypoint;
  }
  return MQ;
}
export function RootBlockMixin(_) {
  _.moveOutOf = function (dir) {
    pray('controller is defined', this.controller);
    this.controller.handle('moveOutOf', dir);
  };
  _.deleteOutOf = function (dir) {
    pray('controller is defined', this.controller);
    this.controller.handle('deleteOutOf', dir);
  };
  _.selectOutOf = function (dir) {
    pray('controller is defined', this.controller);
    this.controller.handle('selectOutOf', dir);
  };
  _.upOutOf = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('upOutOf');
    return undefined;
  };
  _.downOutOf = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('downOutOf');
    return undefined;
  };
  _.reflow = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('reflow');
    this.controller.handle('edited');
    this.controller.handle('edit');
  };
}
export default MathQuill;
