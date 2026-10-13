import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'assets', 'formula-graphs');
const width = 960;
const height = 560;
const plot = { left: 84, right: 32, top: 28, bottom: 86 };
const plotWidth = width - plot.left - plot.right;
const plotHeight = height - plot.top - plot.bottom;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

function coordinateX(value, spec) {
  if (spec.xScale === 'log1p') {
    return Math.log1p(value) / Math.log1p(spec.max);
  }
  if (spec.xScale === 'log10') {
    return Math.log10(value / spec.min) / Math.log10(spec.max / spec.min);
  }
  return (value - spec.min) / (spec.max - spec.min);
}

function coordinateY(value, spec) {
  if (spec.yScale === 'log10') {
    return (Math.log10(value) - Math.log10(spec.yMin))
      / (Math.log10(spec.yMax) - Math.log10(spec.yMin));
  }
  return (value - spec.yMin) / (spec.yMax - spec.yMin);
}

function sampleLine(line, spec) {
  const commands = [];
  const count = 1200;
  for (let index = 0; index <= count; index++) {
    const ratio = index / count;
    const x = spec.xAtRatio
      ? spec.xAtRatio(ratio)
      : spec.xScale === 'log10'
        ? spec.min * (spec.max / spec.min) ** ratio
        : spec.min + (spec.max - spec.min) * ratio;
    const y = line.evaluate(x);
    const px = plot.left + coordinateX(x, spec) * plotWidth;
    const py = plot.top + (1 - coordinateY(y, spec)) * plotHeight;
    commands.push(`${index === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  return commands.join(' ');
}

function renderChart(spec) {
  const yTicks = spec.yTicks.map(tick => {
    const y = plot.top + (1 - coordinateY(tick.value, spec)) * plotHeight;
    return `<g><line class="grid" x1="${plot.left}" x2="${width - plot.right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"/><text class="tick" x="${plot.left - 12}" y="${(y + 5).toFixed(2)}" text-anchor="end">${escapeXml(tick.label)}</text></g>`;
  }).join('');
  const xTicks = spec.xTicks.map(tick => {
    const x = plot.left + coordinateX(tick.value, spec) * plotWidth;
    return `<g><line class="grid vertical" x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${plot.top}" y2="${height - plot.bottom}"/><text class="tick" x="${x.toFixed(2)}" y="${height - plot.bottom + 24}" text-anchor="middle">${escapeXml(tick.label)}</text></g>`;
  }).join('');
  const lines = spec.lines.map((line, index) => {
    const color = line.color ?? ['#c99dff', '#56d364', '#59dafd'][index % 3];
    return `<path class="curve" stroke="${color}" d="${sampleLine(line, spec)}"/>`;
  }).join('');
  const legend = spec.lines.length > 1
    ? `<g transform="translate(${plot.left + 12} ${plot.top + 18})">${spec.lines.map((line, index) => {
      const color = line.color ?? ['#c99dff', '#56d364', '#59dafd'][index % 3];
      const y = index * 24;
      return `<g transform="translate(0 ${y})"><line x1="0" x2="28" y1="0" y2="0" stroke="${color}" stroke-width="4"/><text class="legend" x="38" y="5">${escapeXml(line.label)}</text></g>`;
    }).join('')}</g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(spec.ariaLabel)}">
  <style>
    text{font-family:system-ui,'Malgun Gothic',sans-serif}.background{fill:#151c24}.grid{stroke:#303a44;stroke-width:1}.grid.vertical{opacity:.48}.axis{stroke:#98a4b1;stroke-width:1.5}.tick,.axis-label,.legend{fill:#b8c3ce}.tick{font-size:13px}.axis-label{font-size:15px}.legend{font-size:13px}.curve{fill:none;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
  </style>
  <rect class="background" width="${width}" height="${height}" rx="5"/>
  ${yTicks}${xTicks}
  <line class="axis" x1="${plot.left}" x2="${plot.left}" y1="${plot.top}" y2="${height - plot.bottom}"/>
  <line class="axis" x1="${plot.left}" x2="${width - plot.right}" y1="${height - plot.bottom}" y2="${height - plot.bottom}"/>
  ${lines}${legend}
  <text class="axis-label" x="${plot.left + plotWidth / 2}" y="${height - 18}" text-anchor="middle">${escapeXml(spec.xLabel)}</text>
  <text class="axis-label" x="22" y="${plot.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 22 ${plot.top + plotHeight / 2})">${escapeXml(spec.yLabel)}</text>
</svg>`;
}

const longMaxLog10 = Math.log10(9223372036854775807);
const spThresholdExponent = longMaxLog10 * 2400;
const graphs = [
  {
    file: 'percent-softcap.svg', ariaLabel: '소프트캡 초과 비율에 따른 생산 배율',
    xLabel: '현재 수 / 소프트캡 S', yLabel: '생산 배율 M', min: 0, max: 10,
    yMin: 0, yMax: 1, yTicks: [0, 0.25, 0.5, 0.75, 1].map(value => ({ value, label: `${Math.round(value * 100)}%` })),
    xTicks: [0, 1, 2, 4, 6, 8, 10].map(value => ({ value, label: `${value}×` })),
    lines: [
      { label: '기본 K=2', color: '#c99dff', evaluate: ratio => ratio <= 1 ? 1 : (1 / ratio) ** 2 },
      { label: '퍼센트 효율 개선 K=1', color: '#56d364', evaluate: ratio => ratio <= 1 ? 1 : 1 / ratio }
    ]
  },
  {
    file: 'generalization-5-2.svg', ariaLabel: '수에 따른 제곱 포인트 획득량',
    xLabel: '수 (log₁₀ 축)', yLabel: '기본 SP (log₁₀ 축)', min: spThresholdExponent, max: spThresholdExponent + 9600,
    yScale: 'log10', yMin: 1, yMax: 10000,
    yTicks: [1, 10, 100, 1000, 10000].map(value => ({ value, label: value >= 1000 ? `${value / 1000}k` : String(value) })),
    xTicks: [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
      value: spThresholdExponent + 9600 * ratio,
      label: (spThresholdExponent + 9600 * ratio).toFixed(0)
    })),
    lines: [{
      color: '#c99dff',
      evaluate: log10Number => 10 ** Math.max(0, log10Number / 2400 - longMaxLog10)
    }]
  },
  {
    file: 'knuth-time-value.svg', ariaLabel: '제곱 진행 시간에 따른 SP와 CP 배율',
    xLabel: '제곱 진행 시간 T (초)', yLabel: 'SP / CP 배율', min: 0, max: 3600,
    yMin: 1, yMax: 61,
    xTicks: [0, 600, 1200, 1800, 2400, 3000, 3600].map(value => ({ value, label: String(value) })),
    yTicks: [1, 16, 31, 46, 61].map(value => ({ value, label: String(value) })),
    lines: [{ color: '#56d364', evaluate: seconds => 1 + Math.sqrt(seconds) }]
  },
  {
    file: 'knuth-continuous.svg', ariaLabel: '레인별 퍼센트 구매 횟수에 따른 누적 추가 파워',
    xLabel: '레인별 구매 횟수 x', yLabel: '누적 추가 퍼센트 파워 (%)', min: 0, max: 10000,
    yMin: 0, yMax: 20,
    xTicks: [0, 1000, 2000, 5000, 10000].map(value => ({ value, label: String(value) })),
    yTicks: [0, 5, 10, 15, 20].map(value => ({ value, label: `${value}%` })),
    lines: [{
      color: '#56d364',
      evaluate: count => 20 * count / (count + 1000)
    }]
  },
  {
    file: 'knuth-repeat-discount.svg', ariaLabel: '반복 퍼센트 구매 횟수에 따른 로그 가격 할인율',
    xLabel: '레인별 구매 횟수 N', yLabel: '로그 가격 할인율 (%)', min: 0, max: 20000,
    yMin: 0, yMax: 50,
    xTicks: [0, 2000, 4000, 10000, 20000].map(value => ({ value, label: String(value) })),
    yTicks: [0, 12.5, 25, 37.5, 50].map(value => ({ value, label: `${value}%` })),
    lines: [{ color: '#56d364', evaluate: count => 50 * (1 - 20 ** (-count / 2000)) }]
  },
  {
    file: 'knuth-percent-overflow.svg', ariaLabel: '누적 퍼센트 오버플로우에 따른 SP와 CP 배율',
    xLabel: '누적 오버플로우 O', yLabel: 'SP / CP 배율', min: 0, max: 1000000,
    yMin: 1, yMax: 12,
    xTicks: [0, 100000, 300000, 500000, 700000, 1000000].map(value => ({ value, label: value === 0 ? '0' : `${value / 10000}만` })),
    yTicks: [1, 4, 7, 10, 12].map(value => ({ value, label: String(value) })),
    lines: [{ color: '#56d364', evaluate: overflow => 1 + 3 * Math.log2(1 + overflow / 100000) }]
  },
  {
    file: 'knuth-time-discount.svg', ariaLabel: '제곱 진행 시간에 따른 로그 가격 할인율',
    xLabel: '제곱 진행 시간 T (분)', yLabel: '로그 가격 할인율 (%)', min: 0, max: 30,
    yMin: 0, yMax: 90,
    xTicks: [0, 5, 10, 15, 20, 25, 30].map(value => ({ value, label: String(value) })),
    yTicks: [0, 30, 60, 85.5, 90].map(value => ({ value, label: `${value}%` })),
    lines: [{ color: '#56d364', evaluate: minutes => 90 * (1 - 20 ** (-(minutes * 60) / 300)) }]
  },
  {
    file: 'knuth-kc1.svg', ariaLabel: '보유 CP에 따른 KC1 SP 획득 배율',
    xLabel: '보유 CP (log₁₀ 축)', yLabel: 'SP 획득 배율', min: 1, max: 1e12,
    xScale: 'log10', yMin: 1, yMax: 12,
    xTicks: [1, 10, 1e3, 1e6, 1e9, 1e12].map(value => ({ value, label: value === 1 ? '1' : `1e${Math.log10(value)}` })),
    yTicks: [1, 3, 6, 9, 12].map(value => ({ value, label: String(value) })),
    lines: [{ color: '#56d364', evaluate: cp => Math.max(1, Math.log10(cp)) }]
  },
  {
    file: 'knuth-kc2.svg', ariaLabel: '보유 KP에 따른 KC2 CP 획득 배율',
    xLabel: '보유 KP (log₁₀(1+KP) 축)', yLabel: 'CP 획득 배율 (log₁₀ 축)', min: 0, max: 1e6,
    xScale: 'log1p', xAtRatio: ratio => 10 ** (Math.log10(1000001) * ratio) - 1,
    yScale: 'log10', yMin: 1, yMax: 240000,
    xTicks: [0, 1, 1000, 10000, 100000, 1000000].map(value => ({ value, label: value === 0 ? '0' : value >= 1000 ? `${value / 1000}k` : String(value) })),
    yTicks: [1, 10, 1000, 10000, 100000, 240000].map(value => ({ value, label: value >= 1000 ? `${Math.round(value / 1000)}k` : String(value) })),
    lines: [{
      color: '#56d364',
      evaluate: kp => 1 + (100000 * Math.log1p(kp / 100000))
    }]
  },
  {
    file: 'knuth-kc3.svg', ariaLabel: '보유 이론에 따른 KC3 퍼센트 획득 배율',
    xLabel: '보유 이론 x', yLabel: '퍼센트 획득 배율 M (log₁₀ 축)', min: 0, max: 30,
    yScale: 'log10', yMin: 1, yMax: 1e300,
    xTicks: [0, 5, 10, 15, 20, 25, 30].map(value => ({ value, label: String(value) })),
    yTicks: [1, 1e60, 1e120, 1e180, 1e240, 1e300].map(value => ({ value, label: value === 1 ? '1' : `1e${Math.log10(value)}` })),
    lines: [{ color: '#56d364', evaluate: theory => theory <= 1 ? 1 : 640 ** (theory * Math.log(theory)) }]
  }
];

fs.mkdirSync(outputDir, { recursive: true });
for (const graph of graphs) {
  fs.writeFileSync(path.join(outputDir, graph.file), renderChart(graph), 'utf8');
}
console.log(`Generated ${graphs.length} static formula graphs in ${path.relative(root, outputDir)}.`);
