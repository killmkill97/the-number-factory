const ABSTRACTION_TICK_MS = 10;
let abstractionLastTick = gameClockNowMs();

setInterval(() => {
  const { now, elapsedMs } = elapsedRealTimeSince(abstractionLastTick);
  abstractionLastTick = now;
  if (advanceAbstraction(elapsedMs)) render();
}, ABSTRACTION_TICK_MS);
