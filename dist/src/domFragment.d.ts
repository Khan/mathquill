import { Ends, Direction } from './bundle';
export declare class DOMFragment {
  ends: Ends<Node> | undefined;
  static create(first?: Node | undefined, last?: Node | undefined): DOMFragment;
  constructor(first?: Node, last?: Node);
  isEmpty(): boolean;
  isOneNode(): boolean;
  isValid(): boolean;
  firstNode(): Node;
  lastNode(): Node;
  children(): DOMFragment;
  join(sibling: DOMFragment): DOMFragment;
  oneNode(): Node;
  oneElement(): HTMLElement;
  oneText(): Text;
  eachNode(cb: (el: Node) => void): DOMFragment;
  eachElement(cb: (el: HTMLElement) => void): DOMFragment;
  text(): string;
  toNodeArray(): Node[];
  toElementArray(): HTMLElement[];
  toDocumentFragment(): DocumentFragment;
  insertBefore(sibling: DOMFragment): DOMFragment;
  insertAfter(sibling: DOMFragment): DOMFragment;
  append(children: DOMFragment): this;
  prepend(children: DOMFragment): this;
  appendTo(el: HTMLElement): DOMFragment;
  prependTo(el: HTMLElement): DOMFragment;
  parent(): DOMFragment;
  wrapAll(el: HTMLElement): this;
  replaceWith(children: DOMFragment): this;
  nthElement(n: number): HTMLElement | undefined;
  firstElement(): HTMLElement | undefined;
  lastElement(): HTMLElement | undefined;
  first(): DOMFragment;
  last(): DOMFragment;
  eq(n: number): DOMFragment;
  slice(n: number): DOMFragment;
  next(): DOMFragment;
  prev(): DOMFragment;
  empty(): this;
  remove(): this;
  detach(): this;
  insDirOf(dir: Direction, sibling: DOMFragment): DOMFragment;
  insAtDirEnd(dir: Direction, el: HTMLElement): DOMFragment;
  hasClass(className: string): boolean;
  addClass(classNames: string): this;
  removeClass(classNames: string): this;
  toggleClass(classNames: string, on?: boolean): this;
}
export declare var domFrag: typeof DOMFragment.create;
//# sourceMappingURL=domFragment.d.ts.map
