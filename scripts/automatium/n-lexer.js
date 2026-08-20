const NLexer = (() => {
  class NLanguageError extends Error {
    constructor(message, tokenOrPosition) {
      const line = tokenOrPosition?.line ?? 1;
      const column = tokenOrPosition?.column ?? 1;
      super(`${line}:${column} ${message}`);
      this.name = 'NLanguageError';
      this.line = line;
      this.column = column;
    }
  }

  function tokenize(source) {
    const text = String(source ?? '');
    const tokens = [];
    let index = 0;
    let line = 1;
    let column = 1;

    const position = () => ({ line, column });
    const add = (type, value, start) => tokens.push({ type, value, ...start });
    const peek = (offset = 0) => text[index + offset] ?? '';
    const advance = () => {
      const char = text[index++];
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      return char;
    };

    while (index < text.length) {
      const char = peek();

      if (char === ' ' || char === '\t' || char === '\r') {
        advance();
        continue;
      }

      if (char === '\n' || char === ';') {
        const start = position();
        advance();
        add('newline', '\n', start);
        continue;
      }

      if (char === '/' && peek(1) === '/') {
        while (index < text.length && peek() !== '\n') advance();
        continue;
      }

      if (char === '/' && peek(1) === '*') {
        const start = position();
        advance();
        advance();
        let closed = false;
        while (index < text.length) {
          if (peek() === '*' && peek(1) === '/') {
            advance();
            advance();
            closed = true;
            break;
          }
          advance();
        }
        if (!closed) throw new NLanguageError('여러 줄 주석이 닫히지 않았습니다.', start);
        continue;
      }

      if (/[0-9]/.test(char)) {
        const start = position();
        let value = '';
        while (/[0-9]/.test(peek())) value += advance();
        if (peek() === '.' && /[0-9]/.test(peek(1))) {
          value += advance();
          while (/[0-9]/.test(peek())) value += advance();
        }
        if (peek().toLowerCase() === 'e') {
          value += advance();
          if (peek() === '+' || peek() === '-') value += advance();
          if (!/[0-9]/.test(peek())) {
            throw new NLanguageError('지수 뒤에 숫자가 필요합니다.', position());
          }
          while (/[0-9]/.test(peek())) value += advance();
        }
        add('number_literal', value, start);
        continue;
      }

      if (/[A-Za-z_]/.test(char)) {
        const start = position();
        let value = '';
        while (/[A-Za-z0-9_]/.test(peek())) value += advance();
        add('identifier', value, start);
        continue;
      }

      const start = position();
      const pair = char + peek(1);
      if (['==', '!=', '>=', '<='].includes(pair)) {
        advance();
        advance();
        add('operator', pair, start);
        continue;
      }
      if (['=', '>', '<', '+', '-', '*', '/', '%', '^'].includes(char)) {
        advance();
        add('operator', char, start);
        continue;
      }
      if (char === '{' || char === '}' || char === '(' || char === ')' || char === '[' || char === ']' || char === '.') {
        advance();
        add('punctuation', char, start);
        continue;
      }

      throw new NLanguageError(`알 수 없는 문자 '${char}'`, start);
    }

    tokens.push({ type: 'eof', value: '', line, column });
    return tokens;
  }

  return { tokenize, NLanguageError };
})();
