import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { renderChart } from './generate-formula-graphs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ performance: { now: () => 0 }, document: { getElementById: () => null } });
for (const file of ['core/constants.js','core/number-math.js','core/state.js','systems/formula-help.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,'scripts',file),'utf8'),context,{filename:file});
}

function tickLabel(value) {
  if (Math.abs(value)>=1e5 || (value!==0 && Math.abs(value)<0.001)) return value.toExponential(1);
  return String(Number(value.toPrecision(4)));
}

export function completeChartSpec(spec) {
  const values=spec.lines.flatMap(line=>Array.from({length:1201},(_,i)=>line.evaluate(spec.min+(spec.max-spec.min)*i/1200)));
  if (!values.every(Number.isFinite)) throw Error(`Non-finite graph: ${spec.file}`);
  const minimum=Math.min(0,...values), maximum=Math.max(...values);
  const yMin=minimum, yMax=maximum>minimum?maximum+(maximum-minimum)*0.04:minimum+1;
  return { ...spec, yMin, yMax,
    xTicks:Array.from({length:5},(_,i)=>{
      const value=spec.min+(spec.max-spec.min)*i/4;return {value,label:tickLabel(value)};
    }),
    yTicks:Array.from({length:5},(_,i)=>{
      const value=yMin+(yMax-yMin)*i/4;return {value,label:tickLabel(value)};
    })
  };
}

const graphs=vm.runInContext('Object.values(FORMULA_HELP_CHARTS)',context);
const output=path.join(root,'assets/formula-graphs');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(output,{recursive:true});
  for (const spec of graphs) fs.writeFileSync(path.join(output,spec.file),renderChart(completeChartSpec(spec)),'utf8');
  console.log(`Generated ${graphs.length} research/equipment formula graphs.`);
}
