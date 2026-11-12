const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('removed advanced mass upgrade is absent, and legacy saves cannot restore its effect', () => {
  const row = run(game(true), `
    knuthUnlocked=true;hasClaimedKnuthPoint=true;
    knuthBaseUpgradeLevels.advanced_equipment=1;
    knuthAdvancedOwned.cp_power=2;knuthAdvancedEquipped.cp_power=2;
    knuthAdvancedOwned.percent_power=2;knuthAdvancedEquipped.percent_power=2;
    const legacy=captureGameSaveData();legacy.spaceExpansionOneTimeUpgradeState.advanced_boost=true;
    const loaded=loadGame(JSON.stringify(legacy),{persistOverride:false,countAsLoad:false});
    knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthBaseUpgradeLevels.advanced_equipment=1;
    knuthAdvancedOwned.cp_power=2;knuthAdvancedEquipped.cp_power=2;
    knuthAdvancedOwned.percent_power=2;knuthAdvancedEquipped.percent_power=2;
    const copy=KNUTH_ADVANCED_UPGRADES.find(item=>item.id==='cp_power');
    const fresh=captureGameSaveData();
    return {
      loaded,
      upgradeListed:SPACE_EXPANSION_ONE_TIME_UPGRADES.some(item=>item.id==='advanced_boost'),
      stateHasLegacyKey:Object.prototype.hasOwnProperty.call(spaceExpansionOneTimeUpgradeState,'advanced_boost'),
      legacyActive:hasSpaceExpansionOneTimeUpgrade('advanced_boost'),
      multiplierHelper:typeof spaceExpansionAdvancedMultiplier,
      savedLegacyKey:Object.prototype.hasOwnProperty.call(fresh.spaceExpansionOneTimeUpgradeState,'advanced_boost'),
      copy:plain(knuthAdvancedEffectPerCopy(copy)),
      equippedCp:plain(knuthAdvancedEffect('cp_power')),
      percentExponent:knuthAdvancedPercentPower()
    };
  `);
  assert.equal(row.loaded,true);
  assert.equal(row.upgradeListed,false);
  assert.equal(row.stateHasLegacyKey,false);
  assert.equal(row.legacyActive,false);
  assert.equal(row.multiplierHelper,'undefined');
  assert.equal(row.savedLegacyKey,false);
  assert.equal(row.copy,1.03);
  assert.ok(Math.abs(row.equippedCp-1.03**2)<1e-12);
  assert.ok(Math.abs(row.percentExponent-1.05**2)<1e-12);
});
