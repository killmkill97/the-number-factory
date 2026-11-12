window.addEventListener('numbertycoon:languagechange', () => {
  if (typeof renderAchievements === 'function') renderAchievements();
  if (typeof renderAbstractionPresetBoard === 'function') renderAbstractionPresetBoard();
});
