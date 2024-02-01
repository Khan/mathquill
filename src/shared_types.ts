import {
  Controller,
  Cursor,
  L,
  LatexFragment,
  MQNode,
  NodeBase,
  Options,
  R,
  TempSingleCharNode,
  MathQuill,
} from './bundle';

export type NodeRef = MQNode | 0;
export type ControllerEvent =
  | 'move'
  | 'upDown'
  | 'replace'
  | 'edit'
  | 'select'
  | undefined;
export type JoinMethod = 'mathspeak' | 'text' | 'latex';

export type CursorOptions = Options;

// These types are just aliases for the corresponding public types, for use in internal code.
// If we version the interface, these can be changed to "MathQuill.v4...." (or maybe "MathQuill.v3.... | MathQuill.v3....")
export type BaseMathQuill = MathQuill.v3.BaseMathQuill;
export type EditableMathQuill = MathQuill.v3.EditableMathQuill;
export type EmbedOptions = MathQuill.v3.EmbedOptions;
export type EmbedOptionsData = MathQuill.v3.EmbedOptionsData;
export type HandlersWithDirection = MathQuill.v3.HandlersWithDirection;
export type HandlersWithoutDirection = MathQuill.v3.HandlersWithoutDirection;
export type HandlerOptions = MathQuill.v3.HandlerOptions;

export type ConfigOptions = MathQuill.v1.Config | MathQuill.v3.Config;

export type MathspeakOptions = {
  createdLeftOf?: Cursor;
  ignoreShorthand?: boolean;
};
export type InequalityData = {
  ctrlSeq: string;
  ctrlSeqStrict: string;
  htmlEntity: string;
  htmlEntityStrict: string;
  text: string;
  textStrict: string;
  mathspeak: string;
  mathspeakStrict: string;
};

export type LatexContext = {
  latex: string;
  startIndex: number;
  endIndex: number;
  startSelectionBefore?: NodeBase;
  startSelectionAfter?: NodeBase;
  endSelectionBefore?: NodeBase;
  endSelectionAfter?: NodeBase;
};

export type ControllerData = { [key: string]: any };
export type ControllerRoot = MQNode & {
  controller: Controller;
  cursor?: Cursor;
  latex: () => string;
  latexRecursive: (ctx: LatexContext) => void;
};
export type JQ_KeyboardEvent = KeyboardEvent & {
  originalEvent?: KeyboardEvent;
};
export type RootBlockMixinInput = MQNode & { controller?: Controller };
export type BracketSide = typeof L | typeof R | 0;

export type InnerMathField = any;
export type InnerFields = any;
export type LatexCmdsAny = any;
export type CharCmdsAny = any;
export type LatexCmdsSingleCharBuilder = Record<
  string,
  (char: string) => MQNode
>;
export type LatexCmdsSingleChar = Record<
  string,
  undefined | typeof TempSingleCharNode | ((char: string) => TempSingleCharNode)
>;

export type LatexFragmentBuilderNoParam = () => LatexFragment;
export type MQNodeBuilderNoParam = () => MQNode;
export type MQNodeBuilderOneParam = (string: string) => MQNode;

export type LatexCmd =
  | typeof MQNode
  | MQNodeBuilderNoParam
  | MQNodeBuilderOneParam
  | LatexFragmentBuilderNoParam;
export type LatexCmdsType = Record<string, LatexCmd>;
export type CharCmdsType = Record<string, LatexCmd>;

export var validateAutoCommandsOption: any;

export type JQSelector =
  | $
  | HTMLElement
  | null
  | Window
  | NodeListOf<ChildNode>
  | HTMLElement[]
  | EventTarget;

export interface $ {
  (selector?: JQSelector): $;
  length: number;
  [index: number]: HTMLElement; // TODO - this can be undefined. Either fix uses or wait until removing jquery
}
