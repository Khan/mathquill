/*****************************************

 * Add the capability for mathquill to generate ARIA alerts. Necessary so MQ can convey information as a screen reader user navigates the fake MathQuill textareas.
 * Official ARIA specification: https://www.w3.org/TR/wai-aria/
 * WAI-ARIA is still catching on, thus only more recent browsers support it, and even then to varying degrees.
 * The below implementation attempts to be as broad as possible and may not conform precisely to the spec. But, neither do any browsers or adaptive technologies at this point.
 * At time of writing, IE 11, FF 44, and Safari 8.0.8 work. Older versions of these browsers should speak as well, but haven't tested precisely which earlier editions pass.

 * Tested AT: on Windows, Window-Eyes, ZoomText Fusion, NVDA, and JAWS (all supported).
 * VoiceOver on Mac platforms also supported (only tested with OSX 10.10.5 and iOS 9.2.1+).
 * Chrome 54+ on Android works reliably with Talkback.
 ****************************************/

// it doesn't make any sense to accept Fragment here as it's not handled
// or turned into a string in any way, but one is passed as an arg in
// keystroke.ts, so we'll just leave it as is for now
type AriaQueueItem = NodeRef | Fragment | string;

class Aria {
  controller: Controller;
  span = h('span', {
    class: 'mq-aria-alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  });
  msg = '';
  items: AriaQueueItem[] = [];

  constructor(controller: Controller) {
    this.controller = controller;
  }

  attach() {
    const container = this.controller.container;
    if (this.span.parentNode !== container) {
      domFrag(container).prepend(domFrag(this.span));
    }
  }

  queue(
    item: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ) {
    this.items.push(this.processQueueItems(item, shouldDescribe));
    return this;
  }

  private processQueueItems(
    item: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ): string {
    const items = Array.isArray(item) ? item : [item];
    const processedItems = items.map((item) => {
      if (item instanceof MQNode) {
        // Some constructs include verbal shorthand (such as simple fractions and exponents).
        // Since ARIA alerts relate to moving through interactive content, we don't want to use that shorthand if it exists
        // since doing so may be ambiguous or confusing.
        var itemMathspeak = item.mathspeak({ ignoreShorthand: true });
        if (shouldDescribe) {
          // used to ensure item is described when cursor reaches block boundaries
          if (
            item.parent &&
            item.parent.ariaLabel &&
            item.ariaLabel === 'block'
          ) {
            return item.parent.ariaLabel + ' ' + itemMathspeak;
          } else if (item.ariaLabel) {
            return item.ariaLabel + ' ' + itemMathspeak;
          }
        }
        return itemMathspeak;
      }
      return item || '';
    });
    return processedItems.join(' ');
  }

  queueDirOf(
    dir: Direction,
    items: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ) {
    prayDirection(dir);
    const str = dir === L ? 'before' : 'after';
    return this.queueDir(str, items, shouldDescribe);
  }

  queueDirEndOf(
    dir: Direction,
    items: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ) {
    prayDirection(dir);
    const str = dir === L ? 'beginning of' : 'end of';
    return this.queueDir(str, items, shouldDescribe);
  }

  private queueDir(
    dirStr: 'before' | 'after' | 'beginning of' | 'end of',
    items: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ) {
    if (
      this.controller.ariaStringsOverrideMap &&
      this.controller.ariaStringsOverrideMap[dirStr]
    ) {
      return this.queue(
        this.controller.ariaStringsOverrideMap[dirStr](
          this.processQueueItems(items, shouldDescribe)
        )
      );
    }
    return this.queue(dirStr).queue(items, shouldDescribe);
  }

  queueSelected(
    items: AriaQueueItem | AriaQueueItem[],
    shouldDescribe: boolean = false
  ) {
    if (
      this.controller.ariaStringsOverrideMap &&
      this.controller.ariaStringsOverrideMap.selected
    ) {
      return this.queue(
        this.controller.ariaStringsOverrideMap.selected(
          this.processQueueItems(items, shouldDescribe)
        ),
        shouldDescribe
      );
    }
    return this.queue(items, shouldDescribe).queue(' selected');
  }

  alert(t?: AriaQueueItem) {
    this.attach();
    if (t) this.queue(t);
    if (this.items.length) {
      // To cut down on potential verbiage from multiple Mathquills firing near-simultaneous ARIA alerts,
      // update the text of this instance if its container also has keyboard focus.
      // If it does not, leave the DOM unchanged but flush the queue regardless.
      // Note: updating the msg variable regardless of focus for unit tests.
      this.msg = this.items
        .join(' ')
        .replace(/ +(?= )/g, '')
        .trim();
      if (this.controller.containerHasFocus()) {
        if (this.controller.options.logAriaAlerts && this.msg) {
          console.log(this.msg);
        }
        this.span.textContent = this.msg;
      }
    }
    return this.clear();
  }

  clear() {
    this.items.length = 0;
    return this;
  }
}

// rm_below_makefile

// We need to add these delimiters to delete the tests in MakeFile because we
//   don't bundle and tree shake out unused code.
// To run any in-source tests, uncomment the "if" block and run the command
//   `npm run test`.

// if (import.meta?.vitest) {
//   const { it, expect, vi } = import.meta.vitest;

//   const ctrlrStub = {
//     container: document.createElement('div'),
//     containerHasFocus: () => true,
//     options: {
//       logAriaAlerts: true,
//     },
//   } as unknown as Controller;

//   const hMock = (tag: string) => {
//     const el = document.createElement(tag);
//     return el;
//   };

//   vi.stubGlobal('prayDirection', () => {});

//   vi.stubGlobal('h', hMock);
//   vi.stubGlobal('domFrag', (el: HTMLElement) => el);
//   vi.stubGlobal(
//     'MQNode',
//     class MQNode {
//       mathspeak() {
//         return 'hello';
//       }
//       parent = null;
//     }
//   );
//   vi.stubGlobal('L', -1);
//   vi.stubGlobal('R', 1);

//   it('should queue and alert', () => {
//     const aria = new Aria(ctrlrStub);
//     aria.queue('hello').queue('world').alert();
//     expect(aria.msg).toBe('hello world');
//     expect(aria.span.textContent).toBe(aria.msg);
//   });

//   it('should clear', () => {
//     const aria = new Aria(ctrlrStub);
//     aria.queue('hello').queue('world').clear();
//     expect(aria.items).toEqual([]);
//   });

//   it('should queueDirOf', () => {
//     const aria = new Aria(ctrlrStub);
//     aria
//       .queueDirOf(R, 'the rise')
//       .queueDirOf(L, 'the fall')
//       .alert();
//     expect(aria.msg).toEqual('after the rise before the fall');
//     expect(aria.span.textContent).toEqual(aria.msg);
//   });

//   it('should queueDirEndOf', () => {
//     const aria = new Aria(ctrlrStub);
//     aria
//       .queueDirEndOf(R, 'the rise')
//       .queueDirEndOf(L, 'the fall')
//       .alert();
//     expect(aria.msg).toEqual('end of the rise beginning of the fall');
//     expect(aria.span.textContent).toEqual(aria.msg);
//   });

//   it('should queue with MQNode item without parent or ariaLabel', () => {
//     const aria = new Aria(ctrlrStub);
//     aria.queue(new MQNode());
//     expect(aria.items).toEqual(['hello']);
//   });

//   it('should queue with MQNode item with parent and ariaLabel', () => {
//     const aria = new Aria(ctrlrStub);
//     const parent = new MQNode();
//     parent.ariaLabel = 'i am a parent';
//     const node = new MQNode();
//     node.parent = parent;
//     node.ariaLabel = 'block';
//     aria.queue(node, true);
//     expect(aria.items).toEqual(['i am a parent hello']);
//   });

//   it('should queue with MQNode item with ariaLabel and no parent', () => {
//     const aria = new Aria(ctrlrStub);
//     const node = new MQNode();
//     node.ariaLabel = 'goodbye';
//     aria.queue(node, true);
//     expect(aria.items).toEqual(['goodbye hello']);
//   });
// }
// rm_above_makefile
