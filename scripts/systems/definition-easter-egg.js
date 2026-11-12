(() => {
  const card = document.getElementById('definitionContentCard');
  const audio = document.getElementById('definitionEasterEggAudio');
  const overlay = document.getElementById('definitionEasterEggOverlay');
  const flames = document.getElementById('definitionEasterEggFlames');
  const fadeDurationMs = 2300;
  let phase = 'idle';
  let timer = null;
  let flameFrame = null;
  let flameSprite = null;

  function flameTexture() {
    if (flameSprite) return flameSprite;
    flameSprite = document.createElement('canvas');
    flameSprite.width = flameSprite.height = 64;
    const brush = flameSprite.getContext('2d');
    const texture = brush.createImageData(64, 64);
    const hash = (x, y) => {
      const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const noise = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
      const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
      return top * (1 - sy) + bottom * sy;
    };
    // Bake a small turbulent fire texture once; frames only reuse this bitmap.
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const turbulence = 0.6 * noise(x / 7.5, y / 7.5)
        + 0.3 * noise(x / 3.5, y / 3.5) + 0.1 * noise(x / 1.5, y / 1.5);
      const field = 1 - Math.hypot(x - 32, y - 32) / 30.5 + (turbulence - 0.5) * 0.75;
      if (field <= 0) continue;
      const heat = Math.max(0, Math.min(1, field * 1.4 + turbulence * 0.45 - 0.2));
      const pixel = (y * 64 + x) * 4;
      texture.data[pixel] = Math.min(255, 120 + heat * 260);
      texture.data[pixel + 1] = Math.max(8, Math.min(245, heat * heat * 300));
      texture.data[pixel + 2] = Math.max(0, (heat - 0.65) * 450);
      texture.data[pixel + 3] = Math.min(1, field * 9) * 255;
    }
    brush.putImageData(texture, 0, 0);
    return flameSprite;
  }

  function startFlames() {
    const brush = flames.getContext('2d');
    if (!brush) return;
    const bounds = overlay.getBoundingClientRect();
    const scale = Math.min(1.25, 1280 / Math.max(1, bounds.width, bounds.height));
    flames.width = Math.max(1, Math.round(bounds.width * scale));
    flames.height = Math.max(1, Math.round(bounds.height * scale));
    const width = flames.width, height = flames.height;
    const reach = Math.hypot(width, height) * 0.6;
    const sprite = flameTexture();
    const started = performance.now();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    function draw(now) {
      flameFrame = null;
      const elapsedProgress = Math.min(1, Math.max(0, (now - started) / fadeDurationMs));
      const progress = reducedMotion ? 0.2 + 0.18 * elapsedProgress : elapsedProgress;
      const seconds = (now - started) / 1000 * (reducedMotion ? 0.5 : 1);
      brush.clearRect(0, 0, width, height);
      if (phase !== 'visual' || elapsedProgress >= 1) return;
      brush.globalCompositeOperation = 'source-over';
      // A bounded ring of overlapping fire plumes expands out of the screen center.
      for (let index = 0; index < 64; index++) {
        const angle = index * 2.3999632297 + 0.16 * progress * Math.sin(seconds * 9 + index * 1.7);
        const variation = 0.8 + 0.2 * Math.sin(index * 13.7);
        const distance = reach * Math.pow(progress, 0.75) * variation;
        const size = Math.min(width, height) * (0.08 + 0.21 * Math.sin(Math.PI * progress))
          * (0.7 + 0.3 * Math.cos(index * 7.3))
          * (1 + (reducedMotion ? 0.1 : 0.18) * Math.sin(seconds * 17 + index));
        const x = width / 2 + Math.cos(angle) * distance;
        const y = height / 2 + Math.sin(angle) * distance;
        brush.globalAlpha = Math.pow(1 - elapsedProgress, 0.6) * (reducedMotion ? 0.55 : 0.95);
        brush.save();
        brush.translate(x, y);
        brush.rotate(angle + seconds * 0.8);
        brush.drawImage(sprite, -size * 0.9, -size * 0.6, size * 1.8, size * 1.2);
        brush.restore();
      }
      brush.globalAlpha = (1 - elapsedProgress) * (reducedMotion ? 0.2 : 0.9);
      brush.strokeStyle = '#ffd06a';
      brush.lineWidth = Math.max(1, width / 700);
      brush.beginPath();
      for (let index = 0; index < 36; index++) {
        const angle = index * Math.PI / 18 + 0.3;
        const distance = reach * progress * (0.85 + 0.15 * Math.cos(index * 11));
        const tail = Math.max(0, distance - 26 * scale);
        brush.moveTo(width / 2 + Math.cos(angle) * tail, height / 2 + Math.sin(angle) * tail);
        brush.lineTo(width / 2 + Math.cos(angle) * distance, height / 2 + Math.sin(angle) * distance);
      }
      brush.stroke();
      brush.globalAlpha = 1;
      flameFrame = requestAnimationFrame(draw);
    }
    draw(started);
  }

  function setPhase(value) {
    phase = value;
    card.dataset.easterEggState = value;
    card.setAttribute('aria-busy', String(value !== 'idle'));
  }

  function stop() {
    clearTimeout(timer);
    if (flameFrame !== null) cancelAnimationFrame(flameFrame);
    flameFrame = null;
    audio.pause();
    audio.currentTime = 0;
    overlay.classList.add('hidden');
    overlay.classList.remove('is-fading');
    setPhase('idle');
  }

  function showPicture() {
    setPhase('visual');
    overlay.classList.remove('hidden');
    // Commit the visible starting opacity before beginning the immediate fade.
    overlay.getBoundingClientRect();
    overlay.classList.add('is-fading');
    startFlames();
    timer = setTimeout(stop, fadeDurationMs);
  }

  card.addEventListener('click', () => {
    if (phase !== 'idle' || activeChapter !== 'definition' || !definitionChapterAvailable()) return;
    audio.currentTime = 0;
    try {
      const playback = audio.play();
      if (playback) playback.catch(() => {});
    } catch {
      // The visual still runs when the browser cannot play the audio.
    }
    showPicture();
  });
  overlay.addEventListener('transitionend', event => {
    if (event.target === overlay && event.propertyName === 'opacity' && phase === 'visual') stop();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && phase !== 'idle') stop();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && phase !== 'idle') stop();
  });
  window.addEventListener('pagehide', stop);
  setPhase('idle');
})();
