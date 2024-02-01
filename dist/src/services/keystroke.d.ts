import {
  Controller,
  Controller_focusBlur,
  Cursor,
  Direction,
  NodeBase,
} from '../bundle';
export declare class MQNode extends NodeBase {
  keystroke(key: string, e: KeyboardEvent | undefined, ctrlr: Controller): void;
  moveOutOf(_dir: Direction, _cursor: Cursor, _updown?: 'up' | 'down'): void;
  moveTowards(_dir: Direction, _cursor: Cursor, _updown?: 'up' | 'down'): void;
  deleteOutOf(_dir: Direction, _cursor: Cursor): void;
  deleteTowards(_dir: Direction, _cursor: Cursor): void;
  unselectInto(_dir: Direction, _cursor: Cursor): void;
  selectOutOf(_dir: Direction, _cursor: Cursor): void;
  selectTowards(_dir: Direction, _cursor: Cursor): void;
}
export declare class Controller_keystroke extends Controller_focusBlur {
  keystroke(key: string, evt?: KeyboardEvent): void;
  escapeDir(dir: Direction, _key: string, e?: KeyboardEvent): this | undefined;
  moveDir(dir: Direction): this;
  moveLeft(): this;
  moveRight(): this;
  moveUp(): this;
  moveDown(): this;
  moveUpDown(dir: 'up' | 'down'): this;
  deleteDir(dir: Direction): this;
  ctrlDeleteDir(dir: Direction): this;
  backspace(): this;
  deleteForward(): this;
  startIncrementalSelection(): void;
  selectDirIncremental(dir: Direction): void;
  finishIncrementalSelection(): void;
  withIncrementalSelection(
    cb: (selectDir: (dir: Direction) => void) => void
  ): void;
  selectDir(dir: Direction): void;
  selectLeft(): void;
  selectRight(): void;
  selectAll(): void;
  selectToBlockEndInDir(dir: Direction): void;
  selectToRootEndInDir(dir: Direction): void;
}
//# sourceMappingURL=keystroke.d.ts.map
