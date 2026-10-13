const NRuntime = (() => {
  const MAX_SOURCE_LENGTH = 100000;
  const MAX_EXPONENT = 100000;
  const MAX_WAIT_TICKS = 1000000;

  function runtimeError(message, node) {
    throw new NLexer.NLanguageError(message, { line: node?.line ?? 1, column: 1 });
  }

  function valueType(value) {
    if (
      (typeof value === 'number' && Number.isFinite(value)) ||
      (typeof value === 'string' && /^\d+$/.test(value)) ||
      (typeof isApproximateNumber === 'function' && isApproximateNumber(value))
    ) return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'unknown';
  }

  function requireNumber(value, node) {
    if (valueType(value) !== 'number') runtimeError('number 값이 필요합니다.', node);
    return value;
  }

  function requireBoolean(value, node) {
    if (typeof value !== 'boolean') runtimeError('boolean 값이 필요합니다.', node);
    return value;
  }

  function finiteNumber(value, node) {
    if (typeof isApproximateNumber === 'function' && isApproximateNumber(value)) {
      runtimeError('근사 큰 수는 일반 실수로 바꿀 수 없습니다.', node);
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) return NumberMath.fromValue(value);
    if (!Number.isFinite(value)) runtimeError('계산 결과가 너무 큽니다.', node);
    return value;
  }

  function isScientificNumber(value) {
    return typeof isApproximateNumber === 'function' && isApproximateNumber(value);
  }

  function numericValueForGameMath(value, node) {
    requireNumber(value, node);
    if (isScientificNumber(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return NumberMath.fromValue(value);
    if (Number.isInteger(value)) return numberValueFromReal(value);
    return normalizeApproximateNumber(value, 0) ?? 0;
  }

  function integerExponent(value, node) {
    if (isScientificNumber(value)) runtimeError('거듭제곱 지수는 일반 정수여야 합니다.', node);
    const integer = isScientificNumber(value) ? Number.MAX_SAFE_INTEGER : Math.floor(realNumberFromValue(value));
    if (!Number.isSafeInteger(integer) || integer < 0 || integer > MAX_EXPONENT) {
      runtimeError(`거듭제곱 지수는 0부터 ${MAX_EXPONENT}까지여야 합니다.`, node);
    }
    return integer;
  }

  function numericBinary(operator, left, right, node) {
    requireNumber(left, node);
    requireNumber(right, node);
    const a = numericValueForGameMath(left, node);
    const b = numericValueForGameMath(right, node);
    if (operator === '+') return addBaseNumbers(a, b);
    if (operator === '-') return subtractNumberValues(a, b);
    if (operator === '*') return multiplyNumberValue(a, b);
    if (operator === '/') {
      if (compareNumberValues(b, 0) <= 0) runtimeError('0으로 나눌 수 없습니다.', node);
      return divideNumberValue(a, b);
    }
    if (operator === '%') {
      if (compareNumberValues(b, 0) === 0) runtimeError('0으로 나머지를 계산할 수 없습니다.', node);
      if (isScientificNumber(a) || isScientificNumber(b)) runtimeError('근사 큰 수에는 나머지 연산을 사용할 수 없습니다.', node);
      return NumberMath.modulo(a, b);
    }
    if (operator === '^') return NumberMath.power(a, integerExponent(right, node));
    runtimeError(`지원하지 않는 연산자 '${operator}'`, node);
  }

  function compare(operator, left, right, node) {
    const leftType = valueType(left);
    const rightType = valueType(right);
    if (operator === '==' || operator === '!=') {
      let equal;
      if (leftType === 'number' && rightType === 'number') {
        equal = compareNumberValues(
          numericValueForGameMath(left, node),
          numericValueForGameMath(right, node)
        ) === 0;
      } else {
        equal = leftType === rightType && left === right;
      }
      return operator === '==' ? equal : !equal;
    }
    requireNumber(left, node);
    requireNumber(right, node);
    const order = compareNumberValues(
      numericValueForGameMath(left, node),
      numericValueForGameMath(right, node)
    );
    if (operator === '>') return order > 0;
    if (operator === '>=') return order >= 0;
    if (operator === '<') return order < 0;
    if (operator === '<=') return order <= 0;
    runtimeError(`지원하지 않는 비교 연산자 '${operator}'`, node);
  }

  function evaluate(node, context) {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'Variable') {
      if (!context.variables.has(node.name)) runtimeError(`선언되지 않은 변수 '${node.name}'`, node);
      return context.variables.get(node.name).value;
    }
    if (node.type === 'Get') {
      const path = node.path.map(segment => ({
        name: segment.name,
        index: segment.index === null ? null : evaluate(segment.index, context)
      }));
      return context.adapter.get(path, node);
    }
    if (node.type === 'Unary') {
      const value = evaluate(node.value, context);
      if (node.operator === 'not') return !requireBoolean(value, node);
      const number = requireNumber(value, node);
      if (node.operator === '+') return number;
      if (node.operator === '-') {
        if (isScientificNumber(number) || typeof number === 'string') {
          runtimeError('근사 큰 수에는 음수 연산을 사용할 수 없습니다.', node);
        }
        return -number;
      }
    }
    if (node.type === 'Binary') {
      if (node.operator === 'and') {
        const left = requireBoolean(evaluate(node.left, context), node.left);
        return left && requireBoolean(evaluate(node.right, context), node.right);
      }
      if (node.operator === 'or') {
        const left = requireBoolean(evaluate(node.left, context), node.left);
        return left || requireBoolean(evaluate(node.right, context), node.right);
      }
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      if (['==', '!=', '>', '>=', '<', '<='].includes(node.operator)) {
        return compare(node.operator, left, right, node);
      }
      return numericBinary(node.operator, left, right, node);
    }
    runtimeError(`알 수 없는 계산식 '${node.type}'`, node);
  }

  function assign(statement, context) {
    const variable = context.variables.get(statement.name);
    if (!variable) runtimeError(`변수 '${statement.name}'를 먼저 선언하세요.`, statement);
    const value = evaluate(statement.expression, context);
    if (valueType(value) !== variable.dataType) {
      runtimeError(`변수 '${statement.name}'에는 ${variable.dataType} 값만 넣을 수 있습니다.`, statement);
    }
    variable.value = value;
  }

  function positiveTickCount(value, node) {
    requireNumber(value, node);
    const integer = Math.floor(realNumberFromValue(value));
    if (!Number.isSafeInteger(integer) || integer <= 0) runtimeError('whiletick 간격은 1 이상이어야 합니다.', node);
    return Math.min(MAX_WAIT_TICKS, integer);
  }

  function repeatCount(value, node) {
    requireNumber(value, node);
    const integer = Math.floor(realNumberFromValue(value));
    if (!Number.isSafeInteger(integer) || integer < 0) runtimeError('for 반복 횟수는 안전한 정수여야 합니다.', node);
    return integer;
  }

  function pointTarget(value, node, currency) {
    const label = currency === 'cp' ? 'CP' : 'SP';
    requireNumber(value, node);
    if (isScientificNumber(value)) {
      if (compareNumberValues(value, 0) <= 0) {
        runtimeError(`${label} 목표는 1 이상이어야 합니다.`, node);
      }
      return value;
    }
    if (typeof value === 'number' && !Number.isInteger(value)) {
      runtimeError(`${label} 목표는 정수여야 합니다.`, node);
    }
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      runtimeError(`${label} 목표는 안전한 정수여야 합니다. 큰 수는 일반 정수 표기로 입력하세요.`, node);
    }
    const integer = NumberMath.fromString(String(value), null);
    if (integer === null || compareNumberValues(integer, 0) <= 0) runtimeError(`${label} 목표는 1 이상이어야 합니다.`, node);
    return integer;
  }

  function waitDurationMs(statement) {
    const amount = Number(statement.amount);
    if (!Number.isFinite(amount)) runtimeError('대기 시간이 너무 큽니다.', statement);
    if (amount < 0) runtimeError('대기 시간은 0 이상이어야 합니다.', statement);
    const unitMultiplier = { ms: 1, s: 1000, m: 60000, h: 3600000 }[statement.unit];
    const durationMs = amount * unitMultiplier;
    if (!Number.isFinite(durationMs) || durationMs > Number.MAX_SAFE_INTEGER - Date.now()) {
      runtimeError('대기 시간이 너무 큽니다.', statement);
    }
    return durationMs;
  }

  function* executeStatements(statements, context, loopDepth) {
    for (const statement of statements) {
      yield { kind: 'step', line: statement.line };
      const signal = yield* executeStatement(statement, context, loopDepth);
      if (signal === 'break') return signal;
    }
    return null;
  }

  function* executeStatement(statement, context, loopDepth) {
    if (statement.type === 'Declaration') {
      if (context.variables.has(statement.name)) runtimeError(`변수 '${statement.name}'가 이미 선언되었습니다.`, statement);
      context.variables.set(statement.name, {
        dataType: statement.dataType,
        value: statement.dataType === 'number' ? 0 : false
      });
      return null;
    }

    if (statement.type === 'Assignment') {
      assign(statement, context);
      return null;
    }

    if (statement.type === 'Click') {
      context.adapter.click(statement);
      return null;
    }

    if (statement.type === 'Wait') {
      const durationMs = waitDurationMs(statement);
      yield {
        kind: 'wait-time',
        durationMs,
        line: statement.line,
        message: `${statement.amount}${statement.unit} 대기`
      };
      return null;
    }

    if (statement.type === 'Buy') {
      const upgradeIndex = statement.upgradeIndex === null
        ? null
        : evaluate(statement.upgradeIndex, context);
      while (true) {
        const result = context.adapter.buy(statement.kind, statement.upgrade, upgradeIndex, statement);
        if (!result && context.adapter.consumeBudgetYield?.()) {
          yield { kind: 'budget', line: statement.line, message: '다음 틱에서 구매 재개' };
          continue;
        }
        if (result) break;
        if (!statement.wait) return null;
        const indexText = upgradeIndex === null ? '' : `[${String(upgradeIndex)}]`;
        yield { kind: 'blocked', line: statement.line, message: `${statement.kind}.${statement.upgrade}${indexText} 구매 대기` };
      }
      return null;
    }

    if (statement.type === 'PointExchange') {
      const requestedTarget = statement.amount === null
        ? null
        : pointTarget(evaluate(statement.amount, context), statement.amount, statement.currency);
      const exchange = statement.currency === 'cp' ? context.adapter.cp : context.adapter.square;
      if (typeof exchange !== 'function') runtimeError(`${statement.currency.toUpperCase()} 교환 기능을 사용할 수 없습니다.`, statement);
      while (!exchange(statement, requestedTarget)) {
        if (!statement.wait) return null;
        const targetText = requestedTarget === null
          ? ''
          : ` ${isScientificNumber(requestedTarget)
            ? NumberMath.serialize(requestedTarget)
            : String(requestedTarget)}`;
        yield {
          kind: 'blocked',
          line: statement.line,
          message: `${targetText} ${statement.currency.toUpperCase()} 획득 대기`.trim()
        };
      }
      return null;
    }

    if (statement.type === 'If') {
      for (const branch of statement.branches) {
        if (requireBoolean(evaluate(branch.condition, context), branch.condition)) {
          return yield* executeStatements(branch.body, context, loopDepth);
        }
      }
      if (statement.elseBody) return yield* executeStatements(statement.elseBody, context, loopDepth);
      return null;
    }

    if (statement.type === 'While') {
      while (requireBoolean(evaluate(statement.condition, context), statement.condition)) {
        yield { kind: 'loop', line: statement.line };
        const signal = yield* executeStatements(statement.body, context, loopDepth + 1);
        if (signal === 'break') break;
      }
      return null;
    }

    if (statement.type === 'WhileTick') {
      const ticks = positiveTickCount(evaluate(statement.interval, context), statement.interval);
      while (requireBoolean(evaluate(statement.condition, context), statement.condition)) {
        yield { kind: 'wait-ticks', ticks, line: statement.line };
        if (!requireBoolean(evaluate(statement.condition, context), statement.condition)) break;
        const signal = yield* executeStatements(statement.body, context, loopDepth + 1);
        if (signal === 'break') break;
      }
      return null;
    }

    if (statement.type === 'For') {
      const count = repeatCount(evaluate(statement.count, context), statement.count);
      for (let index = 0; index < count; index++) {
        yield { kind: 'loop', line: statement.line };
        const signal = yield* executeStatements(statement.body, context, loopDepth + 1);
        if (signal === 'break') break;
      }
      return null;
    }

    if (statement.type === 'Break') {
      if (loopDepth <= 0) runtimeError('break는 while, whiletick, for 안에서만 사용할 수 있습니다.', statement);
      return 'break';
    }

    runtimeError(`알 수 없는 명령 '${statement.type}'`, statement);
  }

  function compile(source) {
    if (String(source ?? '').length > MAX_SOURCE_LENGTH) {
      runtimeError(`프로그램은 ${MAX_SOURCE_LENGTH}자 이하여야 합니다.`, { line: 1 });
    }
    return NParser.parse(source);
  }

  function createExecution(ast, adapter) {
    const context = { adapter, variables: new Map() };
    return {
      context,
      iterator: executeStatements(ast.statements, context, 0)
    };
  }

  return { compile, createExecution };
})();
