import {
  Controller,
  MathBlock,
  CursorOptions,
  ConfigOptions,
  BaseMathQuill,
  EditableMathQuill,
  EmbedOptions,
  EmbedOptionsData,
  HandlerOptions,
  RootBlockMixinInput,
  MathQuill as MathQuillTypes,
} from './bundle';
export type KIND_OF_MQ =
  | 'StaticMath'
  | 'MathField'
  | 'InnerMathField'
  | 'TextField';
interface InternalMathQuillInstance {
  __controller: Controller;
  __options: CursorOptions;
  id: number;
  data: {
    [key: string]: any;
  };
  mathquillify(classNames: string): void;
  __mathquillify(
    opts: ConfigOptions,
    _interfaceVersion: number
  ): IBaseMathQuill;
}
export interface IBaseMathQuill
  extends BaseMathQuill,
    InternalMathQuillInstance {}
interface IBaseMathQuillClass {
  new (ctrlr: Controller): IBaseMathQuill;
  RootBlock: typeof MathBlock;
}
export interface IEditableField
  extends EditableMathQuill,
    InternalMathQuillInstance {}
interface IEditableFieldClass {
  new (ctrlr: Controller): IEditableField;
  RootBlock: typeof MathBlock;
}
export interface APIClasses {
  StaticMath?: IBaseMathQuillClass;
  MathField?: IEditableFieldClass;
  InnerMathField?: IEditableFieldClass;
  TextField?: IEditableFieldClass;
  AbstractMathQuill: IBaseMathQuillClass;
  EditableField: IEditableFieldClass;
}
type APIClassBuilders = {
  StaticMath?: (APIClasses: APIClasses) => IBaseMathQuillClass;
  MathField?: (APIClasses: APIClasses) => IEditableFieldClass;
  InnerMathField?: (APIClasses: APIClasses) => IEditableFieldClass;
  TextField?: (APIClasses: APIClasses) => IEditableFieldClass;
};
export declare var API: APIClassBuilders;
export declare var EMBEDS: Record<
  string,
  (data: EmbedOptionsData) => EmbedOptions
>;
declare var processedOptions: {
  handlers: boolean;
  autoCommands: boolean;
  quietEmptyDelimiters: boolean;
  autoParenthesizedFunctions: boolean;
  autoOperatorNames: boolean;
  leftRightIntoCmdGoes: boolean;
  maxDepth: boolean;
  interpretTildeAsSim: boolean;
};
type ProcessedOption = keyof typeof processedOptions;
type OptionProcessors = Partial<{
  [K in ProcessedOption]: (optionValue: ConfigOptions[K]) => CursorOptions[K];
}>;
export declare const baseOptionProcessors: OptionProcessors;
export type AutoDict = {
  _maxLength?: number;
  [id: string]: any;
};
type SubstituteKeyboardEvents = (
  el: any,
  controller: Controller
) => {
  select: (text: string) => void;
};
export declare class Options {
  version: 1 | 2 | 3;
  constructor(version: 1 | 2 | 3);
  ignoreNextMousedown: (_el: MouseEvent) => boolean;
  substituteTextarea: () => HTMLElement;
  substituteKeyboardEvents: SubstituteKeyboardEvents;
  restrictMismatchedBrackets?: boolean;
  typingSlashCreatesNewFraction?: boolean;
  charsThatBreakOutOfSupSub: string;
  sumStartsWithNEquals?: boolean;
  autoSubscriptNumerals?: boolean;
  supSubsRequireOperand?: boolean;
  spaceBehavesLikeTab?: boolean;
  typingAsteriskWritesTimesSymbol?: boolean;
  typingSlashWritesDivisionSymbol: boolean;
  typingPercentWritesPercentOf?: boolean;
  resetCursorOnBlur?: boolean | undefined;
  leftRightIntoCmdGoes?: 'up' | 'down';
  enableDigitGrouping?: boolean;
  mouseEvents?: boolean;
  maxDepth?: number;
  disableCopyPaste?: boolean;
  statelessClipboard?: boolean;
  logAriaAlerts?: boolean;
  onPaste?: () => void;
  onCut?: () => void;
  overrideTypedText?: (text: string) => void;
  overrideKeystroke: (key: string, event: KeyboardEvent) => void;
  autoOperatorNames: AutoDict;
  autoCommands: AutoDict;
  autoParenthesizedFunctions: AutoDict;
  quietEmptyDelimiters: {
    [id: string]: any;
  };
  disableAutoSubstitutionInSubscripts?: boolean;
  interpretTildeAsSim: boolean;
  handlers?: {
    fns: HandlerOptions;
    APIClasses: APIClasses;
  };
  scrollAnimationDuration?: number;
  jQuery: any | undefined;
  assertJquery(): any;
}
declare class Progenote {}
declare function MathQuill(el: HTMLElement): any;
declare namespace MathQuill {
  var prototype: Progenote;
  var VERSION: string;
  var interfaceVersion: (v: number) => typeof MathQuill;
  var getInterface: {
    (v: 1): MathQuillTypes.v1.API;
    (v: 2): MathQuillTypes.v1.API;
    (v: 3): MathQuillTypes.v3.API;
    MIN: number;
    MAX: number;
  };
}
export declare function RootBlockMixin(_: RootBlockMixinInput): void;
export default MathQuill;
//# sourceMappingURL=publicapi.d.ts.map
