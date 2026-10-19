const knuthUpgradeUi = {};
const knuthBaseUpgradeUi = new Map();
const knuthBaseGroupUi = new Map();
let activeKnuthView = 'base';
let knuthUpgradeGroupsInitialized = false;
let knuthSlotDisplaySignature = '';

function renderKnuthBaseAutoControl(control, toggle, id) {
  control.classList.toggle('hidden', !knuthBaseAutomationUnlocked());
  const enabled = knuthBaseAutoEnabled[id] === true;
  toggle.classList.toggle('on', enabled);
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.disabled = !knuthBaseAutomationAvailable();
}

function renderKnuthBaseUpgrades() {
  if (!knuthBaseUpgradeGroups) return;
  if (knuthBaseUpgradeUi.size === 0) {
    for (const group of [1, 2, 3, 4, 5, 6]) {
      const section = document.createElement('section');
      section.className = 'knuth-base-group';
      const heading = document.createElement('h3');
      heading.className = 'knuth-base-group-heading';
      heading.textContent = `${group}그룹`;
      const status = document.createElement('div');
      status.className = 'knuth-base-group-status';
      const grid = document.createElement('div');
      grid.className = 'knuth-base-upgrade-grid';
      section.append(heading, status, grid);
      knuthBaseUpgradeGroups.append(section);
      knuthBaseGroupUi.set(group, status);
      for (const upgrade of KNUTH_BASE_UPGRADES.filter(item => item.group === group)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'knuth-upgrade';
        button.dataset.knuthBaseUpgrade = upgrade.id;
        const title = document.createElement('span');
        title.className = 'knuth-upgrade-title';
        title.textContent = upgrade.title;
        const description = document.createElement('span');
        description.className = 'knuth-upgrade-description';
        description.textContent = upgrade.description;
        const cost = document.createElement('span');
        cost.className = 'cost';
        button.append(title, description, cost);
        button.addEventListener('click', () => buyKnuthBaseUpgrade(upgrade.id));
        const purchase = document.createElement('div');
        purchase.className = 'knuth-base-purchase';
        const autoControl = document.createElement('div');
        autoControl.className = 'knuth-base-auto-control hidden';
        autoControl.title = `${upgrade.title} 자동구매`;
        const autoToggle = document.createElement('button');
        autoToggle.type = 'button';
        autoToggle.className = 'knuth-base-auto-toggle';
        autoToggle.textContent = '자동';
        autoToggle.setAttribute('aria-label', `${upgrade.title} 자동구매`);
        autoToggle.addEventListener('click', () => {
          if (!toggleKnuthBaseAutomation(upgrade.id)) render();
        });
        autoControl.append(autoToggle);
        purchase.append(button, autoControl);
        grid.append(purchase);
        knuthBaseUpgradeUi.set(upgrade.id, { button, cost, description, autoControl, autoToggle });
      }
    }
  }
  for (const [group, status] of knuthBaseGroupUi) {
    if (group >= 4 && !hasCompletedKnuthChallenge('kc5')) {
      status.textContent = 'KC5 완료 후 해금';
      continue;
    }
    const previous = KNUTH_BASE_UPGRADES.filter(upgrade => upgrade.group < group);
    const purchased = previous.filter(upgrade => knuthBaseUpgradeLevel(upgrade.id) > 0).length;
    status.textContent = knuthBaseGroupUnlocked(group)
      ? '해금됨'
      : `잠김 · 이전 그룹 전체 업그레이드 1회 구매 필요 (${purchased}/${previous.length})`;
  }
  for (const upgrade of KNUTH_BASE_UPGRADES) {
    const { button, cost, description, autoControl, autoToggle } = knuthBaseUpgradeUi.get(upgrade.id);
    renderKnuthBaseAutoControl(autoControl, autoToggle, upgrade.id);
    const firstGroupEffects = { cp_gain: 25, sp_gain: 10000, kp_gain: 5, diverger_gain: 2, dimension_gain: 4 };
    description.textContent = upgrade.group === 1 && hasAbstractionResearch('11-1')
      ? `구매마다 ${knuthBaseEffectPerPurchase(upgrade.id, firstGroupEffects[upgrade.id])}배 증가합니다. (11-1 적용)`
      : upgrade.description;
    if (upgrade.id === 'dyson_limit' && hasAbstractionResearch('17-3')) {
      description.textContent = '다이슨 스웜 구매 한도 +2. 추가 구매분의 다음 가격은 (직전 가격 ×20)^1.01로 증가합니다. (17-3 적용)';
    }
    if (upgrade.id === 'diverger_b_bonus') {
      description.textContent = `구매마다 b +${divergerBUpgradeGain()}. 현재 b 강화 1회분이며 CP 강화 횟수·가격은 유지됩니다.`;
    }
    if (upgrade.id === 'stagnant_mass_gain') {
      description.textContent += ` 현재 기여 배율 강화: ×${fmtPowerBase(stagnantMassBlackHoleMultiplier())}`;
    }
    if (isKnuthChallengeActive('kc5')) description.textContent += ' (KC5: 효과·구매 비활성)';
    const level = knuthBaseUpgradeLevel(upgrade.id);
    const complete = level >= knuthBaseUpgradeMax(upgrade);
    button.disabled = !canBuyKnuthBaseUpgrade(upgrade.id);
    button.classList.toggle('equipped', level > 0);
    button.classList.toggle('bought', complete);
    cost.textContent = complete ? '구매 완료'
      : `${level}회 구매 · 비용: ${fmtPowerBase(knuthBaseUpgradeCost(upgrade))} KP`;
  }
}

function knuthSlotTierLabel(slots) {
  return slots >= 5 ? '↑↑↑↑↑+' : '↑'.repeat(slots);
}

function knuthPreciseValueText(value) {
  return compareNumberValues(value, 1000) < 0
    ? Number(realNumberFromValue(value).toPrecision(3)).toString()
    : fmtPowerBase(value);
}

function createKnuthUpgradeButton(upgrade) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'knuth-upgrade';
  button.dataset.devUpgradeKind = 'knuth';
  button.dataset.devUpgradeId = upgrade.id;
  button.addEventListener('click', () => toggleKnuthUpgrade(upgrade.id));

  const title = document.createElement('span');
  title.className = 'knuth-upgrade-title';
  title.textContent = upgrade.title;
  const description = document.createElement('span');
  description.className = 'knuth-upgrade-description';
  description.textContent = upgrade.description;
  const cost = document.createElement('span');
  cost.className = 'cost';
  button.append(title, description, cost);

  const help = createFormulaHelpButton('knuth', upgrade.id);
  let card = button;
  if (help) {
    card = document.createElement('div');
    card.className = 'formula-help-card knuth-upgrade-card';
    card.append(button, help);
  }
  knuthUpgradeUi[upgrade.id] = { button, cost, card };
  return card;
}

function setKnuthView(view) {
  activeKnuthView = ['base', 'production', 'equipment', 'challenges', 'abstraction'].includes(view) ? view : 'base';
  const baseActive = activeKnuthView === 'base';
  const productionActive = activeKnuthView === 'production';
  const equipmentActive = activeKnuthView === 'equipment';
  const challengesActive = activeKnuthView === 'challenges';
  const abstractionActive = activeKnuthView === 'abstraction';
  knuthBaseUpgradeViewBtn.classList.toggle('active', baseActive);
  knuthProductionViewBtn.classList.toggle('active', productionActive);
  knuthEquipUpgradeViewBtn.classList.toggle('active', equipmentActive);
  knuthChallengeViewBtn.classList.toggle('active', challengesActive);
  knuthAbstractionViewBtn.classList.toggle('active', abstractionActive);
  knuthBaseUpgradeViewBtn.setAttribute('aria-selected', String(baseActive));
  knuthProductionViewBtn.setAttribute('aria-selected', String(productionActive));
  knuthEquipUpgradeViewBtn.setAttribute('aria-selected', String(equipmentActive));
  knuthChallengeViewBtn.setAttribute('aria-selected', String(challengesActive));
  knuthAbstractionViewBtn.setAttribute('aria-selected', String(abstractionActive));
  knuthBaseUpgradePanel.classList.toggle('hidden', !baseActive);
  knuthProductionPanel.classList.toggle('hidden', !productionActive);
  knuthEquipUpgradePanel.classList.toggle('hidden', !equipmentActive);
  knuthChallengePanel.classList.toggle('hidden', !challengesActive);
  abstractionPanel.classList.toggle('hidden', !abstractionActive);
  if (productionActive && typeof renderNumberBlackHoleBoard === 'function') {
    renderNumberBlackHoleBoard();
  }
  if (typeof render === 'function') render();
}

function renderKnuthSlotDisplay() {
  const capacity = knuthSlotCapacity();
  const used = knuthSlotsUsed();
  const signature = `${used}/${capacity}`;
  if (signature === knuthSlotDisplaySignature) return;
  knuthSlotDisplaySignature = signature;
  knuthSlotDisplay.replaceChildren();

  const label = document.createElement('span');
  label.className = 'knuth-slot-label';
  label.textContent = `↑ 슬롯 ${used} / ${capacity}`;
  knuthSlotDisplay.appendChild(label);

  if (capacity >= 20) {
    const bar = document.createElement('span');
    bar.className = 'knuth-slot-bar';
    bar.setAttribute('role', 'meter');
    bar.setAttribute('aria-label', '커누스 슬롯 사용량');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(capacity));
    bar.setAttribute('aria-valuenow', String(Math.min(used, capacity)));
    bar.setAttribute('aria-valuetext', `${used} / ${capacity} 슬롯 사용`);
    bar.title = `${used} / ${capacity} 슬롯 사용`;
    const fill = document.createElement('span');
    fill.className = 'knuth-slot-bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, used / capacity * 100))}%`;
    bar.appendChild(fill);
    knuthSlotDisplay.appendChild(bar);
    return;
  }

  const arrows = document.createElement('span');
  arrows.className = 'knuth-slot-arrows';
  for (let index = 0; index < capacity; index++) {
    const arrow = document.createElement('span');
    arrow.className = `knuth-slot-arrow${index < used ? ' active' : ''}`;
    arrow.textContent = '↑';
    arrows.appendChild(arrow);
  }
  knuthSlotDisplay.appendChild(arrows);
}

function renderKnuthUpgradeGroups() {
  if (!knuthUpgradeGroupsInitialized) {
    const fragment = document.createDocumentFragment();
    for (let slots = 1; slots <= 5; slots++) {
      const group = document.createElement('section');
      group.className = 'knuth-upgrade-group';
      const title = document.createElement('div');
      title.className = 'knuth-upgrade-group-title';
      title.textContent = knuthSlotTierLabel(slots);
      group.appendChild(title);

      const list = document.createElement('div');
      list.className = 'knuth-upgrade-list';
      const upgrades = KNUTH_SLOT_UPGRADES.filter(upgrade => slots === 5 ? upgrade.slots >= 5 : upgrade.slots === slots);
      if (upgrades.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'knuth-upgrade-empty';
        empty.textContent = '추가 강화 예정';
        list.appendChild(empty);
      } else {
        for (const upgrade of upgrades) list.appendChild(createKnuthUpgradeButton(upgrade));
      }
      group.appendChild(list);
      fragment.appendChild(group);
    }
    knuthUpgradeGroups.replaceChildren(fragment);
    knuthUpgradeGroupsInitialized = true;
  }

  for (const upgrade of KNUTH_SLOT_UPGRADES) {
    const ui = knuthUpgradeUi[upgrade.id];
    if (!ui) continue;
    const equipped = hasKnuthUpgrade(upgrade.id);
    const canEquip = knuthSlotsUsed() + upgrade.slots <= knuthSlotCapacity();
    const devConsoleOpen = document.body.classList.contains('dev-console-open')
      || (typeof devConsoleIsOpen === 'function' && devConsoleIsOpen());
    ui.button.classList.toggle('equipped', equipped);
    let progress = '';
    if (equipped && upgrade.id === 'knuth_time_gain') {
      const effectiveTime = abstractionEffectiveTime();
      const multiplier = addBaseNumbers(1, NumberMath.power(effectiveTime, 0.5));
      progress = ` · 제곱 시간 T ${knuthPreciseValueText(squareRunGameSeconds)}초${hasAbstractionResearch('4-1') ? ` → T^1.5=${knuthPreciseValueText(effectiveTime)}` : ''} · SP/CP ×${knuthPreciseValueText(multiplier)}`;
    } else if (equipped && upgrade.id === 'diverger_percent_price_delay') {
      const shift = divergerPercentPriceShiftAmount();
      progress = ` · 발산력 ${knuthPreciseValueText(divergerPower)} · 급증 지연 ${divergerPercentPriceShiftMilestones()}단계 (+${knuthPreciseValueText(shift)} 레벨)`;
    } else if (equipped && upgrade.id === 'percent_overflow') {
      const multiplier = knuthPercentOverflowMultiplier();
      progress = ` · O ${knuthPreciseValueText(knuthPercentOverflow)} · SP/CP ×${knuthPreciseValueText(multiplier)}`;
    } else if (equipped && upgrade.id === 'percent_gain_square') {
      progress = ` · 최종 퍼센트 생산 ^${percentProductionExponent()}`;
    } else if (equipped && upgrade.id === 'dyson_diverger') {
      progress = ` · 다이슨 ${effectiveDysonSwarmLevel()}기 · 발산력 ${knuthPreciseValueText(divergerPower)}`;
    } else if (equipped && upgrade.id === 'percent_softcap_square') {
      progress = ' · 최종 소프트캡 ^2';
    } else if (equipped && upgrade.id === 'accumulated_time_sp') {
      progress = ` · 누적 ${knuthPreciseValueText(numberBlackHoleAccumulatedGameSeconds)}초 · SP ×${knuthPreciseValueText(knuthAccumulatedTimeSpMultiplier())}`;
    } else if (equipped && upgrade.id === 'group_percent_growth') {
      progress = ` · 1그룹 구매 ${knuthPreciseValueText(knuthFirstGroupPurchaseCount())}회 · 획득/캡 ×${knuthPreciseValueText(knuthGroupPercentMultiplier())}`;
    } else if (equipped && upgrade.id === 'research_resource_growth') {
      progress = ` · 연구 ${knuthPurchasedAbstractionCount()}개 · SP/CP ×${knuthPreciseValueText(knuthResearchResourceMultiplier())}`;
    } else if (equipped && upgrade.id === 'diverger_black_hole') {
      progress = ` · 발산력 ${knuthPreciseValueText(divergerPower)} · 블랙홀 가속 ×${knuthPreciseValueText(knuthDivergerBlackHoleMultiplier())}`;
    } else if (equipped && upgrade.id === 'achievement_percent_growth') {
      progress = ` · 업적 ${knuthAchievementCount()}개 · 획득/캡 ×${knuthPreciseValueText(knuthAchievementPercentMultiplier())}`;
    } else if (equipped && upgrade.id === 'second_branch_expansion') {
      progress = ' · 두 번째 분기 2개 선택 가능';
    }
    const slotsText = upgrade.slots >= 5 ? `${upgrade.slots}연산` : knuthSlotTierLabel(upgrade.slots);
    ui.cost.textContent = `${slotsText} · ${equipped ? (hasCompletedKnuthChallenge('kc1') ? '클릭해서 해제' : '장착 완료') : '클릭해서 장착'}${progress}`;
    ui.button.disabled = !devConsoleOpen && (equipped ? !hasCompletedKnuthChallenge('kc1') : !canEquip);
  }
}

function renderKnuthChallengeCard(id, card, status, progress, button) {
  const challenge = knuthChallenge(id);
  const active = isKnuthChallengeActive(id);
  const completed = hasCompletedKnuthChallenge(id);
  const current = challenge.goalResource === 'cp' ? squareConvergencePoints : squarePoints;
  const currency = challenge.goalResource.toUpperCase();
  const devConsoleOpen = document.body.classList.contains('dev-console-open')
    || (typeof devConsoleIsOpen === 'function' && devConsoleIsOpen());

  card.classList.toggle('active', active);
  card.classList.toggle('completed', completed);
  status.textContent = completed ? '완료' : active ? '도전 중' : '미완료';

  if (completed) {
    progress.textContent = `보상 적용: ${challenge.reward}`;
  } else if (active && canCompleteKnuthChallenge()) {
    progress.textContent = '목표 달성 · 수동 교환 영역의 도전 완료 버튼을 누르세요.';
  } else if (active) {
    progress.textContent = `진행: ${fmtPowerBase(current)} / ${fmtPowerBase(challenge.goal)} ${currency}`;
  } else if (!hasClaimedKnuthPoint) {
    progress.textContent = '첫 번째 KP를 획득한 뒤 도전할 수 있습니다.';
  } else {
    progress.textContent = '도전을 시작하면 현재 커누스 진행 상황이 초기화됩니다.';
  }
  if (active && id === 'kc4') {
    const multiplier = kc4TimeMultiplier();
    progress.textContent += ` · 수렴 후 현실 ${kc4ElapsedRealSeconds.toFixed(2)}초 · 시간 ×${multiplier.toPrecision(3)} · 반감기 ${KC4_TIME_BALANCE.halfLifeSeconds}초`;
  }

  button.textContent = completed ? '완료' : active ? '도전 포기' : '도전 시작';
  button.dataset.devChallengeId = id;
  button.disabled = !devConsoleOpen
    && (!hasClaimedKnuthPoint || completed || Boolean(activeKnuthChallengeId && !active));
}

function renderKnuthChallenges() {
  renderKnuthChallengeCard('kc1', knuthChallengeKc1, knuthChallengeKc1Status, knuthChallengeKc1Progress, knuthChallengeKc1Btn);
  renderKnuthChallengeCard('kc2', knuthChallengeKc2, knuthChallengeKc2Status, knuthChallengeKc2Progress, knuthChallengeKc2Btn);
  renderKnuthChallengeCard('kc3', knuthChallengeKc3, knuthChallengeKc3Status, knuthChallengeKc3Progress, knuthChallengeKc3Btn);
  renderKnuthChallengeCard('kc4', knuthChallengeKc4, knuthChallengeKc4Status, knuthChallengeKc4Progress, knuthChallengeKc4Btn);
  renderKnuthChallengeCard('kc5', knuthChallengeKc5, knuthChallengeKc5Status, knuthChallengeKc5Progress, knuthChallengeKc5Btn);
}

function renderKnuthBoard() {
  if (
    !knuthSlotDisplay ||
    !knuthBaseUpgradeViewBtn ||
    !knuthProductionViewBtn ||
    !knuthEquipUpgradeViewBtn ||
    !knuthChallengeViewBtn ||
    !knuthAbstractionViewBtn ||
    !knuthBaseUpgradePanel ||
    !knuthProductionPanel ||
    !knuthEquipUpgradePanel ||
    !knuthChallengePanel ||
    !abstractionPanel ||
    !knuthChallengeKc1 ||
    !knuthChallengeKc1Status ||
    !knuthChallengeKc1Progress ||
    !knuthChallengeKc1Btn ||
    !knuthChallengeKc2 ||
    !knuthChallengeKc2Status ||
    !knuthChallengeKc2Progress ||
    !knuthChallengeKc2Btn ||
    !knuthChallengeKc3 ||
    !knuthChallengeKc3Status ||
    !knuthChallengeKc3Progress ||
    !knuthChallengeKc3Btn ||
    !knuthResetEquipmentToggle ||
    !knuthOperationUpgradeBtn ||
    !knuthOperationUpgradeCostText ||
    !knuthUpgradeGroups ||
    typeof knuthOperationUpgradeCost !== 'function' ||
    typeof knuthSlotCapacity !== 'function' ||
    typeof knuthSlotsUsed !== 'function' ||
    typeof KNUTH_SLOT_UPGRADES === 'undefined'
  ) return;
  const cost = knuthOperationUpgradeCost();
  const slotsGained = knuthSlotCapacity(knuthOperationLevel + 1) - knuthSlotCapacity();
  knuthOperationUpgradeCostText.textContent = knuthOperationLevel >= KNUTH_OPERATION_MAX_LEVEL
    ? `최대 강화 (${knuthOperationLevel}/${KNUTH_OPERATION_MAX_LEVEL}회)`
    : `비용: ${fmtPowerBase(cost)} KP · 슬롯 +${slotsGained}`;
  knuthOperationUpgradeBtn.disabled = !canBuyKnuthOperationUpgrade();
  renderKnuthBaseAutoControl(knuthOperationAutoControl, knuthOperationAutoToggle, 'operation');
  const resetOnNextPrestige = knuthResetEquipmentOnNextPrestige === true;
  knuthResetEquipmentToggle.classList.toggle('toggle-active', resetOnNextPrestige);
  knuthResetEquipmentToggle.classList.toggle('toggle-inactive', !resetOnNextPrestige);
  knuthResetEquipmentToggle.setAttribute('aria-pressed', String(resetOnNextPrestige));
  knuthResetEquipmentToggle.textContent = `다음 커누스 때 장착 초기화: ${resetOnNextPrestige ? 'ON' : 'OFF'}`;
  renderKnuthSlotDisplay();
  renderKnuthBaseUpgrades();
  renderKnuthUpgradeGroups();
  renderKnuthChallenges();
  if (activeKnuthView === 'production') renderNumberBlackHoleBoard();
  if (activeKnuthView === 'abstraction') renderAbstractionBoard();
}

knuthOperationUpgradeBtn.addEventListener('click', buyKnuthOperationUpgrade);
knuthOperationAutoToggle.addEventListener('click', () => {
  if (!toggleKnuthBaseAutomation('operation')) render();
});
knuthBaseUpgradeViewBtn.addEventListener('click', () => setKnuthView('base'));
knuthProductionViewBtn.addEventListener('click', () => setKnuthView('production'));
knuthEquipUpgradeViewBtn.addEventListener('click', () => setKnuthView('equipment'));
knuthChallengeViewBtn.addEventListener('click', () => setKnuthView('challenges'));
knuthAbstractionViewBtn.addEventListener('click', () => setKnuthView('abstraction'));
knuthResetEquipmentToggle.addEventListener('click', toggleKnuthEquipmentReset);
knuthChallengeKc1Btn.addEventListener('click', () => {
  if (isKnuthChallengeActive('kc1')) abandonKnuthChallenge();
  else startKnuthChallenge('kc1');
});
knuthChallengeKc2Btn.addEventListener('click', () => {
  if (isKnuthChallengeActive('kc2')) abandonKnuthChallenge();
  else startKnuthChallenge('kc2');
});
knuthChallengeKc3Btn.addEventListener('click', () => {
  if (isKnuthChallengeActive('kc3')) abandonKnuthChallenge();
  else startKnuthChallenge('kc3');
});
knuthChallengeKc4Btn.addEventListener('click', () => {
  if (isKnuthChallengeActive('kc4')) abandonKnuthChallenge();
  else startKnuthChallenge('kc4');
});
knuthChallengeKc5Btn.addEventListener('click', () => {
  if (isKnuthChallengeActive('kc5')) abandonKnuthChallenge();
  else startKnuthChallenge('kc5');
});
setKnuthView(activeKnuthView);

let squareRunLastTickAt = gameTimelineNowMs();
let squareRunLastRenderAt = squareRunLastTickAt;
setGameInterval(() => {
  const { now, elapsedMs } = elapsedRealTimeSince(squareRunLastTickAt);
  squareRunLastTickAt = now;
  syncKc4RealTime();
  const runTimeAdvanced = advanceSquareRunTime(elapsedMs);
  const squarePrestigeTimeAdvanced = advanceSquarePrestigeCycleTime(elapsedMs);
  if (advanceKnuthBaseAutomation(elapsedMs)) render();
  if (!runTimeAdvanced && !squarePrestigeTimeAdvanced && !isKnuthChallengeActive('kc4')) return;
  if (
    now - squareRunLastRenderAt >= 1000
    && (
      hasKnuthUpgrade('knuth_time_gain')
      || hasKnuthUpgrade('percent_time_discount')
      || isKnuthChallengeActive('kc4')
    )
  ) {
    squareRunLastRenderAt = now;
    render();
  }
}, 100);
