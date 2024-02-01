import {
  Aria,
  Controller,
  ControllerData,
  ControllerEvent,
  ControllerRoot,
  Cursor,
  CursorOptions,
  Direction,
  HandlersWithDirection,
  HandlersWithoutDirection,
  KIND_OF_MQ,
} from './bundle';
type TextareaKeyboardEventListeners = Partial<{
  [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => unknown;
}>;
export declare class ControllerBase {
  id: number;
  data: ControllerData;
  readonly root: ControllerRoot;
  readonly container: HTMLElement;
  options: CursorOptions;
  aria: Aria;
  ariaLabel: string;
  ariaPostLabel: string;
  readonly cursor: Cursor;
  editable: boolean | undefined;
  _ariaAlertTimeout: number;
  KIND_OF_MQ: KIND_OF_MQ;
  textarea: HTMLElement | undefined;
  textareaEventListeners: Partial<{
    [K in keyof HTMLElementEventMap]: (
      event: HTMLElementEventMap[K]
    ) => unknown;
  }>;
  textareaSpan: HTMLElement | undefined;
  mathspeakSpan: HTMLElement | undefined;
  constructor(
    root: ControllerRoot,
    container: HTMLElement,
    options: CursorOptions
  );
  getControllerSelf(): Controller;
  handle(name: HandlersWithDirection, dir: Direction): void;
  handle(name: HandlersWithoutDirection): void;
  static notifyees: ((cursor: Cursor, e: ControllerEvent) => void)[];
  static onNotify(f: (cursor: Cursor, e: ControllerEvent) => void): void;
  notify(e: ControllerEvent): this;
  setAriaLabel(ariaLabel: string): this;
  getAriaLabel(): string;
  setAriaPostLabel(ariaPostLabel: string, timeout?: number): this;
  getAriaPostLabel(): string;
  containerHasFocus(): boolean | null;
  getTextareaOrThrow(): HTMLElement;
  getTextareaSpanOrThrow(): HTMLElement;
  addTextareaEventListeners(listeners: TextareaKeyboardEventListeners): void;
  removeTextareaEventListener(event: keyof HTMLElementEventMap): void;
  exportMathSpeak(): string;
  updateMathspeak(): void;
  scrollHoriz(): void;
  selectionChanged(): void;
  setOverflowClasses(): void;
}
export {};
//# sourceMappingURL=controller.d.ts.map
