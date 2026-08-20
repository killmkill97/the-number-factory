const NParser = (() => {
  const { NLanguageError } = NLexer;

  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.index = 0;
    }

    current(offset = 0) {
      return this.tokens[this.index + offset] ?? this.tokens[this.tokens.length - 1];
    }

    is(type, value, offset = 0) {
      const token = this.current(offset);
      return token.type === type && (value === undefined || token.value === value);
    }

    isWord(value, offset = 0) {
      return this.is('identifier', value, offset);
    }

    consume(type, value, message) {
      const token = this.current();
      if (!this.is(type, value)) {
        throw new NLanguageError(message ?? `'${value ?? type}'이 필요합니다.`, token);
      }
      this.index++;
      return token;
    }

    consumeWord(message) {
      return this.consume('identifier', undefined, message);
    }

    skipNewlines() {
      while (this.is('newline')) this.index++;
    }

    finishStatement() {
      if (this.is('newline')) this.skipNewlines();
      else if (!this.is('punctuation', '}') && !this.is('eof')) {
        throw new NLanguageError('명령 뒤에 줄바꿈이 필요합니다.', this.current());
      }
    }

    parseProgram() {
      const statements = [];
      this.skipNewlines();
      while (!this.is('eof')) {
        statements.push(this.parseStatement());
        this.skipNewlines();
      }
      return { type: 'Program', statements };
    }

    parseStatement() {
      const token = this.current();
      if (this.isWord('buy')) return this.parseBuy();
      if (this.isWord('click')) return this.parseClick();
      if (this.isWord('square') || this.isWord('sp')) return this.parseSquare();
      if (this.isWord('if')) return this.parseIf();
      if (this.isWord('while')) return this.parseWhile();
      if (this.isWord('whiletick')) return this.parseWhileTick();
      if (this.isWord('for')) return this.parseFor();
      if (this.isWord('break')) return this.parseBreak();
      if (this.is('identifier') && this.is('operator', '=', 1)) return this.parseAssignment();
      throw new NLanguageError(`알 수 없는 명령 '${token.value || token.type}'`, token);
    }

    parseAssignment() {
      const name = this.consumeWord('변수 이름이 필요합니다.');
      this.consume('operator', '=', "'='이 필요합니다.");
      if ((this.isWord('number') || this.isWord('boolean')) && this.isLineEnd(1)) {
        const dataType = this.consumeWord().value;
        this.finishStatement();
        return { type: 'Declaration', name: name.value, dataType, line: name.line };
      }
      const expression = this.parseExpression();
      this.finishStatement();
      return { type: 'Assignment', name: name.value, expression, line: name.line };
    }

    isLineEnd(offset = 0) {
      const token = this.current(offset);
      return token.type === 'newline' || token.type === 'eof' || (token.type === 'punctuation' && token.value === '}');
    }

    parseBuy() {
      const start = this.consume('identifier', 'buy');
      const kind = this.consumeWord('업그레이드 종류가 필요합니다.');
      const upgrade = this.consumeWord('업그레이드 이름이 필요합니다.');
      const upgradeIndex = this.parseOptionalIndex();
      let wait = false;
      if (this.isWord('s')) {
        this.index++;
        wait = true;
      }
      this.finishStatement();
      return { type: 'Buy', kind: kind.value, upgrade: upgrade.value, upgradeIndex, wait, line: start.line };
    }

    parseOptionalIndex() {
      if (!this.is('punctuation', '[')) return null;
      this.index++;
      const expression = this.parseExpression();
      this.consume('punctuation', ']', "']'가 필요합니다.");
      return expression;
    }

    parseClick() {
      const start = this.consume('identifier', 'click');
      this.finishStatement();
      return { type: 'Click', line: start.line };
    }

    parseSquare() {
      const start = this.consumeWord();
      let amount = null;
      if (!this.isLineEnd() && !this.isWord('s')) {
        amount = this.parseExpression();
      }
      let wait = false;
      if (this.isWord('s')) {
        this.index++;
        wait = true;
      }
      this.finishStatement();
      return { type: 'Square', amount, wait, line: start.line };
    }

    parseIf() {
      const start = this.consume('identifier', 'if');
      const branches = [{ condition: this.parseExpression(), body: this.parseBlock() }];
      this.skipNewlines();
      while (this.isWord('elif')) {
        this.index++;
        branches.push({ condition: this.parseExpression(), body: this.parseBlock() });
        this.skipNewlines();
      }
      let elseBody = null;
      if (this.isWord('else')) {
        this.index++;
        elseBody = this.parseBlock();
      }
      return { type: 'If', branches, elseBody, line: start.line };
    }

    parseWhile() {
      const start = this.consume('identifier', 'while');
      const condition = this.parseExpression();
      const body = this.parseBlock();
      return { type: 'While', condition, body, line: start.line };
    }

    parseWhileTick() {
      const start = this.consume('identifier', 'whiletick');
      const interval = this.parseUnary();
      const condition = this.parseExpression();
      const body = this.parseBlock();
      return { type: 'WhileTick', interval, condition, body, line: start.line };
    }

    parseFor() {
      const start = this.consume('identifier', 'for');
      const count = this.parseExpression();
      const body = this.parseBlock();
      return { type: 'For', count, body, line: start.line };
    }

    parseBreak() {
      const start = this.consume('identifier', 'break');
      this.finishStatement();
      return { type: 'Break', line: start.line };
    }

    parseBlock() {
      this.consume('punctuation', '{', "'{'가 필요합니다.");
      const statements = [];
      this.skipNewlines();
      while (!this.is('punctuation', '}')) {
        if (this.is('eof')) throw new NLanguageError("'}'가 필요합니다.", this.current());
        statements.push(this.parseStatement());
        this.skipNewlines();
      }
      this.consume('punctuation', '}');
      return statements;
    }

    parseExpression(minPrecedence = 0) {
      let left = this.parseUnary();
      while (true) {
        const operator = this.binaryOperator();
        const precedence = this.precedence(operator);
        if (precedence < minPrecedence) break;
        const operatorToken = this.current();
        this.index++;
        const right = this.parseExpression(precedence + (operator === '^' ? 0 : 1));
        left = { type: 'Binary', operator, left, right, line: operatorToken.line };
      }
      return left;
    }

    binaryOperator() {
      if (this.is('operator') && ['==', '!=', '>', '>=', '<', '<=', '+', '-', '*', '/', '%', '^'].includes(this.current().value)) {
        return this.current().value;
      }
      if (this.isWord('and') || this.isWord('or')) return this.current().value;
      return null;
    }

    precedence(operator) {
      if (operator === 'or') return 1;
      if (operator === 'and') return 2;
      if (['==', '!=', '>', '>=', '<', '<='].includes(operator)) return 3;
      if (operator === '+' || operator === '-') return 4;
      if (operator === '*' || operator === '/' || operator === '%') return 5;
      if (operator === '^') return 6;
      return -1;
    }

    parseUnary() {
      if (this.is('operator', '+') || this.is('operator', '-') || this.isWord('not')) {
        const token = this.current();
        this.index++;
        return { type: 'Unary', operator: token.value, value: this.parseUnary(), line: token.line };
      }
      return this.parsePrimary();
    }

    parsePrimary() {
      const token = this.current();
      if (this.is('number_literal')) {
        this.index++;
        const value = /[.eE]/.test(token.value) ? Number(token.value) : BigInt(token.value);
        if (typeof value === 'number' && !Number.isFinite(value)) {
          throw new NLanguageError('숫자가 너무 큽니다.', token);
        }
        return { type: 'Literal', value, line: token.line };
      }
      if (this.isWord('true') || this.isWord('false')) {
        this.index++;
        return { type: 'Literal', value: token.value === 'true', line: token.line };
      }
      if (this.isWord('get')) {
        this.index++;
        const path = [];
        while (this.is('punctuation', '.')) {
          this.index++;
          const name = this.consumeWord("get 뒤에 값 이름이 필요합니다.");
          path.push({ name: name.value, index: this.parseOptionalIndex() });
        }
        if (path.length === 0) throw new NLanguageError("get 뒤에 '.값'이 필요합니다.", token);
        return { type: 'Get', path, line: token.line };
      }
      if (this.is('identifier')) {
        this.index++;
        return { type: 'Variable', name: token.value, line: token.line };
      }
      if (this.is('punctuation', '(')) {
        this.index++;
        const expression = this.parseExpression();
        this.consume('punctuation', ')', "')'가 필요합니다.");
        return expression;
      }
      throw new NLanguageError('계산식이 필요합니다.', token);
    }
  }

  function parse(source) {
    return new Parser(NLexer.tokenize(source)).parseProgram();
  }

  return { parse };
})();
