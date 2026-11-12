const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.advanced_equipment=1;knuthOperationLevel=300;
    knuthPoints=NumberMath.fromString('1e10000');`);
  return ctx;
}
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('five advanced purchases use their own price progression, divide KP and never equip a purchased copy automatically',()=>{
  const rows=run(ready(),`return KNUTH_ADVANCED_UPGRADES.map(upgrade=>{
    knuthPoints=NumberMath.fromString('1e10000');const cost=logValue(knuthAdvancedUpgradeCost(upgrade.id));
    const bought=buyKnuthAdvancedUpgrade(upgrade.id);
    return {id:upgrade.id,cost,bought,kp:logValue(knuthPoints),next:logValue(knuthAdvancedUpgradeCost(upgrade.id)),
      owned:knuthAdvancedOwned[upgrade.id],equipped:knuthAdvancedEquipped[upgrade.id],slots:upgrade.slots};
  });`);
  const specs=[['cp_power',1000,250,10],['kp_power',1000,400,16],['percent_power',1200,500,16],
    ['random_gain',1200,300,20],['group_effect',1400,320,24]];
  rows.forEach((r,i)=>assert.deepEqual(r,{id:specs[i][0],cost:specs[i][1],bought:true,kp:10000-specs[i][1],
    next:specs[i][1]+specs[i][2],owned:1,equipped:0,slots:specs[i][3]}));
});

test('division supports exact affordability, integer KP and repeated purchases without changing basic high-price rules',()=>{
  assert.deepEqual(run(ready(),`
    knuthPoints=NumberMath.fromString('9e999');const blocked=!buyKnuthAdvancedUpgrade('cp_power');
    knuthPoints=knuthAdvancedUpgradeCost('cp_power');const equal=buyKnuthAdvancedUpgrade('cp_power'),left=plain(knuthPoints);
    knuthPoints=NumberMath.fromString('1e10000');buyKnuthAdvancedUpgrade('cp_power');buyKnuthAdvancedUpgrade('cp_power');
    const next=logValue(knuthAdvancedUpgradeCost('cp_power')),kp=logValue(knuthPoints);
    knuthPoints=multiplyNumberValue(knuthAdvancedUpgradeCost('kp_power'),1.9);buyKnuthAdvancedUpgrade('kp_power');
    return {blocked,equal,left,owned:knuthAdvancedOwned.cp_power,next,kp,integer:plain(knuthPoints),
      invalid:!buyKnuthAdvancedUpgrade('missing'),basicBand:KNUTH_REPEATABLE_COST_BALANCE.kpBandStartExponent};
  `),{blocked:true,equal:true,left:1,owned:3,next:1750,kp:7250,integer:1,invalid:true,basicBand:400});
});

test('unlock and affordability gates prevent spending or equipping, and unequipping never refunds a purchase',()=>{
  assert.deepEqual(run(ready(),`
    const before=NumberMath.serialize(knuthPoints);knuthBaseUpgradeLevels.advanced_equipment=0;
    const locked=!buyKnuthAdvancedUpgrade('cp_power');knuthBaseUpgradeLevels.advanced_equipment=1;
    buyKnuthAdvancedUpgrade('cp_power');changeKnuthAdvancedEquipment('cp_power',true);
    const paid=NumberMath.serialize(knuthPoints);changeKnuthAdvancedEquipment('cp_power',false);
    return {locked,wasSame:before==='1e10000',same:paid===NumberMath.serialize(knuthPoints),owned:knuthAdvancedOwned.cp_power,
      equipped:knuthAdvancedEquipped.cp_power,empty:!changeKnuthAdvancedEquipment('missing',true)};
  `),{locked:true,wasSame:true,same:true,owned:1,equipped:0,empty:true});
});

test('single and Shift equipment share normal slots, allow right-click at capacity and use no per-copy loops',()=>{
  assert.deepEqual(run(ready(),`
    knuthOperationLevel=42;knuthAdvancedOwned.cp_power=100;knuthAdvancedOwned.kp_power=5;
    toggleKnuthUpgrade('knuth_time_gain');changeKnuthAdvancedEquipment('cp_power',true,true);
    const full=[knuthSlotsUsed(),knuthAdvancedEquipped.cp_power];
    const blocked=!changeKnuthAdvancedEquipment('kp_power',true);
    changeKnuthAdvancedEquipment('cp_power',false);const single=knuthAdvancedEquipped.cp_power;
    changeKnuthAdvancedEquipment('cp_power',false,true);
    knuthOperationLevel=1000000000000;knuthAdvancedOwned.cp_power=100000000000;
    changeKnuthAdvancedEquipment('cp_power',true,true);
    const large=knuthAdvancedEquipped.cp_power,runs=knuthEquipmentOrder.length;
    changeKnuthAdvancedEquipment('cp_power',false,true);
    return {full,blocked,single,large,runs,after:knuthSlotsUsed(),owned:knuthAdvancedOwned.cp_power};
  `),{full:[41,4],blocked:true,single:3,large:99999999999,runs:2,after:1,owned:100000000000});
});

test('slot shrink removes the latest mixed normal and advanced runs, not all copies of that type',()=>{
  assert.deepEqual(run(ready(),`
    knuthOperationLevel=100;knuthAdvancedOwned.cp_power=4;knuthAdvancedOwned.random_gain=1;
    changeKnuthAdvancedEquipment('cp_power',true);changeKnuthAdvancedEquipment('random_gain',true);
    toggleKnuthUpgrade('knuth_time_gain');changeKnuthAdvancedEquipment('cp_power',true);
    knuthOperationLevel=21;const removed=trimKnuthEquipmentToCapacity();
    return {removed,cp:knuthAdvancedEquipped.cp_power,random:knuthAdvancedEquipped.random_gain,
      normal:hasKnuthUpgrade('knuth_time_gain'),used:knuthSlotsUsed(),owned:knuthAdvancedOwned.cp_power,order:knuthEquipmentOrder};
  `),{removed:3,cp:1,random:0,normal:false,used:10,owned:4,order:[{kind:'advanced',id:'cp_power',count:1}]});
});

test('CP power composes multiplicatively after the complete reward and feeds real passive CP at one percent',()=>{
  const r=run(ready(),`
    squarePoints=NumberMath.fromString('1e100');const base=squareConvergencePointGain();
    knuthAdvancedOwned.cp_power=2;changeKnuthAdvancedEquipment('cp_power',true,true);
    const actual=squareConvergencePointGain(),effect=plain(knuthAdvancedEffect('cp_power'));
    abstractionResearchState['23-1']=true;advanceAbstraction(1000);
    return {ratio:plain(NumberMath.divideApproximate(actual,NumberMath.power(base,1.03**2))),effect,
      passive:plain(NumberMath.divideApproximate(squareConvergencePoints,actual)),sp:logValue(squarePoints)};
  `);
  close(r.ratio,1);close(r.effect,1.03**2);close(r.passive,.01);close(r.sp,100);
});

test('KP power applies before the last integer floor and preview equals actual subsequent prestige reward',()=>{
  const r=run(ready(),`
    abstractionResearchState['8-1']=true;squareConvergencePoints=NumberMath.fromString('1e6000');
    knuthPoints=0;const base=knuthPointGain();knuthAdvancedOwned.kp_power=2;changeKnuthAdvancedEquipment('kp_power',true,true);
    const preview=knuthPointGain(),expected=NumberMath.floor(NumberMath.power(base,1.05**2));beginKnuthPrestige();
    const same=compareNumberValues(knuthPoints,preview)===0;
    hasClaimedKnuthPoint=false;return {ratio:plain(NumberMath.divideApproximate(preview,expected)),same,first:plain(knuthPointGain())};
  `);
  close(r.ratio,1);assert.ok(r.same);assert.equal(r.first,1);
});

test('saved KP equipment uses the new exponent without changing counts, slots or prices',()=>{
  const r=run(ready(),`
    knuthAdvancedOwned.kp_power=5;changeKnuthAdvancedEquipment('kp_power',true,true);
    const saved=captureGameSaveData();
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,owned:knuthAdvancedOwned.kp_power,equipped:knuthAdvancedEquipped.kp_power,
      effect:plain(knuthAdvancedEffect('kp_power')),slots:knuthSlotsUsed(),cost:logValue(knuthAdvancedUpgradeCost('kp_power')),
      description:KNUTH_ADVANCED_UPGRADES.find(u=>u.id==='kp_power').description,errors};
  `);
  close(r.effect,1.05**5);
  assert.match(r.description,/30개.*31개째.*1.2제곱/);
  assert.deepEqual({...r,effect:undefined,description:undefined},{loaded:true,owned:5,equipped:5,effect:undefined,slots:80,cost:3000,
    description:undefined,errors:[]});
});

test('fractional percent exponent affects manual and cached automatic gains after singularity and other gear, without changing the softcap',()=>{
  for(const k of [1,2])for(const q of [1,2,4,8]){
    const r=run(ready(),`
      percentUnlocked=true;singularityPoints=2;percentPowerSoftcapDecayPower=()=>${k};
      abstractionResearchState['8-2']=${q>=4};if(${q%4===2||q===8})knuthEquippedUpgradeIds.add('percent_gain_square');
      knuthEquippedUpgradeIds.add('group_percent_growth');knuthBaseUpgradeLevels.cp_gain=5;
      knuthAdvancedOwned.percent_power=2;const rows=[];
      for(const text of ['10000','1e50','1e1000000001']){
        const value=NumberMath.fromString(text),cap=NumberMath.serialize(percentPowerSoftcap(10));
        const gain=percentFinalUseGain(value,10);changeKnuthAdvancedEquipment('percent_power',true,true);
        const expected=NumberMath.power(gain,1.05**2),actual=percentFinalUseGain(value,10);
        setBaseNumber(value);applyPercentUse(value,10,'test');
        rows.push({log:plain(NumberMath.subtract(NumberMath.log10(actual),NumberMath.log10(expected))),
          manualLog:plain(NumberMath.subtract(NumberMath.log10(getBaseNumber()),NumberMath.log10(addBaseNumbers(value,expected)))),
          cap:cap===NumberMath.serialize(percentPowerSoftcap(10))});
        changeKnuthAdvancedEquipment('percent_power',false,true);
      }
      return {rows,other:plain(finalNumberProductionGain(10,1,10000))};
    `);
    r.rows.forEach(row=>{close(row.log,0,1e-5);close(row.manualLog,0,1e-5);assert.ok(row.cap);});assert.equal(r.other,10);
  }
});

test('powered percent bulk stays bounded and matches sequential integration within its approximation tolerance',()=>{
  for(const k of [1,2]){
    const r=run(ready(),`
      percentUnlocked=true;knuthAdvancedOwned.percent_power=3;changeKnuthAdvancedEquipment('percent_power',true,true);
      percentPowerSoftcap=()=>100;percentPowerSoftcapDecayPower=()=>${k};percentUseGain=value=>multiplyNumberValue(value,.01);
      let sequential=120;for(let i=0;i<1000;i++)sequential=percentUseValueAfterOne(sequential,1);
      setBaseNumber(120);applyPercentUsesBatch(1,1000,'test');
      const ratio=plain(NumberMath.divideApproximate(getBaseNumber(),sequential));
      applyPercentUsesBatch(1,1e30,'test');return {ratio,positive:isPositiveNumberValue(getBaseNumber()),power:percentProductionExponent()};
    `);close(r.ratio,1,.02);assert.ok(r.positive);close(r.power,1.05**3);
  }
});

test('random power gain multiplies the actual accumulated rolls, never the roll positions or previous balance',()=>{
  const r=run(ready(),`
    knuthBaseUpgradeLevels.probabilizer=1;knuthAdvancedOwned.random_gain=3;
    const before=advanceProbabilizer(1000,()=>.5);const first=randomPower,roll=probabilizerLastRoll;
    randomPower=0;changeKnuthAdvancedEquipment('random_gain',true,true);advanceProbabilizer(1000,()=>.5);
    return {before,ratio:plain(NumberMath.divideApproximate(randomPower,first)),sameRoll:roll===probabilizerLastRoll};
  `);assert.equal(r.before,1);close(r.ratio,1.05**3);assert.ok(r.sameRoll);
});

test('group amplification modifies the per-purchase factor before 22-2 and keeps actual levels and prices unchanged',()=>{
  const r=run(ready(),`
    knuthBaseUpgradeLevels.cp_gain=3;knuthAdvancedOwned.group_effect=2;
    const quote=NumberMath.serialize(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES.find(u=>u.id==='cp_gain')));
    changeKnuthAdvancedEquipment('group_effect',true,true);
    const factor=plain(knuthBaseEffectPerPurchase('cp_gain',25));abstractionResearchState['11-1']=true;
    abstractionResearchState['22-2']=true;const total=knuthBaseMultiplier('cp_gain',25);
    const same=quote===NumberMath.serialize(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES.find(u=>u.id==='cp_gain')));
    activeKnuthChallengeId='kc5';return {factor,log:logValue(total),same,level:knuthBaseUpgradeLevel('cp_gain'),
      disabled:plain(knuthBaseMultiplier('cp_gain',25)),cpEffect:plain(knuthAdvancedEffect('group_effect'))};
  `);close(r.factor,25*1.04**2);close(r.log,Math.log10(31.25*1.04**2)*6);
  assert.ok(r.same);assert.equal(r.level,3);assert.equal(r.disabled,1);close(r.cpEffect,1.04**2);
});

test('owned items and price levels survive prestige/challenges while the shared reset toggle only clears equipment',()=>{
  assert.deepEqual(run(ready(),`
    buyKnuthAdvancedUpgrade('cp_power');changeKnuthAdvancedEquipment('cp_power',true);beginKnuthPrestige();
    const kept=knuthAdvancedEquipped.cp_power;knuthResetEquipmentOnNextPrestige=true;beginKnuthPrestige();
    const cleared=knuthAdvancedEquipped.cp_power,owned=knuthAdvancedOwned.cp_power;
    changeKnuthAdvancedEquipment('cp_power',true);startKnuthChallenge('kc5');
    const during=knuthAdvancedEquipped.cp_power,effect=plain(knuthAdvancedEffect('cp_power'));
    abandonKnuthChallenge();return {kept,cleared,owned,during,effect,after:knuthAdvancedEquipped.cp_power,next:logValue(knuthAdvancedUpgradeCost('cp_power'))};
  `),{kept:1,cleared:0,owned:1,during:1,effect:1.03,after:1,next:1250});
});

test('save/load roundtrips counts and shared ordering, trims overflow and resets missing old-save fields safely',()=>{
  assert.deepEqual(run(ready(),`
    knuthAdvancedOwned.cp_power=3;knuthAdvancedOwned.random_gain=1;
    changeKnuthAdvancedEquipment('cp_power',true,true);toggleKnuthUpgrade('knuth_time_gain');changeKnuthAdvancedEquipment('random_gain',true);
    const saved=captureGameSaveData();saved.knuthOperationLevel=31;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const shrunk={cp:knuthAdvancedEquipped.cp_power,random:knuthAdvancedEquipped.random_gain,normal:hasKnuthUpgrade('knuth_time_gain'),used:knuthSlotsUsed()};
    const owned=knuthAdvancedOwned.cp_power;delete saved.knuthAdvancedOwned;delete saved.knuthAdvancedEquipped;delete saved.knuthEquipmentOrder;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,shrunk,owned,legacy:KNUTH_ADVANCED_UPGRADES.every(u=>knuthAdvancedOwned[u.id]===0&&knuthAdvancedEquipped[u.id]===0),errors};
  `),{loaded:true,shrunk:{cp:3,random:0,normal:true,used:31},owned:3,legacy:true,errors:[]});
});

test('invalid counts/order cannot create free copies, exceed holdings or hang capacity repair',()=>{
  assert.deepEqual(run(ready(),`
    const saved=captureGameSaveData();saved.knuthOperationLevel=30;
    saved.knuthAdvancedOwned={cp_power:2,kp_power:-1,random_gain:1.2,percent_power:Number.MAX_SAFE_INTEGER,unknown:50};
    saved.knuthAdvancedEquipped={cp_power:10,kp_power:10,percent_power:Number.MAX_SAFE_INTEGER};
    saved.knuthEquipmentOrder=[{kind:'advanced',id:'missing',count:10},null,{kind:'normal',id:'knuth_time_gain',count:1}];
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {cp:knuthAdvancedOwned.cp_power,kp:knuthAdvancedOwned.kp_power,random:knuthAdvancedOwned.random_gain,
      fits:knuthSlotsUsed()<=knuthSlotCapacity(),bounded:knuthEquipmentOrder.length<=2,errors};
  `),{cp:2,kp:0,random:0,fits:true,bounded:true,errors:[]});
});

test('inventory controls remain enabled at capacity, use Shift/secondary clicks and keep stable DOM cards',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  assert.deepEqual(run(ctx,`
    knuthOperationLevel=20;knuthAdvancedOwned.cp_power=4;renderKnuthAdvancedEquipment();
    const ui=knuthAdvancedUpgradeUi.get('cp_power'),button=ui.inventory.button;
    button.events.click({shiftKey:true});renderKnuthAdvancedEquipment();const full=!button.disabled&&knuthAdvancedEquipped.cp_power===2;
    const precise=ui.inventory.status.textContent.includes('^1.0609');
    let prevented=false;button.events.contextmenu({shiftKey:false,preventDefault(){prevented=true;}});
    const single=knuthAdvancedEquipped.cp_power;button.events.contextmenu({shiftKey:true,preventDefault(){}});
    renderKnuthAdvancedEquipment();return {full,precise,prevented,single,empty:knuthAdvancedEquipped.cp_power===0,
      stable:button===knuthAdvancedUpgradeUi.get('cp_power').inventory.button,cards:knuthAdvancedUpgradeUi.size};
  `),{full:true,precise:true,prevented:true,single:1,empty:true,stable:true,cards:5});
  assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/<strong>구매 시 KP에서 가격을 빼지 않고, 보유 KP를 가격으로 나눕니다\.<\/strong>/);
});

test('a real advanced right-click counts as manual gameplay only when there is equipment to remove',()=>{
  assert.deepEqual(run(ready(),`
    const button={disabled:false,id:'',dataset:{knuthAdvancedUpgrade:'cp_power'},matches:selector=>selector.includes('.knuth-upgrade'),closest:()=>null};
    const event={type:'contextmenu',isTrusted:true,shiftKey:false,target:{closest:()=>button}};
    knuthAdvancedOwned.cp_power=1;changeKnuthAdvancedEquipment('cp_power',true);
    achievementRunProgress.manualGameplay=false;recordAchievementPlayerAction({...event,isTrusted:false});
    const synthetic=!achievementRunProgress.manualGameplay;recordAchievementPlayerAction(event);const actual=achievementRunProgress.manualGameplay;
    changeKnuthAdvancedEquipment('cp_power',false);achievementRunProgress.manualGameplay=false;recordAchievementPlayerAction(event);
    return {synthetic,actual,empty:!achievementRunProgress.manualGameplay};
  `),{synthetic:true,actual:true,empty:true});
});
