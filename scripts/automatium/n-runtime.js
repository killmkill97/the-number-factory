const NRuntime = (() => {
  const MAX_SOURCE_LENGTH = 100000;
  const MAX_EXPONENT = 100000n;
  const MAX_WAIT_TICKS = 1000000;

  function runtimeError(message, node) {
    throw new NLexer.NLanguageError(message, { line: node?.line ?? 1, column: 1 });
  }

  function valueType(value) {
    if (
      typeof value === 'bigint' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
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
    const converted = typeof value === 'bigint' ? Number(value) : value;
    if (!Number.isFinite(converted)) runtimeError('계산 결과가 너무 큽니다.', node);
    return converted;
  }

  function isScientificNumber(value) {
    return typeof isApproximateNumber === 'function' && isApproximateNumber(value);
  }

  function numericValueForGameMath(value, node) {
    requireNumber(value, node);
    if (isScientificNumber(value) || typeof value === 'bigint') return value;
    if (Number.isInteger(value)) return BigInt(value);
    return normalizeApproximateNumber(value, 0) ?? 0n;
  }

  function integerExponent(value, node) {
    if (isScientificNumber(value)) runtimeError('거듭제곱 지수는 일반 정수여야 합니다.', node);
    const integer = typeof value === 'bigint' ? value : BigInt(Math.floor(value));
    if (integer < 0n || integer > MAX_EXPONENT) {
      runtimeError(`거듭제곱 지수는 0부터 ${MAX_EXPONENT}까지여야 합니다.`, node);
    }
    return integer;
  }

  function numericBinary(operator, left, right, node) {
    requireNumber(left, node);
    requireNumber(right, node);
    const usesScientific = isScientificNumber(left) || isScientificNumber(right);
    if (usesScientific) {
      const a = numericValueForGameMath(left, node);
      const b = numericValueForGameMath(right, node);
      if (operator === '+') return addBaseNumbers(a, b);
      if (operator === '-') return subtractNumberValues(a, b);
      if (operator === '*') return multiplyNumberValue(a, b);
      if (operator === '/') {
        if (compareNumberValues(b, 0n) <= 0) runtimeError('0으로 나눌 수 없습니다.', node);
        return divideNumberValue(a, b);
      }
      if (operator === '%') runtimeError('근사 큰 수에는 나머지 연산을 사용할 수 없습니다.', node);
      if (operator === '^') return NumberMath.power(a, integerExponent(right, node));
    }
    const bothIntegers = typeof left === 'bigint' && typeof right === 'bigint';

    if (operator === '+') return bothIntegers ? left + right : finiteNumber(left, node) + finiteNumber(right, node);
    if (operator === '-') return bothIntegers ? left - right : finiteNumber(left, node) - finiteNumber(right, node);
    if (operator === '*') return bothIntegers ? left * right : finiteNumber(left, node) * finiteNumber(right, node);
    if (operator === '/') {
      if ((bothIntegers && right === 0n) || (!bothIntegers && finiteNumber(right, node) === 0)) runtimeError('0으로 나눌 수 없습니다.', node);
      return bothIntegers ? left / right : finiteNumber(left, node) / finiteNumber(right, node);
    }
    if (operator === '%') {
      if ((bothIntegers && right === 0n) || (!bothIntegers && finiteNumber(right, node) === 0)) runtimeError('0으로 나머지를 계산할 수 없습니다.', node);
      return bothIntegers ? left % right : finiteNumber(left, node) % finiteNumber(right, node);
    }
    if (operator === '^') {
      if (bothIntegers) {
        if (right < 0n) runtimeError('정수 거듭제곱의 지수는 0 이상이어야 합니다.', node);
        if (right > MAX_EXPONENT) runtimeError(`거듭제곱 지수는 ${MAX_EXPONENT} 이하여야 합니다.`, node);
        return left ** right;
      }
      const result = Math.pow(finiteNumber(left, node), finiteNumber(right, node));
      if (!Number.isFinite(result)) runtimeError('거듭제곱 결과가 너무 큽니다.', node);
      return result;
    }
    runtimeError(`지원하지 않는 연산자 '${operator}'`, node);
  }

  function compare(operator, left, right, node) {
    const leftType = valueType(left);
    const rightType = valueType(right);
    if (operator === '==' || operator === '!=') {
      let equal;
      if (leftType === 'number' && rightType === 'number') {
        equal = isScientificNumber(left) || isScientificNumber(right)
          ? compareNumberValues(numericValueForGameMath(left, node), numericValueForGameMath(right, node)) === 0
          : typeof left === 'bigint' && typeof right === 'bigint'
          ? left === right
          : finiteNumber(left, node) === finiteNumber(right, node);
      } else {
        equal = leftType === rightType && left === right;
      }
      return operator === '==' ? equal : !equal;
    }
    requireNumber(left, node);
    requireNumber(right, node);
    if (isScientificNumber(left) || isScientificNumber(right)) {
      const order = compareNumberValues(numericValueForGameMath(left, node), numericValueForGameMath(right, node));
      if (operator === '>') return order > 0;
      if (operator === '>=') return order >= 0;
      if (operator === '<') return order < 0;
      if (operator === '<=') return order <= 0;
    }
    if (operator === '>') return left > right;
    if (operator === '>=') return left >= right;
    if (operator === '<') return left < right;
    if (operator === '<=') return left <= right;
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
        if (isScientificNumber(number)) runtimeError('근사 큰 수에는 음수 연산을 사용할 수 없습니다.', node);
        return typeof number === 'bigint' ? -number : -number;
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
    if (isScientificNumber(value)) runtimeError('whiletick 간격은 일반 정수여야 합니다.', node);
    const integer = typeof value === 'bigint' ? value : BigInt(Math.floor(value));
    if (integer <= 0n) runtimeError('whiletick 간격은 1 이상이어야 합니다.', node);
    return Number(integer > BigInt(MAX_WAIT_TICKS) ? BigInt(MAX_WAIT_TICKS) : integer);
  }

  function repeatCount(value, node) {
    requireNumber(value, node);
    if (isScientificNumber(value)) runtimeError('for 반복 횟수는 일반 정수여야 합니다.', node);
    const integer = typeof value === 'bigint' ? value : BigInt(Math.floor(value));
    if (integer < 0n) runtimeError('for 반복 횟수는 0 이상이어야 합니다.', node);
    return integer;
  }

  function squarePointTarget(value, node) {
    requireNumber(value, node);
    if (isScientificNumber(value)) runtimeError('SP 목표는 일반 정수여야 합니다.', node);
    if (typeof value === 'number' && !Number.isInteger(value)) {
      runtimeError('SP 목표는 정수여야 합니다.', node);
    }
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      runtimeError('SP 목표는 안전한 정수여야 합니다. 큰 수는 일반 정수 표기로 입력하세요.', node);
    }
    const integer = typeof value === 'bigint' ? value : BigInt(value);
    if (integer <= 0n) runtimeError('SP 목표는 1 이상이어야 합니다.', node);
    return integer;
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
        value: statement.dataType === 'number' ? 0n : false
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

    if (statement.type === 'Buy') {
      const upgradeIndex = statement.upgradeIndex === null
        ? null
        : evaluate(statement.upgradeIndex, context);
      while (!context.adapter.buy(statement.kind, statement.upgrade, upgradeIndex, statement)) {
        if (!statement.wait) return null;
        const indexText = upgradeIndex === null ? '' : `[${String(upgradeIndex)}]`;
        yield { kind: 'blocked', line: statement.line, message: `${statement.kind}.${statement.upgrade}${indexText} 구매 대기` };
      }
      return null;
    }

    if (statement.type === 'Square') {
      const requestedTarget = statement.amount === null
        ? null
        : squarePointTarget(evaluate(statement.amount, context), statement.amount);
      const target = requestedTarget === null || typeof context.adapter.normalizeSquareTarget !== 'function'
        ? requestedTarget
        : context.adapter.normalizeSquareTarget(requestedTarget, statement);
      while (!context.adapter.square(statement, target)) {
        if (!statement.wait && target === null) return null;
        const targetText = target === null ? '' : ` ${String(target)}`;
        yield { kind: 'blocked', line: statement.line, message: `${targetText} SP 획득 대기`.trim() };
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
      for (let index = 0n; index < count; index++) {
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
