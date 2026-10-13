const FORMULA_HELP_DEFINITIONS = {
  'percent:softcap': {
    title: '퍼센트 라인 소프트캡 감쇠',
    formula: 'N ≤ S: M = 1\nN > S: M = (S / N)^K\n기본 K = 2, 퍼센트 효율 개선 업그레이드 구매 시 K = 1',
    detail: 'S는 현재 퍼센트 파워로 정해지는 소프트캡, N은 현재 수입니다. 그래프 x축은 N/S 비율이며, y축 M은 생산량에 곱해지는 감쇠 배율입니다.',
    graphs: [{
      title: '소프트캡 초과 후 생산 감쇠',
      src: './assets/formula-graphs/percent-softcap.svg',
      alt: '소프트캡을 넘은 수의 비율에 따른 기본 및 효율 개선 감쇠 곡선'
    }]
  },
  'generalization:5-2': {
    title: '5-2 제곱 포인트 획득 공식',
    formula: 'SP = max(1, 수^(1/2400) / LONG_MAX)',
    detail: '그래프는 기본 연구 공식을 표시합니다. 가로축은 거대한 수를 다루기 위해 log₁₀(수), 세로축은 SP 로그 축입니다. 기타 SP 획득 배율은 그래프에서 제외했습니다.',
    graphs: [{
      title: '수에 따른 기본 SP 획득량',
      src: './assets/formula-graphs/generalization-5-2.svg',
      alt: 'log10 수가 약 45516에서 55116으로 증가할 때 기본 SP가 1에서 10000으로 증가하는 그래프'
    }]
  },
  'knuth:knuth_time_gain': {
    title: '시간의 가치',
    formula: 'SP / CP 배율 = 1 + √T',
    detail: 'T는 현재 제곱 진행에서 흐른 가속 게임 시간(초)입니다.',
    graphs: [{
      title: '머문 시간에 따른 SP / CP 배율',
      src: './assets/formula-graphs/knuth-time-value.svg',
      alt: '제곱 진행 시간 0초에서 3600초까지 SP와 CP 배율이 증가하는 그래프'
    }]
  },
  'knuth:percent_purchase_bonus': {
    title: '연속강화',
    formula: '레인 누적 추가 파워(%) = 20 × x / (x + 1000)',
    detail: 'x는 해당 퍼센트 레인의 구매 횟수입니다. 추가 파워는 구매 횟수가 늘수록 증가하며 20%에 점근합니다.',
    graphs: [{
      title: '레인별 구매 횟수에 따른 누적 추가 파워',
      src: './assets/formula-graphs/knuth-continuous.svg',
      alt: '구매 횟수 x가 증가할수록 누적 추가 퍼센트 파워가 20%에 점근하는 그래프'
    }]
  },
  'knuth:percent_count_discount': {
    title: '반복 구매 할인',
    formula: 'D_N = 0.5 × (1 - 20^(-N/2000))\nD_total = min(0.9, 1 - (1-D_N)(1-D_T)(1-D_C))\n로그 가격 = 원가 로그 × max(0.1, 1-D_total)',
    detail: 'N은 각 퍼센트 레인의 구매 횟수입니다. 반복 할인 기여는 최대 50%에 점근하며 N=2000에서 최대치의 95%(47.5%)에 도달합니다. 다른 할인과의 합산은 최대 90%이며, 복리 가격 상승과 결제 가격에 최소 10%의 로그 가격 유지율을 함께 적용합니다.',
    graphs: [{
      title: '구매 횟수에 따른 로그 가격 할인률',
      src: './assets/formula-graphs/knuth-repeat-discount.svg',
      alt: '구매 횟수가 늘수록 로그 가격 할인률이 50퍼센트에 점근하는 그래프'
    }]
  },
  'knuth:percent_overflow': {
    title: '퍼센트 오버플로우',
    formula: 'SP / CP 배율 = 1 + A × log₂(1 + O / B)\nA = 3, B = 100000',
    detail: 'O는 장착 중 누적한 초과 퍼센트 파워입니다. O=0이면 1배, O=10만이면 4배이며 이후에도 완만하게 증가합니다. 그래프는 O=0부터 100만까지의 배율 변화를 표시합니다.',
    graphs: [{
      title: '누적 오버플로우에 따른 SP / CP 배율',
      src: './assets/formula-graphs/knuth-percent-overflow.svg?v=20261012-log-overflow-v1',
      alt: '누적 퍼센트 오버플로우 O가 0에서 100만까지 증가할 때 SP와 CP 배율이 로그 형태로 증가하는 그래프'
    }]
  },
  'knuth:percent_time_discount': {
    title: '시간의 할인',
    formula: 'D_T = 0.9 × (1 - 20^(-T/300))\n할인 후 로그 가격 = 기존 로그 가격 × (1 - D_T)',
    detail: 'T는 현재 제곱 진행에서 흐른 가속 게임 시간(초)입니다. 할인률은 log₁₀ 비용에 적용됩니다.',
    graphs: [{
      title: '제곱 진행 시간에 따른 로그 가격 할인률',
      src: './assets/formula-graphs/knuth-time-discount.svg',
      alt: '제곱 진행 시간이 늘수록 로그 가격 할인률이 90퍼센트에 점근하는 그래프'
    }]
  },
};

let formulaHelpDialog = null;

function formulaHelpDefinition(category, id) {
  return FORMULA_HELP_DEFINITIONS[`${category}:${id}`] ?? null;
}

function createFormulaHelpButton(category, id) {
  const definition = formulaHelpDefinition(category, id);
  if (!definition) return null;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'formula-help-trigger';
  button.textContent = '?';
  button.title = `${definition.title} 그래프 보기`;
  button.setAttribute('aria-label', `${definition.title} 공식과 그래프 보기`);
  button.addEventListener('pointerdown', event => event.stopPropagation());
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openFormulaHelp(category, id);
  });
  return button;
}

function wrapFormulaHelpCard(button, category, id, extraClass = '') {
  if (!button || !button.parentElement) return null;
  if (button.dataset.formulaHelpWrapped === 'true') return button.parentElement;
  const help = createFormulaHelpButton(category, id);
  if (!help) return null;

  const card = document.createElement('div');
  card.className = `formula-help-card ${extraClass}`.trim();
  card.style.gridColumn = button.style.gridColumn;
  card.style.gridRow = button.style.gridRow;
  button.style.gridColumn = '';
  button.style.gridRow = '';
  button.dataset.formulaHelpWrapped = 'true';
  button.parentElement.insertBefore(card, button);
  card.append(button, help);
  return card;
}

function ensureFormulaHelpButton(card, category, id) {
  if (!card) return null;
  const existing = Array.from(card.children ?? []).find(child =>
    child.className?.split(/\s+/).includes('formula-help-trigger')
  );
  if (existing) return existing;
  const button = createFormulaHelpButton(category, id);
  if (button) card.appendChild(button);
  return button;
}

function ensureFormulaHelpDialog() {
  if (formulaHelpDialog) return formulaHelpDialog;
  const dialog = document.createElement('dialog');
  dialog.className = 'formula-help-dialog';
  dialog.setAttribute('aria-labelledby', 'formulaHelpTitle');

  const shell = document.createElement('section');
  shell.className = 'formula-help-shell';
  const header = document.createElement('header');
  header.className = 'formula-help-header';
  const title = document.createElement('h2');
  title.id = 'formulaHelpTitle';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'formula-help-close';
  close.textContent = '×';
  close.setAttribute('aria-label', '그래프 창 닫기');
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);

  const equation = document.createElement('pre');
  equation.className = 'formula-help-equation';
  const detail = document.createElement('p');
  detail.className = 'formula-help-detail';
  const graphs = document.createElement('div');
  graphs.className = 'formula-help-graphs';
  shell.append(header, equation, detail, graphs);
  dialog.appendChild(shell);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  document.body.appendChild(dialog);
  formulaHelpDialog = dialog;
  return dialog;
}

function createFormulaGraph(graph) {
  const figure = document.createElement('figure');
  figure.className = 'formula-help-graph';
  const caption = document.createElement('figcaption');
  caption.textContent = graph.title;
  const image = document.createElement('img');
  image.className = 'formula-help-image';
  image.src = graph.src;
  image.alt = graph.alt;
  figure.append(caption, image);
  return figure;
}

function openFormulaHelp(category, id) {
  const definition = formulaHelpDefinition(category, id);
  if (!definition) return false;
  const dialog = ensureFormulaHelpDialog();
  dialog.dataset.theme = category === 'knuth' || category === 'challenge' ? 'green' : 'violet';
  dialog.querySelector('#formulaHelpTitle').textContent = definition.title;
  const timeResearchActive = category === 'knuth'
    && hasAbstractionResearch('4-1')
    && (id === 'knuth_time_gain' || id === 'percent_time_discount');
  const formula = timeResearchActive
    ? id === 'knuth_time_gain'
      ? 'T효과 = T^1.5\nSP / CP 배율 = 1 + √T효과'
      : 'T효과 = T^1.5\nD_T = 0.9 × (1 - 20^(-T효과/300))\n할인 후 로그 가격 = 기존 로그 가격 × (1 - D_T)'
    : definition.formula;
  dialog.querySelector('.formula-help-equation').textContent = formula;
  const detail = dialog.querySelector('.formula-help-detail');
  detail.textContent = timeResearchActive
    ? `${definition.detail} 그래프는 4-1 연구가 적용되지 않은 기준입니다.`
    : definition.detail ?? '';
  detail.classList.toggle('hidden', !definition.detail);
  dialog.querySelector('.formula-help-graphs').replaceChildren(
    ...(definition.graphs ?? []).map(createFormulaGraph)
  );
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  return true;
}

function wrapStaticFormulaHelpCards() {
  const percentSection = document.getElementById('percentSection');
  if (percentSection) percentSection.classList.add('formula-help-host');
  ensureFormulaHelpButton(percentSection, 'percent', 'softcap');
}

wrapStaticFormulaHelpCards();
