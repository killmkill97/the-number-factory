const kunuthUpgradeUi = {};
let activeKunuthView = 'base';
let kunuthUpgradeGroupsInitialized = false;
let kunuthSlotDisplaySignature = '';

function kunuthSlotTierLabel(slots) {
  return slots >= 5 ? '↑↑↑↑↑+' : '↑'.repeat(slots);
}

function createKunuthUpgradeButton(upgrade) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'kunuth-upgrade';
  button.addEventListener('click', () => toggleKunuthUpgrade(upgrade.id));

  const title = document.createElement('span');
  title.className = 'kunuth-upgrade-title';
  title.textContent = upgrade.title;
  const description = document.createElement('span');
  description.className = 'kunuth-upgrade-description';
  description.textContent = upgrade.description;
  const cost = document.createElement('span');
  cost.className = 'cost';
  button.append(title, description, cost);

  kunuthUpgradeUi[upgrade.id] = { button, cost };
  return button;
}

function setKunuthView(view) {
  activeKunuthView = view === 'equipment' ? 'equipment' : 'base';
  const baseActive = activeKunuthView === 'base';
  kunuthBaseUpgradeViewBtn.classList.toggle('active', baseActive);
  kunuthEquipUpgradeViewBtn.classList.toggle('active', !baseActive);
  kunuthBaseUpgradeViewBtn.setAttribute('aria-selected', String(baseActive));
  kunuthEquipUpgradeViewBtn.setAttribute('aria-selected', String(!baseActive));
  kunuthBaseUpgradePanel.classList.toggle('hidden', !baseActive);
  kunuthEquipUpgradePanel.classList.toggle('hidden', baseActive);
}

function renderKunuthSlotDisplay() {
  const capacity = kunuthSlotCapacity();
  const used = kunuthSlotsUsed();
  const signature = `${used}/${capacity}`;
  if (signature === kunuthSlotDisplaySignature) return;
  kunuthSlotDisplaySignature = signature;
  kunuthSlotDisplay.replaceChildren();

  const label = document.createElement('span');
  label.className = 'kunuth-slot-label';
  label.textContent = `↑ 슬롯 ${used} / ${capacity}`;
  kunuthSlotDisplay.appendChild(label);

  const arrows = document.createElement('span');
  arrows.className = 'kunuth-slot-arrows';
  for (let index = 0; index < capacity; index++) {
    const arrow = document.createElement('span');
    arrow.className = `kunuth-slot-arrow${index < used ? ' active' : ''}`;
    arrow.textContent = '↑';
    arrows.appendChild(arrow);
  }
  kunuthSlotDisplay.appendChild(arrows);
}

function renderKunuthUpgradeGroups() {
  if (!kunuthUpgradeGroupsInitialized) {
    const fragment = document.createDocumentFragment();
    for (let slots = 1; slots <= 5; slots++) {
      const group = document.createElement('section');
      group.className = 'kunuth-upgrade-group';
      const title = document.createElement('div');
      title.className = 'kunuth-upgrade-group-title';
      title.textContent = kunuthSlotTierLabel(slots);
      group.appendChild(title);

      const list = document.createElement('div');
      list.className = 'kunuth-upgrade-list';
      const upgrades = KUNUTH_SLOT_UPGRADES.filter(upgrade => upgrade.slots === slots);
      if (upgrades.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'kunuth-upgrade-empty';
        empty.textContent = '추가 강화 예정';
        list.appendChild(empty);
      } else {
        for (const upgrade of upgrades) list.appendChild(createKunuthUpgradeButton(upgrade));
      }
      group.appendChild(list);
      fragment.appendChild(group);
    }
    kunuthUpgradeGroups.replaceChildren(fragment);
    kunuthUpgradeGroupsInitialized = true;
  }

  for (const upgrade of KUNUTH_SLOT_UPGRADES) {
    const ui = kunuthUpgradeUi[upgrade.id];
    if (!ui) continue;
    const equipped = hasKunuthUpgrade(upgrade.id);
    const canEquip = kunuthSlotsUsed() + upgrade.slots <= kunuthSlotCapacity();
    ui.button.classList.toggle('equipped', equipped);
    ui.cost.textContent = `${kunuthSlotTierLabel(upgrade.slots)} · ${equipped ? '장착 완료' : '클릭해서 장착'}`;
    ui.button.disabled = equipped || !canEquip;
  }
}

function renderKunuthBoard() {
  if (
    !kunuthSlotDisplay ||
    !kunuthBaseUpgradeViewBtn ||
    !kunuthEquipUpgradeViewBtn ||
    !kunuthBaseUpgradePanel ||
    !kunuthEquipUpgradePanel ||
    !kunuthResetEquipmentToggle ||
    !kunuthOperationUpgradeBtn ||
    !kunuthOperationUpgradeCostText ||
    !kunuthUpgradeGroups ||
    typeof kunuthOperationUpgradeCost !== 'function' ||
    typeof kunuthSlotCapacity !== 'function' ||
    typeof kunuthSlotsUsed !== 'function' ||
    typeof KUNUTH_SLOT_UPGRADES === 'undefined'
  ) return;
  const cost = kunuthOperationUpgradeCost();
  kunuthOperationUpgradeCostText.textContent = `비용: ${fmtPowerBase(cost)} KP · 슬롯 +1`;
  kunuthOperationUpgradeBtn.disabled = compareNumberValues(kunuthPoints, cost) < 0;
  const resetOnNextPrestige = kunuthResetEquipmentOnNextPrestige === true;
  kunuthResetEquipmentToggle.classList.toggle('toggle-active', resetOnNextPrestige);
  kunuthResetEquipmentToggle.classList.toggle('toggle-inactive', !resetOnNextPrestige);
  kunuthResetEquipmentToggle.setAttribute('aria-pressed', String(resetOnNextPrestige));
  kunuthResetEquipmentToggle.textContent = `다음 커누스 때 장착 초기화: ${resetOnNextPrestige ? 'ON' : 'OFF'}`;
  renderKunuthSlotDisplay();
  renderKunuthUpgradeGroups();
}

kunuthOperationUpgradeBtn.addEventListener('click', buyKunuthOperationUpgrade);
kunuthBaseUpgradeViewBtn.addEventListener('click', () => setKunuthView('base'));
kunuthEquipUpgradeViewBtn.addEventListener('click', () => setKunuthView('equipment'));
kunuthResetEquipmentToggle.addEventListener('click', toggleKunuthEquipmentReset);
setKunuthView(activeKunuthView);
