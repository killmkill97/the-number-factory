const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function setup() {
  const ctx = game(true);
  ctx.loadSource('function condition(id) { return ACHIEVEMENTS.find(a => a.id === id).condition(); }');
  return ctx;
}

test('new resource milestones include exact mass, random power, CP and layered diverger boundaries', () => {
  const r = run(setup(), `
    const checks=[];
    for(const [id,variable,below,threshold] of [
      ['goodbye_earth','stagnantMassMg','5.9721e30','5.9722e30'],
      ['the_sun','stagnantMassMg','1.98846e36','1.98847e36'],
      ['lucky_seven','randomPower','9.99e69','1e70'],
      ['untitled_achievement_1','squareConvergencePoints','8.99e99900','9e99900'],
      ['has_it_diverged','divergerPower','1e9.99e32','1e1e33']
    ]) {
      if(variable==='stagnantMassMg')stagnantMassMg=NumberMath.fromString(below);
      else if(variable==='randomPower')randomPower=NumberMath.fromString(below);
      else if(variable==='squareConvergencePoints')squareConvergencePoints=NumberMath.fromString(below);
      else divergerPower=NumberMath.fromString(below);
      checks.push(!condition(id));
      if(variable==='stagnantMassMg')stagnantMassMg=NumberMath.fromString(threshold);
      else if(variable==='randomPower')randomPower=NumberMath.fromString(threshold);
      else if(variable==='squareConvergencePoints')squareConvergencePoints=NumberMath.fromString(threshold);
      else divergerPower=NumberMath.fromString(threshold);
      checks.push(condition(id));
    }
    return checks;`);
  assert.deepEqual(r, Array(10).fill(true));
});

test('slots use effective capacity while Dyson and grand theory use actual purchase counts', () => {
  const r = run(setup(), `
    const checks=[];
    abstractionResearchState['16-2']=true;
    knuthOperationLevel=319;checks.push(knuthSlotCapacity()===399&&!condition('four_hundred_slots'));
    knuthOperationLevel=320;checks.push(knuthSlotCapacity()===400&&condition('four_hundred_slots'));
    greatTheory=1000000;totalGreatTheoryPurchased=999999;checks.push(!condition('million_army'));
    totalGreatTheoryPurchased=1000000;greatTheory=0;checks.push(condition('million_army'));
    abstractionDivergerDysonBonus=()=>3000000;
    squareBreakthroughLevels.dyson_swarm=1999999;checks.push(!condition('more_than_oaup'));
    squareBreakthroughLevels.dyson_swarm=2000000;checks.push(condition('more_than_oaup'));
    return checks;`);
  assert.deepEqual(r, Array(6).fill(true));
});

test('win requires actual softened one-click gain at the layered threshold', () => {
  const r = run(setup(), `
    const checks=[];
    perClick=NumberMath.fromString('1e9.99e99');checks.push(!condition('win'));
    perClick=NumberMath.fromString('1e1e100');percentUnlocked=false;checks.push(condition('win'));
    percentUnlocked=true;setBaseNumber('1e1e100');checks.push(!condition('win'));
    return checks;`);
  assert.deepEqual(r, Array(3).fill(true));
});

test('definition space purchase grants its achievement and survives the definition reset and save/load', () => {
  const r = run(setup(), `
    const before=condition('voice_reached_them');
    knuthBaseUpgradeLevels.space_expansion=1;abstractionResearchState['30-1']=true;
    stagnantMassMg=5.9722e30;
    const bought=buySpaceExpansionOneTimeUpgrade('definition_space');updateAchievements();
    definitionStoryStep=DEFINITION_STORY_LINES.length;completeDefinitionStory();
    const saved=captureGameSaveData();loadAchievementState({});
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {before,bought,kept:achievementState.voice_reached_them,
      marker:condition('voice_reached_them'),ui:achievementUi.has('voice_reached_them'),errors};`);
  assert.deepEqual(r,{before:false,bought:true,kept:true,marker:true,ui:true,errors:[]});
});

test('CP milestone is recorded at payout before automation can immediately spend it', () => {
  const r = run(setup(), `
    squareConvergencePoints=NumberMath.fromString('9e99900');recordAchievementConvergence();
    squareConvergencePoints=0;
    const saved=captureGameSaveData();loadAchievementState(saved.achievementState);
    return {earned:achievementState.untitled_achievement_1,current:condition('untitled_achievement_1')};`);
  assert.deepEqual(r,{earned:true,current:false});
});
