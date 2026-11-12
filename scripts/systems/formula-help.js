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

// These chart specifications are sampled only by the offline asset generator.
const FORMULA_HELP_CHARTS = {};
function registerFormulaChart(category, id, formula, detail, chart) {
  const research = (category === 'abstraction' ? ABSTRACTION_RESEARCHES
    : category === 'generalization' ? GENERALIZATION_RESEARCHES
      : category === 'space-expansion' ? SPACE_EXPANSION_ONE_TIME_UPGRADES
      : category === 'knuth-base' ? KNUTH_BASE_UPGRADES : KNUTH_SLOT_UPGRADES).find(item => item.id === id);
  const key = `${category}:${id}`;
  const file = `${category}-${id}.svg`;
  FORMULA_HELP_CHARTS[key] = { ...chart, file, ariaLabel: `${research.title} 공식 그래프` };
  const graphVersion = category === 'abstraction' && ['25-1', '27-2'].includes(id)
    ? '20261027-production-cp-v2' : (category === 'abstraction' && id === '28-1')
      || (category === 'space-expansion' && ['mass_percent','overfeed','group_boost'].includes(id))
      ? '20261112-stagnant-singularities-v1' : category === 'space-expansion' && id === 'higgs_slots'
      ? '20261101-higgs-slots-v1' : '20261021-formula-copy-v1';
  FORMULA_HELP_DEFINITIONS[key] = {
    title: `${['knuth', 'knuth-base', 'space-expansion'].includes(category) ? '' : `${id} `}${research.title}`,
    formula, detail,
    graphs: [{ title: research.title, src: `./assets/formula-graphs/${file}?v=${graphVersion}`,
      alt: `${chart.xLabel}에 따른 ${chart.yLabel} 그래프. ${detail}` }]
  };
}

const formulaChart = (xLabel, yLabel, max, evaluate, extra = {}) => ({
  xLabel, yLabel, min: 0, max, lines: [{ color: '#56d364', evaluate }], ...extra
});
const registerAbstractionFormula = (id, formula, detail, chart) =>
  registerFormulaChart('abstraction', id, formula, detail, chart);

registerFormulaChart('generalization', '5-3', 'D(n) = a² × n^(b + c/2) / max(1, 100-c)',
  '그래프는 a=2, b=1.05, c=10으로 고정한 예시입니다. 다른 연구와 배율을 적용하기 전의 발산력입니다.',
  formulaChart('n', '발산력 D(n) (log10)', 1000, n => Math.log10(4 * Math.max(1,n)**6.05 / 90), { min: 1 }));
registerFormulaChart('generalization', '5-4', 'S = 1e12 × 10^(P^1.5 - 1 + O)',
  'P는 기본 퍼센트 파워와 추가 파워의 합, O는 다이슨 스웜과 오버클럭으로 얻는 추가 단계입니다. 그래프는 O=0이며 다른 소프트캡 배율은 제외합니다.',
  formulaChart('퍼센트 파워 P', '소프트캡 S (log10)', 200, p => 11+p**1.5, { min: 1 }));
registerFormulaChart('generalization', '6-2', '제곱력 = (x × y × z)^1',
  '그래프의 가로축은 제곱 차원 세 변의 곱이며, 다른 생산 배율은 제외합니다.',
  formulaChart('세 변의 곱 xyz', '기본 제곱력', 1000, x => x));
registerFormulaChart('generalization', '7-1', '제곱력 = (x × y × z)^3',
  '그래프의 가로축은 제곱 차원 세 변의 곱이며, 다른 생산 배율은 제외합니다.',
  formulaChart('세 변의 곱 xyz', '기본 제곱력', 100, x => x**3));
registerFormulaChart('generalization', '8-1', '첫 커누스: 1 KP\n이후 기본 KP = floor(max(1, log10(CP)/15))',
  '그래프는 첫 커누스 이후의 기본 공식입니다. 추상화 8-1이나 다른 KP 배율은 제외하며, 실제 교환에는 기존 필수 연구를 요구합니다.',
  formulaChart('보유 CP (log10)', '기본 KP', 150, x => Math.floor(Math.max(1,x/15))));

registerAbstractionFormula('4-1', 'T효과 = T^1.5',
  'T는 제곱에 머문 가속 게임 시간입니다. 제곱 교환 시 초기화됩니다. 현실 시간과 반비례 효과의 U는 이 연구로 거듭제곱하지 않습니다.',
  formulaChart('가속 게임 시간 T (초)', '효과에 사용하는 시간', 3600, x => x**1.5));
registerAbstractionFormula('5-1', 'L = log10(max(1, 제곱력))\n블랙홀 배율 = 1 + 99L/(L+50)',
  '제곱돌파 블랙홀의 기존 시간 가속에 곱합니다. 제곱력이 커질수록 100배에 가까워집니다.',
  formulaChart('제곱력 (log10)', '블랙홀 추가 배율', 500, x => 1+99*x/(x+50)));
registerAbstractionFormula('6-1', '추가 T 획득 속도 = 48/(1+U/300)\n매초 T 증가 = 1 + 추가 획득 속도',
  'U는 현재 제곱의 거듭제곱 적용 전 가속 게임 시간입니다. 그래프는 게임 1초당 추가로 얻는 시간입니다.',
  formulaChart('제곱 게임 시간 U (초)', '추가 시간 / 게임 초', 3600, x => 48/(1+x/300)));
registerAbstractionFormula('4-2', 'L = log10(1+KP)\nb 배율 = 1 + 50L/(L+50)',
  '현재 보유 KP로 계산하며, 다른 발산자 배율과 별도로 적용합니다.',
  formulaChart('보유 KP (log10(1+KP))', 'b 배율', 500, x => 1+50*x/(x+50)));
registerAbstractionFormula('5-2', 'L = log10(1+D)\nCP 배율 = 10^(L^(1/4)/2)',
  'D는 현재 발산력입니다. 발산자가 활성 상태일 때 적용합니다. 그래프는 거대 배율을 로그 높이로 표시합니다.',
  formulaChart('발산력 D (log10(1+D))', 'CP 배율 (log10)', 1e8, x => x**0.25/2));
registerAbstractionFormula('6-2', 'L = log10(max(1, 제곱력))\n소프트캡 강화 지수 = 1 + 1.5L/(L+100)',
  '이 연구 적용 전 소프트캡을 해당 지수만큼 거듭제곱합니다. 강화 지수는 2.5에 가까워집니다.',
  formulaChart('제곱력 (log10)', '소프트캡 강화 지수', 1000, x => 1+1.5*x/(x+100)));
registerAbstractionFormula('4-3', 'Ld = log10(1+발산력), Lp = log10(max(1, 제곱력))\n퍼센트 획득 배율 = 10^(sqrt(Ld×Lp)/2)',
  '두 재화가 함께 기여합니다. 그래프는 제곱력의 로그 Lp=1000을 고정하고 발산력만 바꾼 예시입니다.',
  formulaChart('발산력 (log10(1+D))', '퍼센트 획득 배율 (log10)', 10000, x => Math.sqrt(x*1000)/2));
registerAbstractionFormula('5-3', 'L = log10(1+SP)\n소프트캡 강화 지수 = 1 + 0.5L/(L+500)',
  '현재 보유 SP로 계산하며, 이 연구의 강화 지수는 1.5에 가까워집니다.',
  formulaChart('보유 SP (log10(1+SP))', '소프트캡 강화 지수', 5000, x => 1+0.5*x/(x+500)));
registerAbstractionFormula('6-3', 'L = Σ log10(1+보유 재화)\n이 연구의 할인율 = 0.95L/(L+20)\n전체 할인율 = min(0.9, 1-각 할인 유지율의 곱)',
  '재화는 SP, CP, KP, 이론, 대이론입니다. 할인은 가격의 로그에 적용됩니다. 그래프는 이 연구만 적용하고 전체 90% 상한을 반영한 예시입니다.',
  formulaChart('다섯 재화의 로그 합 L', '로그 가격 할인율 (%)', 500, x => 100*Math.min(0.9,0.95*x/(x+20))));
registerAbstractionFormula('8-1', '기본 KP = floor(max(1, 10^((log10(CP)-15)/15)))',
  '첫 커누스 이후 적용되며, 이후 기존 KP 배율을 곱하고 최종 지급량을 버립니다. 그래프는 추가 배율을 제외합니다.',
  formulaChart('보유 CP (log10)', '기본 KP (log10)', 75, x => Math.log10(Math.floor(Math.max(1,10**((x-15)/15))))));

for (const [id, source, tuning] of [['9-1','KP',ABSTRACTION_TIER9_BALANCE.cpFromKp],
  ['9-2','log10(1+수)',ABSTRACTION_TIER9_BALANCE.percentFromNumber]]) {
  registerAbstractionFormula(id, `X = ${source}\nM = 1 + ${tuning.strength} × log2(1+(X/${tuning.scale})^${tuning.curve})`,
    id==='9-1' ? '현재 보유 KP에 따라 최종 CP 획득량에 곱합니다.' : '현재 보유 수에 따라 퍼센트 최종 획득량에 곱합니다. 추상화 8-2의 제곱 뒤에 적용합니다.',
    formulaChart(source, '획득 배율', tuning.scale*100, x => 1+tuning.strength*Math.log2(1+(x/tuning.scale)**tuning.curve)));
}

const secondBranchFormulaTuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
for (const [id, active, record] of [['12-1',true,false],['13-1',true,true],['12-3',false,false],['13-3',false,true]]) {
  const t=secondBranchFormulaTuning;
  const strengths=record ? [active?t.activeKpStrength:t.idleKpStrength] :
    active?[t.activeSpStrength,t.activeCpStrength]:[t.idleSpStrength,t.idleCpStrength];
  const variable=active?'U':'T';
  const rate=active?`r = (1+U/${t.timeScale})^(-${t.activeDecayPower})`:`H = log2(1+T/${t.timeScale}), r = H/(1+H)`;
  const evaluate=(seconds,strength)=>active ? 1+strength/(1+seconds/t.timeScale)**t.activeDecayPower :
    1+strength*(1-1/(1+Math.log2(1+seconds/t.timeScale)));
  registerAbstractionFormula(id, `${rate}\n${record?'KP': 'SP'} 배율 = 1 + ${strengths[0]}r${record?'':`\nCP 배율 = 1 + ${strengths[1]}r`}`,
    `${variable}는 ${record?(active?'가장 짧게 끝낸':'가장 오래 머문'):'이번'} 커누스의 현실 시간(초)입니다. ${record?'현재 교환 후보 기록도 포함합니다. ':''}시간 가속과 추상화 4-1의 영향을 받지 않습니다.`,
    formulaChart(`커누스 현실 시간 ${variable} (초)`, '획득 배율 (log10)', 3600, x=>Math.log10(evaluate(x,strengths[0])),
      record?{}:{lines:strengths.map((strength,index)=>({label:index===0?'SP':'CP',color:index===0?'#56d364':'#59dafd',evaluate:x=>Math.log10(evaluate(x,strength))}))}));
}
registerAbstractionFormula('14-1', `a·b·c 배율 = 1 + ${secondBranchFormulaTuning.activeParameterStrength}/(1+U/${secondBranchFormulaTuning.timeScale})^${secondBranchFormulaTuning.activeDecayPower}\n속도 강화 감소량 = 기존 감소량 ×${secondBranchFormulaTuning.activeSpeedReduction}`,
  'U는 이번 커누스의 현실 시간(초)입니다. 그래프는 a/b/c 배율이며, 속도 강화의 최소 간격과 발산식 분모 하한 1은 유지합니다.',
  formulaChart('커누스 현실 시간 U (초)', 'a/b/c 배율', 3600, x=>1+secondBranchFormulaTuning.activeParameterStrength/(1+x/secondBranchFormulaTuning.timeScale)**secondBranchFormulaTuning.activeDecayPower));

registerAbstractionFormula('15-1', `R0 = log10(1 + [log10(1+M)]^(1+log10(1+p)))\nSP 기본 반지름 = ${NUMBER_BLACK_HOLE_BALANCE.spRadiusMultiplier}R0 × (1+${NUMBER_BLACK_HOLE_BALANCE.spDonationCountStrength}log10(1+C))\nLv = log10(1+v), Lr = log10(1+R)\n특이점 요구량 나눗수 = 1+${SINGULARITY_BALANCE.spRequirementMaxDivisor-1} × Lv/(Lv+${SINGULARITY_BALANCE.spRequirementSpeedLogScale}) × Lr/(Lr+${SINGULARITY_BALANCE.spRequirementRadiusLogScale})`,
  'M은 누적 투여 SP, p는 투입 퍼센트, C는 실제 투여 횟수, v는 현실 초당 투여 횟수, R은 최종 반지름입니다. 그래프는 동일한 질량에서 투여 횟수만 바꾼 SP 반지름 기여 배율입니다. 이후 기존 특이점 배율과 기본 업그레이드의 추가 반지름을 적용합니다.',
  formulaChart('SP 투여 횟수 C (log10(1+C))', 'SP 반지름 기여 배율',12,x=>NUMBER_BLACK_HOLE_BALANCE.spRadiusMultiplier*(1+NUMBER_BLACK_HOLE_BALANCE.spDonationCountStrength*x)));

registerAbstractionFormula('16-1', `L = log10(max(1, 총 제곱력))\n다이슨 효과 배율 = 1 + ${ABSTRACTION_TIER16_BALANCE.dysonStrength}L/(L+${ABSTRACTION_TIER16_BALANCE.squarePowerLogScale})`,
  '다이슨 스웜의 개수가 아니라 효과를 강화합니다. 다이슨이 없거나 KC1이면 적용되지 않습니다.',
  formulaChart('총 제곱력 (log10)', '다이슨 효과 배율', 10000, x=>1+ABSTRACTION_TIER16_BALANCE.dysonStrength*x/(x+ABSTRACTION_TIER16_BALANCE.squarePowerLogScale)));
registerAbstractionFormula('17-1', `CP 배율 = 10^(${ABSTRACTION_TIER17_BALANCE.singularityCpLogStrength} × (S/${ABSTRACTION_TIER17_BALANCE.singularityReference})^${ABSTRACTION_TIER17_BALANCE.singularityCpCurve})`,
  'S는 현재 보유한 특이점입니다. 업그레이드로 소모하면 이 배율도 줄어듭니다.',
  formulaChart('보유 특이점 S', 'CP 배율 (log10)', 16, x=>ABSTRACTION_TIER17_BALANCE.singularityCpLogStrength*(x/ABSTRACTION_TIER17_BALANCE.singularityReference)**ABSTRACTION_TIER17_BALANCE.singularityCpCurve));
registerAbstractionFormula('17-2', `L = max(1, log10(SP/교환 요구량))\n기본 CP = L^${ABSTRACTION_TIER17_BALANCE.cpBasePower}`,
  '그래프는 기존 기본 CP인 L과 개선된 기본 CP를 비교합니다. 추가 CP 배율은 이후 별도로 곱합니다.',
  formulaChart('SP / 교환 요구량 (log10)', '기본 CP (log10)', 20, x=>Math.log10(Math.max(1,x)**ABSTRACTION_TIER17_BALANCE.cpBasePower),
    {min:1,lines:[{label:'개선 후',color:'#56d364',evaluate:x=>Math.log10(x**ABSTRACTION_TIER17_BALANCE.cpBasePower)},
      {label:'개선 전',color:'#59dafd',evaluate:x=>Math.log10(x)}]}));
registerAbstractionFormula('17-4', `L = log10(max(1,a효과))\nn 증가 속도 배율 = 1 + ${ABSTRACTION_TIER17_BALANCE.divergerNSpeedStrength}log2(1+L/${ABSTRACTION_TIER17_BALANCE.divergerALogScale})`,
  '다른 연구와 확률자까지 적용한 a 효과값을 사용합니다. 증가폭은 줄지만 배율의 상한은 없습니다.',
  formulaChart('a 효과값 (log10)', 'n 증가 속도 배율', 10000, x=>1+ABSTRACTION_TIER17_BALANCE.divergerNSpeedStrength*Math.log2(1+x/ABSTRACTION_TIER17_BALANCE.divergerALogScale)));

const miniFormulaTuning = ABSTRACTION_MINI_BRANCH_BALANCE;
registerAbstractionFormula('18-1', `요구 반지름 할인 배율 = G^(-${miniFormulaTuning.requirementLogDiscountPerSingularity}S)\n할인 후 기본 요구량 = 20 × G^((1-${miniFormulaTuning.requirementLogDiscountPerSingularity})S)`,
  'S는 보유 특이점, G는 현재 특이점 요구량 증가폭입니다. 그래프는 G=10일 때 원래 요구량 대비 비율이며 SP 투여 할인은 제외합니다. 할인 후 요구량도 보유량에 따라 늘어납니다.',
  formulaChart('보유 특이점 S', '원래 요구량 대비 비율 (%)', 8, x=>100*10**(-miniFormulaTuning.requirementLogDiscountPerSingularity*x)));
registerAbstractionFormula('18-2', `L = log10(1+R0)\n특이점 효과 강화 지수 = 1 + ${miniFormulaTuning.radiusEffectStrength}L/(L+log10(1+${miniFormulaTuning.radiusReference}))`,
  'R0는 특이점 배율을 적용하기 전의 반지름입니다. 기본 반지름·시간 가속·퍼센트·소프트캡 효과를 강화하며 KP 효과는 제외합니다.',
  formulaChart('강화 전 반지름 R0 (log10(1+R0))', '특이점 효과 강화 지수', 12, x=>1+miniFormulaTuning.radiusEffectStrength*x/(x+Math.log10(1+miniFormulaTuning.radiusReference))));
registerAbstractionFormula('18-3', `SP 배율 = max(1,C)^${miniFormulaTuning.spFromCpPower}`,
  'C는 기본 CP 획득식을 제외한 추가 CP 배율의 곱입니다. 그래프는 두 배율을 로그 축으로 표시합니다.',
  formulaChart('CP 추가 배율 C (log10)', 'SP 배율 (log10)', 100, x=>x*miniFormulaTuning.spFromCpPower));
registerAbstractionFormula('18-4', `CP 배율 = 10^(${miniFormulaTuning.cpRadiusLogStrength} × log2(1+R/${miniFormulaTuning.radiusReference}))`,
  `R은 현재 슈바르츠실트 반지름입니다. 블랙홀이 활성 상태일 때 적용하며, 그래프 세로축은 CP 배율의 log10 값입니다. R=${miniFormulaTuning.radiusReference}이면 1e${miniFormulaTuning.cpRadiusLogStrength}배입니다.`,
  formulaChart('슈바르츠실트 반지름 R', 'CP 획득 배율 (log10)', 500, x=>miniFormulaTuning.cpRadiusLogStrength*Math.log2(1+x/miniFormulaTuning.radiusReference)));
registerAbstractionFormula('18-5', `특이점 시간 효과 강화 지수 = 1 + ${miniFormulaTuning.dysonSingularityStrength}log2(1+Y/${miniFormulaTuning.dysonReference})`,
  'Y는 추가 보너스를 포함한 다이슨 스웜의 개수입니다. 특이점의 블랙홀 시간 효과만 거듭제곱하며, 18-8을 함께 연구하면 두 추가 지수를 합합니다.',
  formulaChart('유효 다이슨 스웜 개수 Y', '특이점 시간 효과 강화 지수', 500, x=>1+miniFormulaTuning.dysonSingularityStrength*Math.log2(1+x/miniFormulaTuning.dysonReference)));
registerAbstractionFormula('18-6', `다이슨 최종 효과 = 기존 효과^${miniFormulaTuning.dysonEffectPower}`,
  '다이슨 스웜이 없거나 KC1이면 적용되지 않습니다. 그래프는 두 효과를 로그 축으로 표시합니다.',
  formulaChart('기존 다이슨 효과 (log10)', '강화 후 효과 (log10)', 100, x=>x*miniFormulaTuning.dysonEffectPower));
registerAbstractionFormula('18-7', `a 강화 지수 = 1 + ${miniFormulaTuning.aFromBStrength}log2(1+b효과/${miniFormulaTuning.bReference})`,
  '강화된 b 효과값으로 a의 지수를 정합니다. 그래프는 강화 지수이며 다른 a 배율은 제외합니다.',
  formulaChart('발산자 b 효과값', 'a 강화 지수', 100000, x=>1+miniFormulaTuning.aFromBStrength*Math.log2(1+x/miniFormulaTuning.bReference)));
registerAbstractionFormula('18-8', `L = log10(max(1,n))\n특이점 시간 효과 강화 지수 = 1 + ${miniFormulaTuning.nSingularityStrength}log2(1+L/${miniFormulaTuning.nLogReference})`,
  '특이점의 블랙홀 시간 효과만 거듭제곱하며, 18-5를 함께 연구하면 두 추가 지수를 합합니다.',
  formulaChart('발산자 n (log10)', '특이점 시간 효과 강화 지수', 2600, x=>1+miniFormulaTuning.nSingularityStrength*Math.log2(1+x/miniFormulaTuning.nLogReference)));
registerAbstractionFormula('19-1', `소프트캡 강화 지수 = 1 + ${ABSTRACTION_TIER19_BALANCE.softcapPowerStrength}S/(S+${ABSTRACTION_TIER19_BALANCE.singularityScale})`,
  'S는 현재 보유 특이점입니다. 이 연구 적용 전 소프트캡을 위 지수만큼 거듭제곱합니다. 특이점을 소모하면 효과도 줄어듭니다.',
  formulaChart('보유 특이점 S', '소프트캡 강화 지수', 16, x=>1+ABSTRACTION_TIER19_BALANCE.softcapPowerStrength*x/(x+ABSTRACTION_TIER19_BALANCE.singularityScale)));
registerAbstractionFormula('19-2', `L = log10(1+D0)\n추가 다이슨 = floor(${ABSTRACTION_TIER19_BALANCE.divergerDysonMaxBonus}L/(L+${ABSTRACTION_TIER19_BALANCE.divergerDysonLogScale}))`,
  'D0는 다이슨에 의한 발산력 강화를 적용하기 전의 발산력입니다. 구매 횟수와 가격은 바꾸지 않으며 최대 추가 개수에 가까워집니다.',
  formulaChart('강화 전 발산력 D0 (log10(1+D0))', '추가 다이슨 스웜 개수', ABSTRACTION_TIER19_BALANCE.divergerDysonLogScale*10, x=>Math.floor(ABSTRACTION_TIER19_BALANCE.divergerDysonMaxBonus*x/(x+ABSTRACTION_TIER19_BALANCE.divergerDysonLogScale))));

const probabilizerResearchCurve = power => 1 + ABSTRACTION_TIER20_BALANCE.boostLogStrength
  * Math.log2(1 + power / ABSTRACTION_TIER20_BALANCE.requiredRandomPower);
registerAbstractionFormula('20-1',
  `E = 1 + ${ABSTRACTION_TIER20_BALANCE.boostLogStrength} × log2(1+W/${ABSTRACTION_TIER20_BALANCE.requiredRandomPower})\n`
    + `발산자 a·b 배율 = ${PROBABILIZER_BALANCE.divergerParameterScale} × (1+${PROBABILIZER_BALANCE.divergerParameterLogStrength} × log10(1+W/${PROBABILIZER_BALANCE.referencePower})) × E × 1.5^L\n`
    + `시간 가속 상한 = 1e100 × (1+${PROBABILIZER_BALANCE.timeLimitStrength} × log2(1+W/${PROBABILIZER_BALANCE.referencePower}) × E^${ABSTRACTION_TIER20_BALANCE.timeLimitPower})`,
  'W는 보유 무작위력, L은 무작위력으로 구매한 발산자 강화 횟수입니다. 연구 조건의 무작위력은 소모하지 않습니다. 그래프는 L=0이며 초록 선은 기존 a·b 배율에 곱하는 E, 청록 선은 기존 상한의 추가 확장분에 곱하는 E²입니다. 실제 가속을 강제로 올리지는 않으며, 기존 타이머의 유한 수치 한도는 유지합니다.',
  { xLabel: '무작위력 W', yLabel: '기존 효과의 추가 증폭 배율', min: 0,
    max: ABSTRACTION_TIER20_BALANCE.requiredRandomPower * 10,
    lines: [
      { label: 'a·b 강화', color: '#56d364', evaluate: probabilizerResearchCurve },
      { label: '상한 추가 확장분', color: '#59dafd', evaluate: x => probabilizerResearchCurve(x)**ABSTRACTION_TIER20_BALANCE.timeLimitPower }
    ] });

registerAbstractionFormula('21-1', `다음 a·b = min(${ABSTRACTION_TIER21_BALANCE.rangeMaximum}, 현재 값 × ${ABSTRACTION_TIER21_BALANCE.rangeGrowth})\na는 b를 넘지 않습니다.`,
  '연구할 때 기존 a·b 값은 유지하며, 연구 보유 중의 다음 구매부터 새 배율을 사용합니다. 그래프는 상한에 닿기 전 추가 구매 횟수에 따른 기준값 대비 배율입니다. 연구를 초기화해도 구매 이력은 보존하며 미연구 상태에서는 기존 상한만 적용합니다.',
  formulaChart('연구 후 추가 구매 횟수 N', '연구 당시 값 대비 배율 (상한 전)', 100,
    n => ABSTRACTION_TIER21_BALANCE.rangeGrowth**n));

const productionBranchTuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
registerAbstractionFormula('25-1', `CP 배율 = 10^(${productionBranchTuning.cpLogStrength} × (log10(1+W)/${productionBranchTuning.cpLogScale})^${productionBranchTuning.cpCurve})`,
  'W는 보유 무작위력입니다. 확률자가 비활성화되거나 W가 0이면 1배입니다. 무작위력은 소비하지 않습니다. CP 획득 배율에 곱하며 고급 CP 거듭제곱 등의 기존 적용 순서는 유지됩니다. 가로축과 세로축은 로그 값입니다.',
  formulaChart('무작위력 W (log10(1+W))', 'CP 획득 배율 (log10)', 200,
    x => productionBranchTuning.cpLogStrength*(x/productionBranchTuning.cpLogScale)**productionBranchTuning.cpCurve));
const probabilizerRangeLogCurve = x => productionBranchTuning.rangeLogStrength*(x/productionBranchTuning.rangeLogScale)**productionBranchTuning.rangeCurve;
registerAbstractionFormula('26-1', `L = log10(1+W)\nM = 10^(${productionBranchTuning.rangeLogStrength} × (L/${productionBranchTuning.rangeLogScale})^${productionBranchTuning.rangeCurve})\na = min(범위 상한, 구매 원본 a × M), b = min(범위 상한, 구매 원본 b × M)\nf = L/(L+${productionBranchTuning.distributionLogScale})\n최빈값 = 강화한 기존 최빈값 + (b-강화한 기존 최빈값) × f`,
  '무작위력 W에 따라 a·b와 최빈값을 강화합니다. 구매 원본·횟수·가격·상한은 유지하며 연구를 취소하면 원래 범위로 돌아갑니다. 기존 분포도 이동 업그레이드도 적용됩니다. 그래프는 구매 원본 a=1, b=100, 이동 0회 기준으로 두 축 모두 로그 값입니다.',
  { xLabel: '무작위력 W (log10(1+W))', yLabel: '추첨 범위와 최빈값 (log10)', min: 0, max: 200,
    lines: [
      { label: '시작점 a', color: '#56d364', evaluate: probabilizerRangeLogCurve },
      { label: '끝점 b', color: '#59dafd', evaluate: x => 2+probabilizerRangeLogCurve(x) },
      { label: '최빈값', color: '#f5c542', evaluate: x => probabilizerRangeLogCurve(x)+Math.log10(50.5+49.5*x/(x+productionBranchTuning.distributionLogScale)) }
    ] });
registerAbstractionFormula('27-1', `무작위력 생산 시간 배율 = max(1, 블랙홀 최종 시간 가속)^${productionBranchTuning.probabilizerTimePower}`,
  '기본 추첨 간격을 바꾸는 대신 현실 경과 시간에 이 배율을 곱해 추첨 횟수를 계산합니다. 다른 게임 시간 가속은 적용하지 않습니다. 블랙홀이 정지하면 1배이며 많은 추첨은 기존 대량 처리로 계산합니다. 두 축은 로그 값입니다.',
  formulaChart('블랙홀 최종 시간 가속 (log10)', '무작위력 생산 시간 배율 (log10)', 200,
    x => x*productionBranchTuning.probabilizerTimePower));
registerAbstractionFormula('26-2', `저장 한도 = floor(${productionBranchTuning.reservePerRadiusDecade} × log10(1+R/${productionBranchTuning.reserveRadiusScale}))\n영구 기록 = max(기존 기록, min(보유 특이점, 저장 한도))\n연구 활성 중 특이점 = max(현재 보유량, 영구 기록)\n추가 획득 = 1 + floor(${productionBranchTuning.singularityBonusStrength} × log10(1+R/${productionBranchTuning.singularityBonusRadiusScale})^${productionBranchTuning.singularityBonusCurve})\n구매 시 획득 = min(남은 보유 한도, 1+추가 획득)\n공간 팽창 중 모든 효과 비활성 · 기존 영구 기록은 보존`,
  'R은 구매 직전 반지름입니다. 필요 반지름을 충족해 구매할 때만 보너스를 지급하며 블랙홀은 기존대로 한 번 초기화합니다. 영구 기록은 실제 보유량 안에서만 늘어납니다. 기록은 연구를 취소해도 남으며 재연구하면 복구됩니다. 그래프는 필요 반지름 충족 후 실제 보유량 제한 전 기준이며 가로축은 log10(1+R/20)입니다.',
  { xLabel: '반지름 R (log10(1+R/20))', yLabel: '특이점 개수 (보유 한도 적용 전)', min: Math.log10(2), max: 5,
    lines: [
      { label: '영구 저장 한도', color: '#56d364', evaluate: x => Math.floor(productionBranchTuning.reservePerRadiusDecade*x) },
      { label: '구매 시 획득', color: '#59dafd', evaluate: x => 2+Math.floor(productionBranchTuning.singularityBonusStrength*
        Math.log10(1+productionBranchTuning.reserveRadiusScale*(10**x-1)/productionBranchTuning.singularityBonusRadiusScale)**productionBranchTuning.singularityBonusCurve) }
    ] });
registerAbstractionFormula('27-2', `새 블랙홀 시간 가속 상한 = 기존 상한 × ${productionBranchTuning.blackHoleLimitMultiplier}\nCP 배율 = 10^(${productionBranchTuning.blackHoleCpLogStrength} × (log10(1+R)/${productionBranchTuning.blackHoleCpLogScale})^${productionBranchTuning.blackHoleCpCurve})`,
  'R은 현재 슈바르츠실트 반지름입니다. 블랙홀이 비활성화되거나 R이 0이면 CP 배율은 1입니다. CP 획득 배율에 곱하며 고급 CP 거듭제곱은 기존 순서대로 나중에 적용합니다. 가속 상한은 확률자의 기존 확장에 추가로 곱하고 기존 기술적 수치 한도는 유지합니다. 반지름이나 현재 가속을 강제로 늘리지 않습니다. 그래프는 반지름에 따른 CP 배율이며 두 축은 로그 값입니다.',
  formulaChart('반지름 R (log10(1+R))', 'CP 획득 배율 (log10)', 12,
    x => productionBranchTuning.blackHoleCpLogStrength*(x/productionBranchTuning.blackHoleCpLogScale)**productionBranchTuning.blackHoleCpCurve));

const tier28Tuning = ABSTRACTION_TIER28_BALANCE;
const stagnantSingularityGraphLog = s => s < 1 ? 0 : Math.log10(STAGNANT_SINGULARITY_BALANCE.firstMassMg)
  * STAGNANT_SINGULARITY_BALANCE.requirementPower**(Math.floor(s)-1);
const stagnantSingularityFormulaPrefix = `L(S)=S>0이면 ${Math.log10(STAGNANT_SINGULARITY_BALANCE.firstMassMg)}×${STAGNANT_SINGULARITY_BALANCE.requirementPower}^(S-1), 아니면0\n`;
const massExpansionGraphGrowth = s => (stagnantSingularityGraphLog(s) / Math.log10(1 + tier28Tuning.massReferenceMg))**tier28Tuning.massCurve;
registerAbstractionFormula('28-1', stagnantSingularityFormulaPrefix+`F = (L(S)/log10(1+${tier28Tuning.massReferenceMg}))^${tier28Tuning.massCurve}\nE = S>0이면 2^Le, 아니면 1\n특이점 상한 = floor((기본 상한 + 구매 확장량) × (1+${tier28Tuning.singularityLimitStrength}F) × E)\n확률자 추가 상한 확장량 배율 = 10^(${tier28Tuning.timeLimitLogStrength}F) × E\n새 가속 상한 = 기본 가속 상한 × (1 + 기존 확률자 추가 확장량 × 배율) × 27-2 배율`,
  'S는 정체된 특이점 개수, Le는 특이점 효과 강화 구매 횟수입니다. 질량을 소비해도 획득한 S는 유지됩니다. 그래프는 Le=0이며 정수 개수마다 계단식으로 증가합니다. 미연구 또는 S=0이면 기존 값을 유지합니다. 블랙홀 특이점과 현재 가속을 직접 지급하지 않고 상한만 늘리며, 확률자 미해금·무작위력0의 기존 제한도 유지됩니다.',
  { xLabel: '정체된 특이점 S (개)', yLabel: '효과 배율 (log10)', min: 0, max: 8,
    lines: [
      { label: '특이점 상한 배율', color: '#56d364', evaluate: x => Math.log10(1+tier28Tuning.singularityLimitStrength*massExpansionGraphGrowth(x)) },
      { label: '확률자 상한 추가 확장량 배율', color: '#59dafd', evaluate: x => tier28Tuning.timeLimitLogStrength*massExpansionGraphGrowth(x) }
    ] });

const tier24Tuning = ABSTRACTION_TIER24_BALANCE;
registerAbstractionFormula('24-1', `M = 10^(${tier24Tuning.percentLogStrength} × (log10(1+W)/${tier24Tuning.randomPowerLogScale})^${tier24Tuning.percentCurve})\n최종 퍼센트 획득량 = 기존 최종 획득량 × M`,
  'W는 현재 보유 무작위력입니다. 무작위력을 소비하지 않으며 0이면 1배입니다. 소프트캡과 제곱 효과를 반영한 최종 퍼센트 획득량에 한 번 곱합니다. 일반 클릭에는 적용하지 않습니다. 가로축과 세로축은 로그 값입니다.',
  formulaChart('무작위력 W (log10(1+W))', '최종 퍼센트 획득 배율 (log10)', 200,
    x => tier24Tuning.percentLogStrength*(x/tier24Tuning.randomPowerLogScale)**tier24Tuning.percentCurve));

const spaceExtraTuning = SPACE_EXPANSION_EXTRA_BALANCE;
registerFormulaChart('space-expansion', 'penalty_relief',
  `M>10: 약화 배율 = 10^((log10(M))^${spaceExtraTuning.multiplierPower})\nSP 최종 보상 G>1: max(1, log10(G)^${spaceExtraTuning.spLogPower})`,
  '공간 팽창 중에만 적용됩니다. 10 이하 배율과 0~1 SP 보상은 기존대로 유지합니다. 그래프는 공통 배율 압축을 비교하며 두 축 모두 log10(log10(배율))입니다.',
  { xLabel: '원래 배율 (log10(log10(M)))', yLabel: '약화 배율 (log10(log10))', min: 0, max: 200,
    lines: [
      { label: '기존', color: '#89939d', evaluate: x=>x*SPACE_EXPANSION_BALANCE.multiplierPower },
      { label: '완화 후', color: '#56d364', evaluate: x=>x*spaceExtraTuning.multiplierPower }
    ] });
const extraMassFormulaPrefix = stagnantSingularityFormulaPrefix+`F(S,r) = (L(S)/log10(1+r))^${spaceExtraTuning.massCurve}\nE = S>0이면 2^Le, 아니면 1\n`;
for (const [id, reference, strength, exponential, label] of [
  ['mass_percent',spaceExtraTuning.percentMassMg,spaceExtraTuning.percentLogStrength,true,'퍼센트 획득'],
  ['overfeed',spaceExtraTuning.overfeedMassMg,spaceExtraTuning.overfeedStrength,false,'투여 상한'],
  ['group_boost',spaceExtraTuning.groupMassMg,spaceExtraTuning.groupStrength,false,'1/2그룹']
]) {
  const effect = exponential ? `10^(${strength}F(S,${reference}))` : `(1+${strength}F(S,${reference}))`;
  const note = id==='overfeed' ? '25-2가 활성일 때만 투여 상한을 배율합니다. 기본 투여 상한 구매는 계속 최대100%입니다.'
    : id==='group_boost' ? '1그룹의 구매당 배율, 2그룹의 다이슨 확장 추가 개수에 적용합니다. 실제 구매 수와 가격은 유지하고 개수는 최종 버림합니다.'
      : '소프트캡과 생산 거듭제곱 이후의 퍼센트 획득량에 한 번 곱합니다. 일반 클릭에는 적용하지 않습니다. 공간 팽창 중에는 기존 배율 약화 대상입니다.';
  registerFormulaChart('space-expansion', id, extraMassFormulaPrefix+`${label} 배율 M = ${effect}×E`,
    `S는 정체된 특이점 개수, Le는 특이점 효과 ×2의 구매 횟수입니다. 해당 일회성 구매가 필요하며 S=0은1배입니다. 질량 소비로 S는 감소하지 않습니다. 그래프는 Le=0 기준입니다. ${note}`,
    formulaChart('정체된 특이점 S (개)', exponential ? '획득 배율 (log10)' : '효과 배율', 8,
      s=>exponential ? strength*(stagnantSingularityGraphLog(s)/Math.log10(1+reference))**spaceExtraTuning.massCurve
        : 1+strength*(stagnantSingularityGraphLog(s)/Math.log10(1+reference))**spaceExtraTuning.massCurve));
}
registerFormulaChart('space-expansion', 'higgs_slots',
  `추가 슬롯 = floor(${spaceExtraTuning.slotStrength}×(log10(1+H)/${spaceExtraTuning.slotHiggsLogScale})^${spaceExtraTuning.slotCurve})`,
  'H는 보유 힉스입자입니다. 구매 횟수 기반 슬롯과16-2 보정 뒤에 더하고 KC5의1/3 감소는 합계에 적용합니다. 슬롯 가격/구매 수는 바꾸지 않으며 내부 안전 정수 한도는 유지합니다. 힉스 슬롯에는 SM 효과 ×2를 곱하지 않습니다.',
  formulaChart('보유 힉스입자 (log10(1+H))', '추가 슬롯', 60,
    x=>Math.floor(spaceExtraTuning.slotStrength*(x/spaceExtraTuning.slotHiggsLogScale)**spaceExtraTuning.slotCurve)));

const tier23Tuning = ABSTRACTION_TIER23_BALANCE;
registerAbstractionFormula('23-1', `초당 CP = 현재 획득 가능 CP × ${tier23Tuning.passiveCpFraction}`,
  '현실 시간 기준입니다. 시간 가속과 무관하며 SP 소비·수렴 초기화·KC4 감속 초기화를 일으키지 않습니다. 그래프는 획득 가능 CP를 100으로 고정한 누적 생산 예시입니다.',
  formulaChart('현실 시간 (초)', '추가 CP (가능 보상 100 고정)', 300, t => 100*tier23Tuning.passiveCpFraction*t));
registerAbstractionFormula('23-2', `KP 배율 = 10^(${tier23Tuning.randomPowerKpExponent} × (log10(1+W)/${tier23Tuning.randomPowerKpLogScale})^${tier23Tuning.randomPowerKpCurve})`,
  'W는 보유 무작위력입니다. 무작위력이 없으면 1배이며 무작위력을 소비하지 않습니다. 다른 KP 배율에 곱한 뒤 최종 정수로 버립니다. 가로축과 세로축은 로그 값입니다.',
  formulaChart('무작위력 W (log10(1+W))', 'KP 배율 (log10)', 200,
    x => tier23Tuning.randomPowerKpExponent*(x/tier23Tuning.randomPowerKpLogScale)**tier23Tuning.randomPowerKpCurve));
registerAbstractionFormula('23-3', `영구 기록 = max(기존 기록, 커누스 도달 직전 SP × ${tier23Tuning.permanentSpFraction})\n연구 활성 중 SP = max(현재 SP, 영구 기록)\n공간 팽창 중 기록 갱신·최소 보유량 보호·복구 중단 · 기존 기록은 보존`,
  'KP를 받는 커누스 도달에서만 최고 기록을 갱신합니다. 도전 시작·포기·완료에는 기록하지 않습니다. 연구 해제 중에는 최소 보유량 효과가 꺼지지만 기록은 저장되며 다시 연구하면 복구됩니다.',
  formulaChart('커누스 도달 직전 SP', '저장 후보 SP (이전 기록 0)', 10000, sp => sp*tier23Tuning.permanentSpFraction));

registerFormulaChart('knuth', 'dyson_diverger', `발산력 배율 = 10^(${KNUTH_EQUIPMENT_BALANCE.dysonDiverger.logStrength} × (Y/${KNUTH_EQUIPMENT_BALANCE.dysonDiverger.scale}) / max(1,log10(D0)))`,
  'Y는 유효 다이슨 개수, D0는 다이슨 강화 전 발산력입니다. 그래프는 D0=1e141로 고정했습니다. KC1에서는 비활성화됩니다.',
  formulaChart('유효 다이슨 개수 Y', '발산력 배율', 500, x=>10**(KNUTH_EQUIPMENT_BALANCE.dysonDiverger.logStrength*x/KNUTH_EQUIPMENT_BALANCE.dysonDiverger.scale/141)));
for (const [id,source,tuning] of [
  ['accumulated_time_sp','누적 가속 시간 (초)',KNUTH_EQUIPMENT_BALANCE.accumulatedTimeSp],
  ['group_percent_growth','1그룹 총 구매 횟수',KNUTH_EQUIPMENT_BALANCE.groupPercent],
  ['research_resource_growth','구매한 추상화 연구 수',KNUTH_EQUIPMENT_BALANCE.researchResources],
  ['diverger_black_hole','발산력 (log10(1+D))',KNUTH_EQUIPMENT_BALANCE.divergerBlackHole],
  ['achievement_percent_growth','달성한 업적 수',KNUTH_EQUIPMENT_BALANCE.achievementPercent]
]) {
  registerFormulaChart('knuth',id, `${tuning.exponential?'M = 10^':'M = 1 + '}(${tuning.strength} × (X/${tuning.scale})^${tuning.curve})`,
    `X는 ${source}입니다. ${tuning.exponential?'세로축은 배율의 log10 값입니다.':'다른 배율과 별도로 곱합니다.'}`,
    formulaChart(source, tuning.exponential?'획득 배율 (log10)':'배율',tuning.scale*3,
      x=>tuning.exponential?tuning.strength*(x/tuning.scale)**tuning.curve:1+tuning.strength*(x/tuning.scale)**tuning.curve));
}

registerFormulaChart('knuth-base','dyson_limit','추가 다이슨의 다음 가격 = (현재 가격 ×20)^1.01',
  '기존 구매 한도를 넘는 추가 구매분의 가격 상승식입니다. 확장 업그레이드 자체의 KP 가격식은 바꾸지 않습니다.',
  formulaChart('현재 다이슨 가격 (log10 SP)', '다음 가격 (log10 SP)',100,x=>(x+Math.log10(20))*1.01));
registerFormulaChart('knuth-base','overclock_limit','추가 오버클럭의 다음 가격 = (현재 가격 ×기존 상승률)^1.005',
  '기존 구매 한도를 넘는 추가 구매분에 적용합니다. 그래프는 기존 상승률 7/4를 사용한 예시입니다. 확장 업그레이드 자체의 KP 가격식은 바꾸지 않습니다.',
  formulaChart('현재 오버클럭 가격 (log10 SP)', '다음 가격 (log10 SP)',100,x=>(x+Math.log10(7/4))*1.005));

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
  dialog.dataset.theme = ['knuth', 'knuth-base', 'challenge', 'abstraction', 'space-expansion'].includes(category) ? 'green' : 'violet';
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
