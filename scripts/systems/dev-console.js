const devConsole = {
  form: null,
  input: null,
  visible: false
};

function parseDevBigInt(rawValue) {
  const text = String(rawValue ?? '').trim().replace(/[,_\s]/g, '');
  if (!text) {
    throw new Error('값을 입력하세요.');
  }

  if (/^\+?\d+$/.test(text)) {
    return BigInt(text.replace(/^\+/, ''));
  }

  const scientific = text.match(/^\+?(\d+)(?:\.(\d+))?[eE]\+?(\d+)$/);
  if (!scientific) {
    throw new Error('숫자는 123, 1e200, 1.2e42 형식으로 입력하세요.');
  }

  const whole = scientific[1];
  const fraction = scientific[2] ?? '';
  const exponent = Number(scientific[3]);
  if (!Number.isSafeInteger(exponent)) {
    throw new Error('지수가 너무 큽니다.');
  }
  if (exponent < fraction.length) {
    throw new Error('정수가 되는 과학적 표기법만 사용할 수 있습니다.');
  }

  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '');
  return BigInt(digits || '0') * (10n ** BigInt(exponent - fraction.length));
}

function formatDevValue(value) {
  return value.toString().length > 24 ? fmtPowerBase(value) : fmt(value);
}

function clearOverflowForDevCommand() {
  overflowed = false;
  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');
  addBtn.disabled = false;
}

function showTetrationForDevCommand() {
  squareUnlocked = true;
  tetrationUnlocked = true;
  setChapter('tetration');
}

function runDevCommand(commandText) {
  const command = commandText.trim();
  if (!command) return;

  const match = command.match(/^set\s+(number|sp|cp|lsp|tetrap)\s+(.+)$/i);
  if (!match) {
    throw new Error('지원 명령어: set number <숫자>, set sp <숫자>, set cp <숫자>, set lsp <숫자>, set tetraP <숫자>');
  }

  const target = match[1].toLowerCase();
  const value = parseDevBigInt(match[2]);

  if (target === 'number') {
    clearOverflowForDevCommand();
    num = value;
    maybeUnlockPercent();
    checkOverflow();
    render();
    log(`[DEV] number = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'sp') {
    squarePoints = value;
    if (value > 0n) {
      squareUnlocked = true;
      setChapter('square');
    }
    render();
    log(`[DEV] SP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'cp') {
    squareConvergencePoints = value;
    if (value > 0n) {
      squareUnlocked = true;
      squareConvergenceUnlocked = true;
      setChapter('square-convergence');
    }
    render();
    log(`[DEV] CP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'lsp') {
    lsp = value;
    showTetrationForDevCommand();
    render();
    log(`[DEV] LSP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'tetrap') {
    tetraP = value;
    showTetrationForDevCommand();
    render();
    log(`[DEV] tetraP = ${formatDevValue(value)}`, true);
    return;
  }
}

function ensureDevConsoleUi() {
  if (devConsole.form) return;

  const form = document.createElement('form');
  form.className = 'dev-console hidden';

  const prompt = document.createElement('span');
  prompt.className = 'dev-console-prompt';
  prompt.textContent = '>';

  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'set cp 10';
  input.setAttribute('aria-label', '개발자 명령어');

  form.append(prompt, input);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      runDevCommand(input.value);
      input.value = '';
    } catch (error) {
      log(`[DEV] ${error.message}`, true);
    }
    input.focus();
  });

  logEl.appendChild(form);
  devConsole.form = form;
  devConsole.input = input;
}

function toggleDevConsole() {
  ensureDevConsoleUi();
  devConsole.visible = !devConsole.visible;
  devConsole.form.classList.toggle('hidden', !devConsole.visible);

  if (devConsole.visible) {
    devConsole.input.focus();
    logEl.scrollTop = logEl.scrollHeight;
    log('[DEV] 콘솔 열림: set number <숫자>, set sp <숫자>, set cp <숫자>, set lsp <숫자>, set tetraP <숫자>', true);
  }
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !event.shiftKey) return;
  if (document.body.classList.contains('automatium-open')) return;
  event.preventDefault();
  toggleDevConsole();
});
