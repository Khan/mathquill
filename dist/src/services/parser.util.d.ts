type UnknownParserResult = any;
type ParserBody<T> = (
  stream: string,
  onSuccess: (stream: string, result: T) => UnknownParserResult,
  onFailure: (stream: string, msg: string) => UnknownParserResult
) => T;
export declare class Parser<T> {
  _: ParserBody<T>;
  constructor(body: ParserBody<T>);
  parse(stream: unknown): T;
  or<Q>(alternative: Parser<Q>): Parser<T | Q>;
  then<Q>(next: Parser<Q> | ((result: T) => Parser<Q>)): Parser<Q>;
  many(): Parser<T[]>;
  times(min: number, max?: number): Parser<T[]>;
  result<Q>(res: Q): Parser<Q>;
  atMost(n: number): Parser<T[]>;
  atLeast(n: number): Parser<T[]>;
  map<Q>(fn: (result: T) => Q): Parser<Q>;
  skip<Q>(two: Parser<Q>): Parser<T>;
  static string(str: string): Parser<string>;
  static regex(re: RegExp): Parser<string>;
  static succeed<Q>(result: Q): Parser<Q>;
  static fail(msg: string): Parser<never>;
  static letter: Parser<string>;
  static letters: Parser<string>;
  static digit: Parser<string>;
  static digits: Parser<string>;
  static whitespace: Parser<string>;
  static optWhitespace: Parser<string>;
  static any: Parser<string>;
  static all: Parser<string>;
  static eof: Parser<string>;
}
export {};
//# sourceMappingURL=parser.util.d.ts.map
