function setChapter(id) {
  if (id === 'square' && !squareChapterAvailable()) id = 'multiplication';
  if (id === 'knuth' && !knuthUnlocked) id = squareUnlocked ? 'square' : 'multiplication';

  activeChapter = id;
  document.body.dataset.chapter = id;
  document.body.classList.toggle('square-mode', id === 'square');
  document.body.classList.toggle('knuth-mode', id === 'knuth');
  chapterLabel.textContent = chapterLabelFor(id);

  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  knuthTabBtn.disabled = !knuthUnlocked;
  knuthTabBtn.classList.remove('hidden');
  multiplicationPanel.classList.toggle('hidden', id !== 'multiplication');
  squarePanel.classList.toggle('hidden', id !== 'square');
  knuthPanel.classList.toggle('hidden', id !== 'knuth');
  multiplicationTabBtn.classList.toggle('active', id === 'multiplication');
  squareTabBtn.classList.toggle('active', id === 'square');
  knuthTabBtn.classList.toggle('active', id === 'knuth');
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

function refreshChapterTabs() {
  chapterTabs.classList.remove('hidden');
  squareTabBtn.disabled = !squareChapterAvailable();
  knuthTabBtn.disabled = !knuthUnlocked;
  knuthTabBtn.classList.remove('hidden');
}

multiplicationTabBtn.addEventListener('click', () => setChapter('multiplication'));
squareTabBtn.addEventListener('click', () => setChapter('square'));
knuthTabBtn.addEventListener('click', () => setChapter('knuth'));
