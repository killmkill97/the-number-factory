const definitionStoryPanel = document.getElementById('definitionStoryPanel');
const definitionStoryText = document.getElementById('definitionStoryText');
let definitionVisibleStep = 0;
let definitionVisibleCharacters = 0;
let definitionTypingTimer = null;

function localizedDefinitionStoryLine() {
  const source = DEFINITION_STORY_LINES[definitionStoryStep - 1];
  return source ? window.NumberTycoonI18n?.text(source) ?? source : '';
}

function positionDefinitionStory() {
  const quick = document.getElementById('automatiumQuickPanel');
  const bottom = quick && !quick.classList.contains('hidden')
    ? Math.max(14, window.innerHeight - quick.getBoundingClientRect().top + 10) : 14;
  definitionStoryPanel.style.bottom = `${bottom}px`;
}

function typeDefinitionStory() {
  const line = localizedDefinitionStoryLine();
  if (!line) return;
  definitionVisibleCharacters = Math.min(line.length, definitionVisibleCharacters + 1);
  definitionStoryText.textContent = line.slice(0, definitionVisibleCharacters);
  if (definitionVisibleCharacters < line.length) definitionTypingTimer = setTimeout(typeDefinitionStory, 28);
}

function renderDefinitionStory() {
  definitionStoryPanel.classList.toggle('hidden', definitionStoryStep === 0);
  if (definitionStoryStep) positionDefinitionStory();
  if (definitionStoryStep === definitionVisibleStep) return;
  clearTimeout(definitionTypingTimer);
  definitionVisibleStep = definitionStoryStep;
  definitionVisibleCharacters = 0;
  definitionStoryText.textContent = '';
  if (definitionStoryStep) {
    typeDefinitionStory();
  }
}

function advanceDefinitionStory() {
  if (!definitionStoryStep || gameSessionPaused()) return;
  const line = localizedDefinitionStoryLine();
  clearTimeout(definitionTypingTimer);
  if (definitionVisibleCharacters < line.length) {
    definitionVisibleCharacters = line.length;
    definitionStoryText.textContent = line;
    return;
  }
  if (definitionStoryStep < DEFINITION_STORY_LINES.length) definitionStoryStep++;
  else if (completeDefinitionStory()) {
    document.body.classList.remove('definition-rebirth');
    void document.body.offsetWidth;
    document.body.classList.add('definition-rebirth');
    setTimeout(() => document.body.classList.remove('definition-rebirth'), 1000);
  }
  renderDefinitionStory();
}

definitionStoryPanel.addEventListener('click', advanceDefinitionStory);
definitionStoryPanel.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    advanceDefinitionStory();
  }
});
window.addEventListener('resize', positionDefinitionStory);
window.addEventListener('numbertycoon:languagechange', () => {
  if (!definitionStoryStep) return;
  definitionVisibleStep = 0;
  renderDefinitionStory();
});
