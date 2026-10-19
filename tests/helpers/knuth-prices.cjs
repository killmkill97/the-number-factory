function repeatablePriceLog(baseCost, growth, purchases) {
  let logarithm = Math.log10(baseCost);
  let count = 0;
  while (count < purchases && logarithm < 308 + Math.log10(1.8)) {
    logarithm += Math.log10(growth * (logarithm >= 50 ? 2 : 1));
    count++;
  }
  return logarithm + (purchases - count) * Math.log10(growth * 8);
}

function operationPriceLog(level) {
  let logarithm = 0;
  for (let purchase = 2; purchase <= Math.min(level + 1, 300); purchase++) {
    logarithm += Math.log10(purchase <= 100 ? 2 : purchase <= 200 ? 4 : 8);
  }
  return logarithm + Math.max(0, level - 299) * Math.log10(8);
}

module.exports = { repeatablePriceLog, operationPriceLog };
