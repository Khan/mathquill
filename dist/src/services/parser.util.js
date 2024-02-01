import { pray } from '../bundle';
function parseError(stream, message) {
  if (stream) {
    stream = "'" + stream + "'";
  } else {
    stream = 'EOF';
  }
  throw 'Parse Error: ' + message + ' at ' + stream;
}
export class Parser {
  constructor(body) {
    this._ = body;
  }
  parse(stream) {
    return this.skip(Parser.eof)._('' + stream, success, parseError);
    function success(_stream, result) {
      return result;
    }
  }
  or(alternative) {
    pray('or is passed a parser', alternative instanceof Parser);
    var self = this;
    return new Parser(function (stream, onSuccess, onFailure) {
      return self._(stream, onSuccess, failure);
      function failure(_newStream) {
        return alternative._(stream, onSuccess, onFailure);
      }
    });
  }
  then(next) {
    var self = this;
    return new Parser(function (stream, onSuccess, onFailure) {
      return self._(stream, success, onFailure);
      function success(newStream, result) {
        var nextParser = next instanceof Parser ? next : next(result);
        pray('a parser is returned', nextParser instanceof Parser);
        return nextParser._(newStream, onSuccess, onFailure);
      }
    });
  }
  many() {
    var self = this;
    return new Parser(function (stream, onSuccess, _onFailure) {
      var xs = [];
      while (self._(stream, success, failure));
      return onSuccess(stream, xs);
      function success(newStream, x) {
        stream = newStream;
        xs.push(x);
        return true;
      }
      function failure() {
        return false;
      }
    });
  }
  times(min, max) {
    if (arguments.length < 2) max = min;
    var self = this;
    return new Parser(function (stream, onSuccess, onFailure) {
      var xs = [];
      var result = true;
      var failure;
      for (var i = 0; i < min; i += 1) {
        result = !!self._(stream, success, firstFailure);
        if (!result) return onFailure(stream, failure);
      }
      for (var i = 0; i < max && result; i += 1) {
        self._(stream, success, secondFailure);
      }
      return onSuccess(stream, xs);
      function success(newStream, x) {
        xs.push(x);
        stream = newStream;
        return true;
      }
      function firstFailure(newStream, msg) {
        failure = msg;
        stream = newStream;
        return false;
      }
      function secondFailure(_newStream, _msg) {
        return false;
      }
    });
  }
  result(res) {
    return this.then(Parser.succeed(res));
  }
  atMost(n) {
    return this.times(0, n);
  }
  atLeast(n) {
    var self = this;
    return self.times(n).then(function (start) {
      return self.many().map(function (end) {
        return start.concat(end);
      });
    });
  }
  map(fn) {
    return this.then(function (result) {
      return Parser.succeed(fn(result));
    });
  }
  skip(two) {
    return this.then(function (result) {
      return two.result(result);
    });
  }
  static string(str) {
    var len = str.length;
    var expected = "expected '" + str + "'";
    return new Parser(function (stream, onSuccess, onFailure) {
      var head = stream.slice(0, len);
      if (head === str) {
        return onSuccess(stream.slice(len), head);
      } else {
        return onFailure(stream, expected);
      }
    });
  }
  static regex(re) {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');
    var expected = 'expected ' + re;
    return new Parser(function (stream, onSuccess, onFailure) {
      var match = re.exec(stream);
      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      } else {
        return onFailure(stream, expected);
      }
    });
  }
  static succeed(result) {
    return new Parser(function (stream, onSuccess) {
      return onSuccess(stream, result);
    });
  }
  static fail(msg) {
    return new Parser(function (stream, _, onFailure) {
      return onFailure(stream, msg);
    });
  }
}
Parser.letter = Parser.regex(/^[a-z]/i);
Parser.letters = Parser.regex(/^[a-z]*/i);
Parser.digit = Parser.regex(/^[0-9]/);
Parser.digits = Parser.regex(/^[0-9]*/);
Parser.whitespace = Parser.regex(/^\s+/);
Parser.optWhitespace = Parser.regex(/^\s*/);
Parser.any = new Parser(function (stream, onSuccess, onFailure) {
  if (!stream) return onFailure(stream, 'expected any character');
  return onSuccess(stream.slice(1), stream.charAt(0));
});
Parser.all = new Parser(function (stream, onSuccess, _onFailure) {
  return onSuccess('', stream);
});
Parser.eof = new Parser(function (stream, onSuccess, onFailure) {
  if (stream) return onFailure(stream, 'expected EOF');
  return onSuccess(stream, stream);
});
