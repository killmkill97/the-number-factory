const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');

test('definition purchase starts eleven sequential lines without immediately resetting or granting currency', () => {
  const r = run(game(true), `
    knuthBaseUpgradeLevels.space_expansion=1;abstractionResearchState['30-1']=true;
    stagnantMassMg=1e32;knuthPoints=123;
    const bought=buySpaceExpansionOneTimeUpgrade('definition_space');
    return {bought,step:definitionStoryStep,lines:DEFINITION_STORY_LINES.length,kp:knuthPoints,
      fragments:definitionFragments,twice:buySpaceExpansionOneTimeUpgrade('definition_space')};`);
  assert.deepEqual(r,{bought:true,step:1,lines:11,kp:123,fragments:0,twice:false});
});

test('completion clears the whole Knuth layer and lower progression but keeps achievements and definition history exactly once', () => {
  const r = run(game(true), `
    knuthPoints=1e100;knuthOperationLevel=300;
    for(const u of KNUTH_BASE_UPGRADES)knuthBaseUpgradeLevels[u.id]=1;
    knuthAdvancedOwned.cp_power=2;knuthAdvancedEquipped.cp_power=2;
    for(const r of ABSTRACTION_RESEARCHES)abstractionResearchState[r.id]=true;
    abstractionPermanentSp=1e30;abstractionPermanentSingularities=10;
    automatiumPrestigeRetentionUnlocked=true;greatTheory=1000;higgsParticles=100;stagnantMassMg=1e30;
    singularityPoints=10;randomPower=1e20;completedKnuthChallengeIds.add('kc1');
    squarePoints=1e20;squareConvergencePoints=1e30;theory=100;
    spaceExpansionOneTimeUpgradeState.definition_space=true;
    definitionStoryStep=DEFINITION_STORY_LINES.length;
    achievementState[Object.keys(achievementState)[0]]=true;
    const achievementsBefore=JSON.stringify(captureGameSaveData().achievementState);
    const done=completeDefinitionStory(),twice=completeDefinitionStory();
    return {done,twice,fragments:definitionFragments,completed:definitionStoryCompleted,step:definitionStoryStep,
      kp:knuthPoints,slots:knuthOperationLevel,cp:squareConvergencePoints,sp:squarePoints,n:getBaseNumber(),
      gt:greatTheory,h:higgsParticles,m:stagnantMassMg,s:singularityPoints,random:randomPower,
      upgrades:Object.values(knuthBaseUpgradeLevels).every(v=>v===0),research:Object.values(abstractionResearchState).every(v=>!v),
      owned:knuthAdvancedOwned.cp_power,equipped:knuthAdvancedEquipped.cp_power,challenges:completedKnuthChallengeIds.size,
      marker:hasSpaceExpansionOneTimeUpgrade('definition_space'),
      achievementsKept:achievementsBefore===JSON.stringify(captureGameSaveData().achievementState)};`);
  assert.deepEqual(r,{done:true,twice:false,fragments:1,completed:true,step:0,kp:0,slots:0,cp:0,sp:0,n:0,
    gt:0,h:0,m:0,s:0,random:0,upgrades:true,research:true,owned:0,equipped:0,challenges:0,marker:true,achievementsKept:true});
});

test('saved dialogue resumes, existing story-only purchasers receive dialogue, and completed saves cannot duplicate rewards', () => {
  const r = run(game(true), `
    spaceExpansionOneTimeUpgradeState.definition_space=true;definitionStoryStep=5;
    const saved=captureGameSaveData();loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const resumed=definitionStoryStep;delete saved.definitionStoryStep;delete saved.definitionStoryCompleted;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});const migrated=definitionStoryStep;
    definitionStoryStep=DEFINITION_STORY_LINES.length;completeDefinitionStory();const complete=captureGameSaveData();
    loadGame(JSON.stringify(complete),{persistOverride:false,countAsLoad:false});
    const kept=definitionFragments;loadDefinitionStoryState({});
    return {resumed,migrated,kept,old:definitionFragments,oldStep:definitionStoryStep};`);
  assert.deepEqual(r,{resumed:5,migrated:1,kept:1,old:0,oldStep:1});
});

test('dialogue click reveals text first, then advances, and final click rewards only once', () => {
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/definition-story.js'),'utf8'));
  const r=run(ctx,`spaceExpansionOneTimeUpgradeState.definition_space=true;definitionStoryStep=1;
    renderDefinitionStory();advanceDefinitionStory();const revealed=definitionStoryText.textContent===DEFINITION_STORY_LINES[0];
    const first=definitionStoryStep;advanceDefinitionStory();const next=definitionStoryStep;
    definitionStoryStep=DEFINITION_STORY_LINES.length;renderDefinitionStory();advanceDefinitionStory();advanceDefinitionStory();
    advanceDefinitionStory();return {revealed,first,next,fragments:definitionFragments,step:definitionStoryStep};`);
  assert.deepEqual(r,{revealed:true,first:1,next:2,fragments:1,step:0});
});
