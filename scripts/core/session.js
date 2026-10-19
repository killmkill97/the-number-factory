// Session clocks are separate from the physical clock used for CPU budgets.
window.numberTycoonSession = (() => {
  const preferencesKey = 'numberTycoonSessionPreferences_v1';
  const offlineKey = 'numberTycoonOfflineCheckpoint_v1';
  const intervals = [];
  const physicalNow = () => typeof performance === 'undefined' ? Date.now() : performance.now();
  let phase = 'booting';
  let offset = 0;
  let virtualTime = physicalNow();
  let virtualUtc = Date.now();
  let checkpoint = null;
  let restored = false;
  let initialized = false;
  let armed = false;
  let mustSave = false;
  let savedBaseline = null;
  let renderRequested = false;
  let lastMaintenance = -Infinity;
  let autoLoad = true;
  let offlineAccuracy = 100;
  let screen, status, resumeButton, progress, autoLoadInput, offlineButton, accuracyRange, accuracyInput;
  const normalizeAccuracy = (value, fallback) => {
    const numeric = typeof value === 'string' && !value.trim() ? NaN : Number(value);
    return Number.isFinite(numeric) ? Math.max(1, Math.min(1000, Math.round(numeric))) : fallback;
  };
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) || '{}');
    autoLoad = saved?.autoLoad !== false;
    if (saved?.offlineAccuracy != null) offlineAccuracy = normalizeAccuracy(saved.offlineAccuracy, 100);
  } catch { /* Missing or damaged preferences use the default. */ }

  const paused = () => phase !== 'online';
  const timelineNow = () => paused() ? virtualTime : physicalNow() + offset;
  const utcNow = () => paused() ? virtualUtc : Date.now();
  const capture = () => JSON.parse(JSON.stringify(captureGameSaveData()));
  const fingerprint = () => JSON.stringify(captureGameSaveData());

  function register(callback, period) {
    const record = { callback, period, next: timelineNow() + period };
    intervals.push(record);
    return setInterval(() => {
      if (paused()) return;
      record.next = timelineNow() + period;
      callback();
    }, period);
  }

  function display(message = '') {
    if (!screen) return;
    document.body.classList.toggle('session-offline', paused() && phase !== 'booting');
    screen.hidden = !paused() || phase === 'booting';
    if (status) status.textContent = message || (checkpoint
      ? `시작: ${new Date(checkpoint.startedAtUtcMs).toISOString().replace('T', ' ').replace('Z', ' UTC')}` : '');
    if (resumeButton) resumeButton.disabled = phase === 'processing';
    if (progress) progress.hidden = phase !== 'processing';
  }

  function enter() {
    if (phase !== 'online') return false;
    syncKc4RealTime();
    const startedAtUtcMs = Date.now();
    const startedAtTimelineMs = timelineNow();
    const next = {
      version: 1, startedAtUtcMs, game: capture(),
      programs: typeof captureAutomatiumOfflinePrograms === 'function' ? captureAutomatiumOfflinePrograms() : null
    };
    try {
      // Do not hide the game until its recovery copy has actually been written.
      localStorage.setItem(offlineKey, JSON.stringify(next));
    } catch (error) {
      console.error(error);
      if (status) status.textContent = '복구 데이터를 저장하지 못했습니다.';
      window.alert?.('오프라인 복구 데이터를 저장하지 못해 모드를 시작하지 않았습니다.');
      return false;
    }
    virtualTime = startedAtTimelineMs;
    for (const record of intervals) {
      if (record.next < virtualTime) record.next = virtualTime + record.period;
    }
    virtualUtc = startedAtUtcMs;
    checkpoint = next;
    restored = true;
    phase = 'offline';
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    display();
    resumeButton?.focus();
    return true;
  }

  function restore() {
    if (restored) return true;
    // Restore at the checkpoint's UTC instant; the elapsed time is simulated later.
    virtualUtc = checkpoint.startedAtUtcMs;
    if (!loadGame(JSON.stringify(checkpoint.game), {
      countAsLoad: false, persistOverride: false, offlineRecovery: true
    })) return false;
    if (typeof restoreAutomatiumOfflinePrograms === 'function') restoreAutomatiumOfflinePrograms(checkpoint.programs);
    restored = true;
    return true;
  }

  function prepareOfflineSummary(before, duration) {
    const list = document.getElementById('offlineSummaryChanges');
    const after = captureGameSaveData();
    const rows = [];
    for (const [key, label] of [
      ['num', '숫자'], ['squarePoints', 'SP'], ['squareConvergencePoints', 'CP'],
      ['knuthPoints', 'KP'], ['theory', '이론'], ['greatTheory', '대이론'],
      ['singularityPoints', '특이점'], ['divergerPower', '발산력']
    ]) {
      const initial = numberValueFromSave(before[key]);
      const final = numberValueFromSave(after[key]);
      const comparison = compareNumberValues(final, initial);
      if (comparison === 0) continue;
      const row = document.createElement('div');
      row.className = 'offline-summary-row';
      const name = document.createElement('dt');
      name.textContent = `${label}:`;
      const values = document.createElement('dd');
      const format = value => {
        const text = fmtPowerBase(value);
        return text === '0' && compareNumberValues(value, 0) !== 0 ? fmtScientific(value) : text;
      };
      values.textContent = `${format(initial)} → ${format(final)}`;
      values.className = comparison > 0 ? 'increased' : 'decreased';
      row.appendChild(name);
      row.appendChild(values);
      rows.push(row);
    }
    list?.replaceChildren(...rows);
    const empty = document.getElementById('offlineSummaryEmpty');
    if (empty) empty.hidden = rows.length > 0;
    const elapsed = document.getElementById('offlineSummaryElapsed');
    if (elapsed) elapsed.textContent = `${fmtPowerBase(duration / 1000)}초 · 정확도 ${offlineAccuracy}`;
  }

  function showOfflineSummary() {
    const dialog = document.getElementById('offlineSummaryDialog');
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  async function leave() {
    if (phase !== 'offline' || !checkpoint) return false;
    if (!restore()) { display('복구 데이터를 불러오지 못했습니다.'); return false; }
    const from = virtualTime;
    const startedAt = checkpoint.startedAtUtcMs;
    const duration = Math.max(0, Date.now() - startedAt);
    const target = from + duration;
    // Coarse replay samples the whole duration, not only its first few ticks.
    // At 1000 retain the original event-by-event scheduler without rounding.
    const sampleMs = offlineAccuracy === 1000 ? 0 : Math.max(10, duration / (offlineAccuracy * 10));
    phase = 'processing';
    display('오프라인 틱 계산 중');
    try {
      while (true) {
        const budgetStart = physicalNow();
        let operations = 0;
        while (operations < 1000 && physicalNow() - budgetStart < 8) {
          let next = null;
          for (const record of intervals) {
            if (record.next <= target && (!next || record.next < next.next)) next = record;
          }
          if (!next) break;
          const dueAt = sampleMs ? Math.min(target, from + Math.ceil((next.next - from) / sampleMs) * sampleMs) : next.next;
          virtualTime = Math.max(virtualTime, dueAt);
          virtualUtc = startedAt + (virtualTime - from);
          // Each timer runs once per sample; elapsed-time production handles the
          // combined duration. Keep the unconsumed remainder for online play.
          next.next += (sampleMs ? Math.floor(Math.max(0, virtualTime - next.next) / next.period) + 1 : 1) * next.period;
          next.callback();
          operations++;
          if (renderRequested && virtualTime - lastMaintenance >= 16) {
            renderRequested = false;
            lastMaintenance = virtualTime;
            if (typeof updateGameRenderState === 'function') updateGameRenderState();
            else if (typeof updateAchievements === 'function') updateAchievements();
          }
        }
        if (progress) progress.value = duration > 0 ? Math.min(1, (virtualTime - from) / duration) : 1;
        if (!intervals.some(record => record.next <= target)) break;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      virtualTime = target;
      virtualUtc = startedAt + duration;
      // Freeze the comparison before resuming live timers or discarding recovery.
      prepareOfflineSummary(checkpoint.game, duration);
      // Removing the recovery copy is the commit; failures keep the game paused.
      localStorage.removeItem(offlineKey);
      offset = virtualTime - physicalNow();
      checkpoint = null;
      restored = false;
      phase = 'online';
      renderRequested = false;
      display();
      render();
      offlineButton?.focus();
      showOfflineSummary();
      return true;
    } catch (error) {
      console.error(error);
      phase = 'error';
      display('계산을 완료하지 못했습니다. 새로고침하면 원래 복구본으로 다시 시작합니다.');
      if (resumeButton) resumeButton.disabled = true;
      return false;
    }
  }

  function noteLoad() { armed = true; mustSave = true; }
  function noteSave() { mustSave = false; savedBaseline = fingerprint(); }
  function syncAccuracyInputs() {
    if (accuracyRange) accuracyRange.value = String(offlineAccuracy);
    if (accuracyInput) accuracyInput.value = String(offlineAccuracy);
  }
  function changeAccuracy(value) {
    const selected = normalizeAccuracy(value, offlineAccuracy);
    try {
      localStorage.setItem(preferencesKey, JSON.stringify({ autoLoad, offlineAccuracy: selected }));
      offlineAccuracy = selected;
    } catch {
      window.alert?.('오프라인 정확도 설정을 저장하지 못했습니다.');
    }
    syncAccuracyInputs();
  }
  function shouldWarnBeforeExit() {
    if (!armed) return false;
    if (mustSave) return true;
    try { return savedBaseline !== fingerprint(); } catch { return true; }
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    screen = document.getElementById('offlineModeScreen');
    status = document.getElementById('offlineModeStatus');
    resumeButton = document.getElementById('offlineModeExitBtn');
    progress = document.getElementById('offlineModeProgress');
    autoLoadInput = document.getElementById('autoLoadSaveToggle');
    offlineButton = document.getElementById('offlineModeEnterBtn');
    accuracyRange = document.getElementById('offlineAccuracyRange');
    accuracyInput = document.getElementById('offlineAccuracyInput');
    syncAccuracyInputs();
    accuracyRange?.addEventListener('input', () => changeAccuracy(accuracyRange.value));
    accuracyInput?.addEventListener('change', () => changeAccuracy(accuracyInput.value));
    accuracyInput?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      changeAccuracy(accuracyInput.value);
    });
    if (autoLoadInput) {
      autoLoadInput.checked = autoLoad;
      autoLoadInput.addEventListener('change', () => {
        const selected = autoLoadInput.checked;
        try {
          localStorage.setItem(preferencesKey, JSON.stringify({ autoLoad: selected, offlineAccuracy }));
          autoLoad = selected;
        } catch {
          autoLoadInput.checked = autoLoad;
          window.alert?.('자동 불러오기 설정을 저장하지 못했습니다.');
        }
      });
    }
    offlineButton?.addEventListener('click', enter);
    resumeButton?.addEventListener('click', leave);
    const summaryDialog = document.getElementById('offlineSummaryDialog');
    document.getElementById('offlineSummaryCloseBtn')?.addEventListener('click', () => summaryDialog?.close());
    summaryDialog?.addEventListener('click', event => {
      if (event.target === summaryDialog) summaryDialog.close();
    });
    try {
      const saved = JSON.parse(localStorage.getItem(offlineKey) || 'null');
      if (saved?.version === 1 && Number.isSafeInteger(saved.startedAtUtcMs) && saved.startedAtUtcMs >= 0
        && saved.game && typeof saved.game === 'object' && !Array.isArray(saved.game)) checkpoint = saved;
    } catch { /* An unreadable recovery copy never replaces the normal save. */ }
    if (checkpoint) {
      phase = 'offline';
      virtualUtc = checkpoint.startedAtUtcMs;
      if (autoLoad && !restore()) display('복구 데이터를 불러오지 못했습니다.');
      else display();
    } else {
      offset = virtualTime - physicalNow();
      phase = 'online';
      try {
        if (autoLoad && localStorage.getItem(SAVE_KEY)) loadGame(null, { countAsLoad: false });
      } catch (error) { console.error(error); }
      display();
    }
  }

  window.addEventListener('beforeunload', event => {
    if (!shouldWarnBeforeExit()) return;
    event.preventDefault();
    event.returnValue = '';
  });
  window.addEventListener('keydown', event => {
    if (!paused() || phase === 'booting' || screen?.contains(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  return {
    register, initialize, enter, leave, noteLoad, noteSave, shouldWarnBeforeExit,
    timelineNow, utcNow, isPaused: paused,
    requestMaintenance() { renderRequested = true; },
    get autoLoadEnabled() { return autoLoad; },
    get offlineAccuracy() { return offlineAccuracy; },
    get phase() { return phase; }
  };
})();
