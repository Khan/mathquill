import {
  Controller_scrollHoriz,
  Options,
  domFrag,
  h,
  noop,
  saneKeyboardEvents,
} from '../bundle';
Options.prototype.substituteTextarea = function () {
  return h('textarea', {
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: false,
    'x-palm-disable-ste-all': true,
  });
};
export function defaultSubstituteKeyboardEvents(jq, controller) {
  return saneKeyboardEvents(jq[0], controller);
}
Options.prototype.substituteKeyboardEvents = defaultSubstituteKeyboardEvents;
export class Controller extends Controller_scrollHoriz {
  constructor() {
    super(...arguments);
    this.selectFn = noop;
  }
  createTextarea() {
    this.textareaSpan = h('span', { class: 'mq-textarea' });
    var textarea = this.options.substituteTextarea();
    if (!textarea.nodeType) {
      throw 'substituteTextarea() must return a DOM element, got ' + textarea;
    }
    this.textarea = domFrag(textarea).appendTo(this.textareaSpan).oneElement();
    var ctrlr = this;
    ctrlr.cursor.selectionChanged = function () {
      ctrlr.selectionChanged();
    };
  }
  selectionChanged() {
    var ctrlr = this;
    if (!ctrlr.textareaSelectionTimeout) {
      ctrlr.textareaSelectionTimeout = setTimeout(function () {
        ctrlr.setTextareaSelection();
      });
    }
  }
  setTextareaSelection() {
    this.textareaSelectionTimeout = 0;
    var latex = '';
    if (this.cursor.selection) {
      latex = this.cleanLatex(this.cursor.selection.join('latex'));
      if (this.options.statelessClipboard) {
        latex = '$' + latex + '$';
      }
    }
    this.selectFn(latex);
  }
  staticMathTextareaEvents() {
    var ctrlr = this;
    this.removeTextareaEventListener('cut');
    this.removeTextareaEventListener('paste');
    if (ctrlr.options.disableCopyPaste) {
      this.removeTextareaEventListener('copy');
    } else {
      this.addTextareaEventListeners({
        copy: function () {
          ctrlr.setTextareaSelection();
        },
      });
    }
    this.addStaticFocusBlurListeners();
    ctrlr.selectFn = function (text) {
      var textarea = ctrlr.getTextareaOrThrow();
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      textarea.value = text;
      if (text) textarea.select();
    };
  }
  editablesTextareaEvents() {
    var ctrlr = this;
    var textarea = ctrlr.getTextareaOrThrow();
    var textareaSpan = ctrlr.getTextareaSpanOrThrow();
    if (this.options.version < 3) {
      var $ = this.options.assertJquery();
      var keyboardEventsShim = this.options.substituteKeyboardEvents(
        $(textarea),
        this
      );
      this.selectFn = function (text) {
        keyboardEventsShim.select(text);
      };
    } else {
      var { select } = saneKeyboardEvents(textarea, this);
      this.selectFn = select;
    }
    domFrag(this.container).prepend(domFrag(textareaSpan));
    this.addEditableFocusBlurListeners();
    this.updateMathspeak();
  }
  unbindEditablesEvents() {
    var ctrlr = this;
    var textarea = ctrlr.getTextareaOrThrow();
    var textareaSpan = ctrlr.getTextareaSpanOrThrow();
    this.selectFn = function (text) {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      textarea.value = text;
      if (text) textarea.select();
    };
    domFrag(textareaSpan).remove();
    this.removeTextareaEventListener('focus');
    this.removeTextareaEventListener('blur');
    ctrlr.blurred = true;
    this.removeTextareaEventListener('cut');
    this.removeTextareaEventListener('paste');
  }
  typedText(ch) {
    if (ch === '\n') return this.handle('enter');
    var cursor = this.notify(undefined).cursor;
    cursor.parent.write(cursor, ch);
    this.scrollHoriz();
  }
  cut() {
    var ctrlr = this,
      cursor = ctrlr.cursor;
    if (cursor.selection) {
      setTimeout(function () {
        ctrlr.notify('edit');
        cursor.parent.bubble(function (node) {
          node.reflow();
          return undefined;
        });
        if (ctrlr.options && ctrlr.options.onCut) {
          ctrlr.options.onCut();
        }
      });
    }
  }
  copy() {
    this.setTextareaSelection();
  }
  paste(text) {
    if (this.options.statelessClipboard) {
      if (text.slice(0, 1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      } else {
        text = '\\text{' + text + '}';
      }
    }
    this.writeLatex(text).cursor.show();
    this.scrollHoriz();
    if (this.options && this.options.onPaste) {
      this.options.onPaste();
    }
  }
  setupStaticField() {
    this.mathspeakSpan = h('span', { class: 'mq-mathspeak' });
    domFrag(this.container).prepend(domFrag(this.mathspeakSpan));
    this.updateMathspeak();
    this.blurred = true;
    this.cursor.hide().parent.blur(this.cursor);
  }
  updateMathspeak() {
    var ctrlr = this;
    var ariaLabel = ctrlr.getAriaLabel();
    var labelWithSuffix = /[A-Za-z0-9]$/.test(ariaLabel)
      ? ariaLabel + ':'
      : ariaLabel;
    var mathspeak = ctrlr.root.mathspeak().trim();
    this.aria.clear();
    var textarea = ctrlr.getTextareaOrThrow();
    if (ctrlr.mathspeakSpan) {
      textarea.setAttribute('aria-label', '');
      ctrlr.mathspeakSpan.textContent = (
        labelWithSuffix +
        ' ' +
        mathspeak
      ).trim();
    } else {
      textarea.setAttribute(
        'aria-label',
        (labelWithSuffix + ' ' + mathspeak + ' ' + ctrlr.ariaPostLabel).trim()
      );
    }
  }
}
