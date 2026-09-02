function setChapter(id) {
  let enteredSquareBreakthroughNow = false;
  if (id === 'square' && !squareUnlocked) id = 'multiplication';
  if (id === 'square-breakthrough' && !canOpenSquareBreakthrough()) id = squareUnlocked ? 'square' : 'multiplication';
  if (id === 'square-convergence' && !canOpenSquareConvergence()) id = squareUnlocked ? 'square' : 'multiplication';
  if (id === 'tetration' && !isTetrationAvailable()) id = squareUnlocked ? 'square' : 'multiplication';
  if (id === 'square-breakthrough' && !squareBreakthroughEntered) {
    squareBreakthroughEntered = true;
    enteredSquareBreakthroughNow = true;
  }
  activeChapter = id;

  document.body.dataset.chapter = id;
  document.body.classList.toggle('square-mode', id === 'square' || id === 'square-breakthrough' || id === 'square-convergence');
  document.body.classList.toggle('tetration-mode', id === 'tetration');
  chapterLabel.textContent = chapterLabelFor(id);

  chapterTabs.classList.toggle('hidden', !squareUnlocked && !isTetrationAvailable());
  squareBreakthroughTabBtn.classList.toggle('hidden', !canOpenSquareBreakthrough());
  squareConvergenceTabBtn.classList.toggle('hidden', !canOpenSquareConvergence());
  tetrationTabBtn.classList.toggle('hidden', !isTetrationAvailable());
  multiplicationPanel.classList.toggle('hidden', id !== 'multiplication');
  squarePanel.classList.toggle('hidden', id !== 'square');
  squareBreakthroughPanel.classList.toggle('hidden', id !== 'square-breakthrough');
  squareConvergencePanel.classList.toggle('hidden', id !== 'square-convergence');
  tetrationPanel.classList.toggle('hidden', id !== 'tetration');
  multiplicationTabBtn.classList.toggle('active', id === 'multiplication');
  squareTabBtn.classList.toggle('active', id === 'square');
  squareBreakthroughTabBtn.classList.toggle('active', id === 'square-breakthrough');
  squareConvergenceTabBtn.classList.toggle('active', id === 'square-convergence');
  tetrationTabBtn.classList.toggle('active', id === 'tetration');
  if (enteredSquareBreakthroughNow && typeof render === 'function') render();
}

multiplicationTabBtn.addEventListener('click', () => setChapter('multiplication'));
squareTabBtn.addEventListener('click', () => setChapter('square'));
squareBreakthroughTabBtn.addEventListener('click', () => setChapter('square-breakthrough'));
squareConvergenceTabBtn.addEventListener('click', () => setChapter('square-convergence'));
tetrationTabBtn.addEventListener('click', () => setChapter('tetration'));
