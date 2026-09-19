function setChapter(id) {
  if (id === 'square' && !squareChapterAvailable()) id = 'multiplication';
  if (id === 'kunuth' && !kunuthUnlocked) id = squareUnlocked ? 'square' : 'multiplication';

  activeChapter = id;
  document.body.dataset.chapter = id;
  document.body.classList.toggle('square-mode', id === 'square');
  document.body.classList.toggle('kunuth-mode', id === 'kunuth');
  chapterLabel.textContent = chapterLabelFor(id);

  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  kunuthTabBtn.disabled = !kunuthUnlocked;
  kunuthTabBtn.classList.remove('hidden');
  multiplicationPanel.classList.toggle('hidden', id !== 'multiplication');
  squarePanel.classList.toggle('hidden', id !== 'square');
  kunuthPanel.classList.toggle('hidden', id !== 'kunuth');
  multiplicationTabBtn.classList.toggle('active', id === 'multiplication');
  squareTabBtn.classList.toggle('active', id === 'square');
  kunuthTabBtn.classList.toggle('active', id === 'kunuth');
  if (id === 'square' && typeof refreshSquareView === 'function') refreshSquareView();
}

function squareChapterAvailable() {
  return squareUnlocked || (
    typeof hasKunuthUpgrade === 'function' &&
    hasKunuthUpgrade('permanent_production')
  );
}

function refreshChapterTabs() {
  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  kunuthTabBtn.disabled = !kunuthUnlocked;
  kunuthTabBtn.classList.remove('hidden');
}

multiplicationTabBtn.addEventListener('click', () => setChapter('multiplication'));
squareTabBtn.addEventListener('click', () => setChapter('square'));
kunuthTabBtn.addEventListener('click', () => setChapter('kunuth'));
