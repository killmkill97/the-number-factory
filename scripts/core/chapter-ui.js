function setChapter(id) {
  if (id === 'square' && !squareChapterAvailable()) id = 'multiplication';
  if (id === 'knuth' && !knuthUnlocked) id = squareUnlocked ? 'square' : 'multiplication';
  if (id === 'definition' && !definitionChapterAvailable()) id = 'multiplication';

  activeChapter = id;
  document.body.dataset.chapter = id;
  document.body.classList.toggle('square-mode', id === 'square');
  document.body.classList.toggle('knuth-mode', id === 'knuth');
  document.body.classList.toggle('definition-mode', id === 'definition');
  chapterLabel.textContent = chapterLabelFor(id);

  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  knuthTabBtn.disabled = !knuthUnlocked;
  knuthTabBtn.classList.remove('hidden');
  definitionTabBtn.classList.toggle('hidden', !definitionChapterAvailable());
  multiplicationPanel.classList.toggle('hidden', id !== 'multiplication');
  squarePanel.classList.toggle('hidden', id !== 'square');
  knuthPanel.classList.toggle('hidden', id !== 'knuth');
  definitionPanel.classList.toggle('hidden', id !== 'definition');
  multiplicationTabBtn.classList.toggle('active', id === 'multiplication');
  squareTabBtn.classList.toggle('active', id === 'square');
  knuthTabBtn.classList.toggle('active', id === 'knuth');
  definitionTabBtn.classList.toggle('active', id === 'definition');
  if (id === 'square' && typeof refreshSquareView === 'function') refreshSquareView();
  if (id === 'square' && typeof invalidateSquareControlRender === 'function') {
    invalidateSquareControlRender();
  } else if (typeof render === 'function') {
    render();
  }
}

function squareChapterAvailable() {
  return squareUnlocked || (
    typeof hasKnuthUpgrade === 'function' &&
    hasKnuthUpgrade('permanent_production')
  );
}

function definitionChapterAvailable() {
  return NumberMath.compare(definitionFragments, 1) >= 0;
}

function refreshChapterTabs() {
  if (activeChapter === 'definition' && !definitionChapterAvailable()) {
    setChapter('multiplication');
    return;
  }
  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  knuthTabBtn.disabled = !knuthUnlocked;
  knuthTabBtn.classList.remove('hidden');
  definitionTabBtn.classList.toggle('hidden', !definitionChapterAvailable());
}

multiplicationTabBtn.addEventListener('click', () => setChapter('multiplication'));
squareTabBtn.addEventListener('click', () => setChapter('square'));
knuthTabBtn.addEventListener('click', () => setChapter('knuth'));
definitionTabBtn.addEventListener('click', () => setChapter('definition'));
