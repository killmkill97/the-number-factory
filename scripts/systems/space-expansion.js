let spaceExpansionLastTickAt = gameTimelineNowMs();
const spaceExpansionUpgradeControls = SPACE_EXPANSION_UPGRADES.map(upgrade => {
  const suffix = upgrade.id.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('');
  const prefix = `spaceExpansion${suffix}Upgrade`;
  return { ...upgrade, button: document.getElementById(`${prefix}Btn`),
    label: document.getElementById(`${prefix}Label`), cost: document.getElementById(`${prefix}Cost`) };
});
const spaceExpansionOneTimeControls = SPACE_EXPANSION_ONE_TIME_UPGRADES.map(upgrade => {
  const button = document.createElement('button');
  button.type = 'button';button.className = 'knuth-upgrade';
  button.dataset.spaceExpansionUpgrade = upgrade.id;
  const label = document.createElement('span');label.className = 'knuth-upgrade-title';label.textContent = upgrade.title;
  const description = document.createElement('span');description.className = 'knuth-upgrade-description';description.textContent = upgrade.description;
  const info = document.createElement('span');info.className = 'cost';
  button.append(label, description, info);
  button.addEventListener('click', () => { if (buySpaceExpansionOneTimeUpgrade(upgrade.id)) renderSpaceExpansionBoard(); });
  const card = document.createElement('div');card.className = 'formula-help-card knuth-upgrade-card';
  card.appendChild(button);ensureFormulaHelpButton(card, 'space-expansion', upgrade.id);
  document.getElementById('spaceExpansionExtraUpgradeList').appendChild(card);
  return { ...upgrade, button, info };
});

function spaceExpansionOneTimeEffectText(id) {
  if (!hasSpaceExpansionOneTimeUpgrade(id)) return '';
  if (id === 'penalty_relief') return `압축 지수 ${spaceExpansionPenaltyPower()} · SP 로그 ^${SPACE_EXPANSION_EXTRA_BALANCE.spLogPower}`;
  if (id === 'mass_percent') return `퍼센트 획득 ×${fmtPowerBase(spaceExpansionMassPercentMultiplier())}`;
  if (id === 'n_automation') return 'N 시작·종료·상태 조회 해금';
  if (id === 'higgs_slots') return `추가 슬롯 +${fmtPowerBase(spaceExpansionHiggsSlotBonus())}`;
  if (id === 'overfeed') return hasAbstractionResearch('25-2')
    ? `투여 상한 ${fmtPowerBase(numberBlackHoleDonationPercentLimit())}%`
    : '25-2 연구 필요 · 효과 비활성';
  if (id === 'group_boost') return `구매당 배율·추가 개수 ×${fmtPowerBase(spaceExpansionGroupMultiplier())}`;
  return '구매 기록 보존';
}

function resetSpaceExpansionClock() {
  spaceExpansionLastTickAt = gameTimelineNowMs();
}

function formatStagnantMass(milligrams) {
  const units = [[1.98847e36, 'M⊙'], [5.9722e30, 'M⊕'], [1e9, 't'], [1e6, 'kg'], [1000, 'g'], [1, 'mg']];
  const [scale, unit] = units.find(([threshold]) => compareNumberValues(milligrams, threshold) >= 0) || units[5];
  const value = NumberMath.divideApproximate(milligrams, scale);
  const formatted = compareNumberValues(value, 1000) < 0
    ? Number(realNumberFromValue(value).toPrecision(4)).toString() : fmtPowerBase(value);
  return `${formatted} ${unit}`;
}

function renderSpaceExpansionBoard() {
  const active = spaceExpansionActive;
  const blocked = Boolean(activeKnuthChallengeId) || pendingKnuthPointClaim;
  const reward = spaceExpansionHiggsReward();
  const status = document.getElementById('spaceExpansionStatus');
  const penaltyPower = spaceExpansionPenaltyPower();
  status.textContent = active ? `공간 팽창 중 · 배율의 지수의 지수 ×${penaltyPower}` : '비활성';
  status.classList.toggle('active', active);
  const button = document.getElementById('spaceExpansionToggleBtn');
  button.textContent = active ? '공간 팽창 종료' : '공간 팽창 시작';
  button.classList.toggle('active', active);
  button.disabled = !spaceExpansionUnlocked() || blocked;
  button.setAttribute('aria-pressed', String(active));
  const kp = canManuallyExchangeKnuthPoints() ? knuthPointGain() : 0;
  document.getElementById('spaceExpansionRewardPreview').textContent = blocked
    ? '도전 또는 첫 KP 수령 중에는 시작할 수 없습니다.'
    : `${active ? '종료' : '시작'} 시 ${isPositiveNumberValue(kp) ? `${fmtPowerBase(kp)} KP를 받고 ` : 'KP 보상 없이 '}새 커누스를 시작합니다.`;
  document.getElementById('higgsParticleValue').textContent = fmtPowerBase(higgsParticles);
  document.getElementById('spaceExpansionHiggsPreview').textContent = active
    ? `${fmtPowerBase(reward)} → 보유 ${fmtPowerBase(spaceExpansionHiggsAfterExit(reward))}` : '공간 팽창 시작 후 계산';
  document.getElementById('spaceExpansionRewardRule').textContent =
    '종료할 때 보유 CP로 힉스입자 최고기록을 갱신합니다. 힉스입자는 합산하지 않으며, 1개당 기본 현실 초당 1mg의 정체된 질량(SM)을 생산합니다.';
  document.getElementById('spaceExpansionPenaltyRule').textContent = `공간 팽창 중 생산·교환 배율의 지수의 지수가 ${penaltyPower}배가 됩니다. SP 최종 획득량은 `
    + (hasSpaceExpansionOneTimeUpgrade('penalty_relief') ? `max(1, log10(G)^${SPACE_EXPANSION_EXTRA_BALANCE.spLogPower})` : 'max(1, log10(G))')
    + '로 압축합니다. 소프트캡 확장, 블랙홀 반지름과 시간 가속 배율은 유지됩니다.';
  document.getElementById('stagnantMassValue').textContent = formatStagnantMass(stagnantMassMg);
  document.getElementById('stagnantSingularityValue').textContent = fmtPowerBase(stagnantSingularities);
  const approximateNext = isPositiveNumberValue(stagnantSingularities)
    && compareNumberValues(addBaseNumbers(stagnantSingularities, 1), stagnantSingularities) === 0;
  document.getElementById('stagnantSingularityNextValue').textContent = (approximateNext ? '약 ' : '') + formatStagnantMass(stagnantSingularityRequirement());
  document.getElementById('stagnantMassRateValue').textContent = `${formatStagnantMass(stagnantMassGainPerRealSecond())} / 초`;
  document.getElementById('stagnantMassRadiusEffect').textContent = `×${fmtPowerBase(stagnantMassRadiusMultiplier())}`;
  document.getElementById('stagnantMassRandomEffect').textContent = `×${fmtPowerBase(stagnantMassRandomMultiplier())}`;
  for (const control of spaceExpansionUpgradeControls) {
    const cost = spaceExpansionUpgradeCost(control.id);
    control.label.textContent = `${control.title} · ${fmtPowerBase(spaceExpansionUpgradeLevels[control.id])}회 · ×${fmtPowerBase(spaceExpansionUpgradeMultiplier(control.id))}`;
    control.cost.textContent = `비용: ${formatStagnantMass(cost)} SM · 다음 가격 ×${control.growth}`;
    control.button.disabled = !spaceExpansionUnlocked() || gameSessionPaused() || compareNumberValues(stagnantMassMg, cost) < 0;
  }
  const extraUnlocked = spaceExpansionExtraUpgradesUnlocked();
  document.getElementById('spaceExpansionExtraUpgrades').classList.toggle('hidden',
    !extraUnlocked && !SPACE_EXPANSION_ONE_TIME_UPGRADES.some(u => hasSpaceExpansionOneTimeUpgrade(u.id)));
  document.getElementById('spaceExpansionExtraStatus').textContent = extraUnlocked
    ? '각 업그레이드는 한 번만 구매할 수 있습니다.' : '추가 구매에는 추상화 30-1 연구가 필요합니다. 구매한 효과는 유지됩니다.';
  for (const control of spaceExpansionOneTimeControls) {
    const owned = hasSpaceExpansionOneTimeUpgrade(control.id);
    control.info.textContent = owned ? `구매 완료 · ${spaceExpansionOneTimeEffectText(control.id)}`
      : `비용: ${formatStagnantMass(control.costMg)} SM`;
    control.button.disabled = owned || !extraUnlocked || gameSessionPaused() || compareNumberValues(stagnantMassMg, control.costMg) < 0;
    control.button.classList.toggle('bought', owned);
  }
  const t = SPACE_EXPANSION_BALANCE;
  document.getElementById('spaceExpansionFormulaText').textContent =
    `배율 M > 10: 10^((log10(M))^${penaltyPower}). 10 이하 배율은 유지합니다. `
    + `SP 보상 G>1: max(1, log10(G)^${hasSpaceExpansionOneTimeUpgrade('penalty_relief') ? SPACE_EXPANSION_EXTRA_BALANCE.spLogPower : 1}). `
    + `H = floor((log10(max(1, CP)) / ${t.higgsCpLogScale})^${t.higgsPower} × 3^Lh), 보유 H = max(기존 H, 종료 H). `
    + 'SM 생산 = 보유 H × 5^Lm mg/현실초. Lh/Lm/Le는 각 공간 팽창 업그레이드 구매 횟수입니다. '
    + '정체된 특이점 S는 요구 질량 도달 시 소모 없이 자동 획득합니다. 질량을 소비해도 S는 유지됩니다. '
    + `다음 요구 질량[mg] = ${STAGNANT_SINGULARITY_BALANCE.firstMassMg}^(${STAGNANT_SINGULARITY_BALANCE.requirementPower}^S). `
    + `L(S)=S>0이면 ${Math.log10(STAGNANT_SINGULARITY_BALANCE.firstMassMg)}×${STAGNANT_SINGULARITY_BALANCE.requirementPower}^(S-1), 아니면0. `
    + `F = (L(S) / log10(1 + ${t.massReferenceMg}))^${t.massCurve}. `
    + `반지름 ×(1 + ${t.radiusStrength}F) × 2^Le, 무작위력 ×10^(${t.randomLogStrength}F) × 2^Le. `
    + 'S가 0이면 특이점 배율은 1입니다. 28-1과 추가 업그레이드의 특이점 배율에도 2^Le를 곱합니다. 기본 커누스의 정체된 질량 증폭은 반지름 기여에만 추가로 곱합니다. '
    + `추가 효과: F(S,r)=(L(S)/log10(1+r))^${SPACE_EXPANSION_EXTRA_BALANCE.massCurve}, E=S>0이면2^Le, 아니면1. `
    + `퍼센트 ×10^(${SPACE_EXPANSION_EXTRA_BALANCE.percentLogStrength}F(S,${SPACE_EXPANSION_EXTRA_BALANCE.percentMassMg}))×E. `
    + `슬롯 +floor(${SPACE_EXPANSION_EXTRA_BALANCE.slotStrength}×(log10(1+H)/${SPACE_EXPANSION_EXTRA_BALANCE.slotHiggsLogScale})^${SPACE_EXPANSION_EXTRA_BALANCE.slotCurve}). `
    + `투여 상한 배율=(1+${SPACE_EXPANSION_EXTRA_BALANCE.overfeedStrength}F(S,${SPACE_EXPANSION_EXTRA_BALANCE.overfeedMassMg}))×E. `
    + `1/2그룹 배율=(1+${SPACE_EXPANSION_EXTRA_BALANCE.groupStrength}F(S,${SPACE_EXPANSION_EXTRA_BALANCE.groupMassMg}))×E. `
    + '나머지 추가 효과는 각각의 일회성 구매가 필요합니다.';
}

function tickSpaceExpansion() {
  const now = gameTimelineNowMs();
  const elapsed = Math.max(0, now - spaceExpansionLastTickAt);
  spaceExpansionLastTickAt = now;
  if (advanceSpaceExpansion(elapsed) && activeChapter === 'knuth'
    && typeof activeKnuthView !== 'undefined' && activeKnuthView === 'production'
    && activeKnuthProductionView === 'space_expansion') renderSpaceExpansionBoard();
}

knuthSpaceExpansionTabBtn.addEventListener('click', () => setKnuthProductionView('space_expansion'));
document.getElementById('spaceExpansionToggleBtn').addEventListener('click', () => toggleSpaceExpansion());
for (const control of spaceExpansionUpgradeControls) {
  control.button.addEventListener('click', () => {
    if (buySpaceExpansionUpgrade(control.id)) renderSpaceExpansionBoard();
  });
}
setGameInterval(tickSpaceExpansion, 100);
