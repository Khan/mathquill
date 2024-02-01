import { Controller, Direction, Fragment, NodeRef } from '../bundle';
type AriaQueueItem = NodeRef | Fragment | string;
export declare class Aria {
  controller: Controller;
  span: HTMLElement;
  msg: string;
  items: AriaQueueItem[];
  constructor(controller: Controller);
  attach(): void;
  queue(item: AriaQueueItem, shouldDescribe?: boolean): this;
  queueDirOf(dir: Direction): this;
  queueDirEndOf(dir: Direction): this;
  alert(t?: AriaQueueItem): this;
  clear(): this;
}
export {};
//# sourceMappingURL=aria.d.ts.map
