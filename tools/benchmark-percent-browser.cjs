const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/TOP100/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.join(__dirname, '..');
const shortcut = `    if (typeof exponent === 'number' && Number.isFinite(exponent)
      && Number.isFinite(mantissa) && mantissa > 0) {
      const shift = Math.floor(Math.log10(mantissa));
      const adjustedExponent = exponent + shift;
      if (Number.isFinite(adjustedExponent)) {
        const normalizedMantissa = shift < -308
          ? (mantissa * (10 ** (-shift - 308))) * 1e308
          : mantissa / (10 ** shift);
        return { approximate: true, mantissa: normalizedMantissa, exponent: adjustedExponent };
      }
    }`;
let baseline = false;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)];
    if (baseline && file.endsWith('number-math.js')) {
      data = data.toString().replace(shortcut.replaceAll('\n', '\r\n'), '').replace(shortcut, '');
    }
    res.writeHead(200, { 'Content-Type': type || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const results = [];
    for (const reference of [true, false]) {
      baseline = reference;
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://**/*', route => route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(reference => {
        percentUnlocked = true; squareUnlocked = true;
        for (const id of ['1-1','3-1','4-2','5-2','6-2','8-2','9-2']) abstractionResearchState[id] = true;
        for (const id of ['1-1','3-1','3-3','4-2','5-1','5-3','5-4','6-1','6-2','7-1']) generalizationResearchState[id] = true;
        for (const upgrade of SQUARE_UPGRADES) squareUpgradeState[upgrade.id] = true;
        for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) squareBreakthroughLevels[upgrade.id] = upgrade.max;
        for (const dimension of squareDimensionStates) {
          dimension.x = NumberMath.fromString('1e1000');
          dimension.y = NumberMath.fromString('1e900');
          dimension.z = NumberMath.fromString('1e800');
        }
        divergerPower = NumberMath.fromString('1e1000');
        squarePoints = NumberMath.fromString('1e1000');
        if (reference) {
          percentBatchInvariant = (_key, calculate) => calculate();
          percentUsesWithPoweredGain = (value, power, uses, bonus) => {
            if (!hasAbstractionResearch('9-2')) return percentUsesWithPoweredGainSegment(value, power, uses, bonus);
            const segments = Math.min(PERCENT_USE_BULK_SAMPLE_COUNT, Math.ceil(uses));
            const count = NumberMath.divideApproximate(uses, segments);
            for (let i = 0; i < segments; i++) value = percentUsesWithPoweredGainSegment(value, power, count, bonus);
            return value;
          };
        }
        const times = [];
        let value;
        for (let iteration = 0; iteration < 24; iteration++) {
          setBaseNumber(NumberMath.fromString('1e2000000'));
          const start = performance.now();
          withPercentProductionCache(() => {
            for (let lane = 0; lane < 16; lane++) applyPercentUsesBatch(10000 + lane, 1e12, 'browser-benchmark', 20);
          });
          if (iteration >= 4) times.push(performance.now() - start);
          value = NumberMath.serialize(getBaseNumber());
        }
        times.sort((a,b) => a-b);
        return { baseline: reference, medianMs: times[Math.floor(times.length / 2)], maxMs: times.at(-1), value };
      }, reference);
      assert.deepEqual(errors, []);
      results.push(result);
      await page.close();
    }
    assert.equal(results[0].value, results[1].value);
    console.log(JSON.stringify({ results, speedup: results[0].medianMs / results[1].medianMs, sameOutput: true }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
