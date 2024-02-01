import { MathBlock } from './bundle';
export type HTMLTagName =
  | 'span'
  | 'textarea'
  | 'i'
  | 'b'
  | 'big'
  | 'sup'
  | 'var'
  | 'br'
  | 'var';
type SVGTagName = 'svg' | 'path';
interface CreateElementAttributes {
  class?: string;
  style?: string;
  [name: string]: string | boolean | number | undefined;
}
export declare function parseHTML(s: string): Element | DocumentFragment;
interface HtmlBuilder {
  (
    type: HTMLTagName,
    attributes?: CreateElementAttributes,
    children?: readonly (ChildNode | DocumentFragment)[] | NodeListOf<ChildNode>
  ): HTMLElement;
  (
    type: SVGTagName,
    attributes?: CreateElementAttributes,
    children?: readonly (ChildNode | DocumentFragment)[]
  ): SVGElement;
  text(s: string): Text;
  block(
    type: HTMLTagName,
    attributes: CreateElementAttributes | undefined,
    block: MathBlock
  ): HTMLElement;
  entityText(s: string): Text;
}
export declare var h: HtmlBuilder;
export declare function closest(
  el: unknown | null,
  s: string
): ParentNode | null;
export {};
//# sourceMappingURL=dom.d.ts.map
