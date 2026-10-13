const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function run(source) {
  const game = vm.createContext({performance:{now:()=>0}});
  for (const file of ['constants.js','number-math.js','state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/core',file),'utf8'),game);
  }
  vm.runInContext('render=()=>{};knuthUnlocked=true;',game);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`,game)));
}

test('tier 9 researches require their own tier 8 parent and each cost four Great Theory', () => {
  assert.deepEqual(run(`
    greatTheory=8;
    const locked=['9-1','9-2'].map(canResearchAbstraction);
    abstractionResearchState['8-1']=true;
    const firstOnly=['9-1','9-2'].map(canResearchAbstraction);
    const first=researchAbstraction('9-1');
    abstractionResearchState['8-2']=true;
    const second=researchAbstraction('9-2');
    return {locked,firstOnly,first,second,balance:NumberMath.toNumber(greatTheory),repeat:researchAbstraction('9-1')};
  `),{locked:[false,false],firstOnly:[true,false],first:true,second:true,balance:0,repeat:false});
});

test('current-stage anchors give eightfold rewards and zero currencies give neutral rewards', () => {
  const data=run(`
    abstractionResearchState['9-1']=true;abstractionResearchState['9-2']=true;
    const zero=[abstractionKpCpGainMultiplier(),abstractionNumberPercentMultiplier(0)].map(NumberMath.toNumber);
    knuthPoints=13;
    const cp=NumberMath.toNumber(abstractionKpCpGainMultiplier());
    const percent=NumberMath.toNumber(abstractionNumberPercentMultiplier(NumberMath.fromString('1e2000000')));
    const observed=NumberMath.toNumber(abstractionNumberPercentMultiplier(NumberMath.fromString('9.58e1970000')));
    return {zero,cp,percent,observed};
  `);
  assert.deepEqual(data.zero,[1,1]);
  assert.ok(Math.abs(data.cp-8)<1e-12);
  assert.ok(Math.abs(data.percent-8)<1e-12);
  assert.ok(data.observed>7.9&&data.observed<8);
});

test('9-1 multiplies actual CP rewards independently of the older diverger research', () => {
  const data=run(`
    squarePoints=NumberMath.fromString('1e45');knuthPoints=13;
    const before=squareConvergencePointGain();
    abstractionResearchState['9-1']=true;
    const after=squareConvergencePointGain();
    return {ratio:NumberMath.toNumber(NumberMath.divideApproximate(after,before)),oldResearch:hasAbstractionResearch('5-2')};
  `);
  assert.equal(data.oldResearch,false);
  assert.ok(Math.abs(data.ratio-8)<1e-10);
});

test('9-2 applies to final percent gain after the fourth power, not to its base', () => {
  const data=run(`
    percentUnlocked=true;abstractionResearchState['8-2']=true;
    const value=NumberMath.fromString('1e2000000');
    const raw=percentUseGain(value,1,0);
    const before=finalNumberProductionGain(raw,1,value,1,0,4);
    abstractionResearchState['9-2']=true;
    const after=finalNumberProductionGain(raw,percentPreExponentMultiplier(value),value,1,0,4);
    const otherBefore=finalNumberProductionGain(1000,1,NumberMath.fromString('1e13'),1,0);
    return {ratio:NumberMath.toNumber(NumberMath.divideApproximate(after,before)),other:NumberMath.toNumber(otherBefore)};
  `);
  assert.ok(Math.abs(data.ratio-8)<1e-6);
  assert.equal(data.other,10);
});

test('both curves grow monotonically with diminishing gains and accept layered currencies', () => {
  const data=run(`
    abstractionResearchState['9-1']=true;abstractionResearchState['9-2']=true;
    const cp=[0,13,26,39].map(value=>{knuthPoints=value;return NumberMath.toNumber(abstractionKpCpGainMultiplier());});
    const percent=[0,2000000,4000000,6000000].map(log=>NumberMath.toNumber(abstractionNumberPercentMultiplier(NumberMath.powerOfTen(log))));
    knuthPoints=NumberMath.fromString('1e1e100');
    const hugeCp=abstractionKpCpGainMultiplier();
    const hugePercent=abstractionNumberPercentMultiplier(NumberMath.fromString('1e1e100'));
    return {cp,percent,hugeCp:isPositiveNumberValue(hugeCp),hugePercent:isPositiveNumberValue(hugePercent)};
  `);
  for(const values of [data.cp,data.percent]){
    const gains=values.slice(1).map((value,index)=>value-values[index]);
    assert.ok(gains[0]>gains[1]&&gains[1]>gains[2]&&gains[2]>0);
  }
  assert.equal(data.hugeCp,true);assert.equal(data.hugePercent,true);
});

test('number-dependent bulk rewards remain close to sequential uses and bounded at huge speed', () => {
  for(const strength of [1,2]){
    const data=run(`
      percentUnlocked=true;abstractionResearchState['8-2']=true;abstractionResearchState['9-2']=true;
      ABSTRACTION_TIER9_BALANCE.percentFromNumber.scale=2;
      percentPowerSoftcap=()=>100;percentPowerSoftcapDecayPower=()=>${strength};
      let calls=0;
      percentUseGain=value=>{calls++;return multiplyNumberValue(value,0.01);};
      let sequential=100;
      for(let i=0;i<1000;i++)sequential=percentUseValueAfterOne(sequential,1,0);
      setBaseNumber(100);applyPercentUsesBatch(1,1000,'bulk-test',0);
      const ratio=NumberMath.toNumber(NumberMath.divideApproximate(getBaseNumber(),sequential));
      calls=0;setBaseNumber(100);applyPercentUsesBatch(1,1e100,'huge-bulk-test',0);
      return {ratio,calls,positive:isPositiveNumberValue(getBaseNumber())};
    `);
    assert.ok(Math.abs(data.ratio-1)<0.01,JSON.stringify({strength,...data}));
    assert.ok(data.calls<200);assert.equal(data.positive,true);
  }
});

test('tier 9 flags persist through saving and Knuth reset and default to false for old saves', () => {
  assert.deepEqual(run(`
    abstractionResearchState['9-1']=true;abstractionResearchState['9-2']=true;
    const saved=JSON.parse(JSON.stringify({...abstractionResearchState}));
    loadAbstractionResearchState(saved);
    extraPercentLanesEl={innerHTML:''};resetProgressForNewKnuthRun();
    const restored=['9-1','9-2'].map(hasAbstractionResearch);
    loadAbstractionResearchState({});
    return {restored,legacy:['9-1','9-2'].map(hasAbstractionResearch)};
  `),{restored:[true,true],legacy:[false,false]});
});
