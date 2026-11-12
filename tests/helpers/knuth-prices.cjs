function repeatablePriceGrowthLog(logarithm, growth) {
  const tier = logarithm >= 308 + Math.log10(1.8) ? 8 : logarithm >= 50 ? 2 : 1;
  const band = logarithm >= 400 ? Math.floor((logarithm - 400) / 100) + 1 : 0;
  return Math.log10(growth * tier) * 4**band;
}

function repeatablePriceLogLog(baseCost, growth, purchases) {
  let logarithm = Math.log10(baseCost);
  let count = 0;
  while (count < purchases && Number.isFinite(logarithm)) {
    const reference = Math.log10(baseCost) + count * Math.log10(growth);
    logarithm += repeatablePriceGrowthLog(reference, growth);
    count++;
  }
  if (count === purchases) return Math.log10(1 + logarithm);
  return Infinity;
}

function repeatablePriceLog(baseCost, growth, purchases) {
  return 10 ** repeatablePriceLogLog(baseCost, growth, purchases) - 1;
}

function operationPriceLog(level) {
  let logarithm = 0;
  for (let purchase = 2; purchase <= Math.min(level + 1, 300); purchase++) {
    logarithm += Math.log10(purchase <= 100 ? 2 : purchase <= 200 ? 4 : 8);
  }
  return logarithm + Math.max(0, level - 299) * Math.log10(8);
}

module.exports = { repeatablePriceLog, repeatablePriceLogLog, repeatablePriceGrowthLog, operationPriceLog };
