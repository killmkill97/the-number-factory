const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const hangul = /[\uac00-\ud7a3\u3131-\u318e]/;
const normalize = text => String(text).replace(/\s+/g, ' ').trim();
const decode = text => text.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_,name) =>
  ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",nbsp:' '})[name]);

function files(directory) {
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry => entry.isDirectory()
    ? files(path.join(directory,entry.name)) : [path.join(directory,entry.name)]);
}

function loadCatalog() {
  const context = vm.createContext({window:{}});
  const base = ['en-progression.js','en-interface.js','en-narrative.js','en-automation.js','en-formulas.js'];
  const extra = fs.readdirSync(path.join(root,'scripts/i18n')).filter(file => /^en-supplement.*\.js$/.test(file)).sort();
  for (const file of ['runtime.js',...base,...extra]) {
    const filename = path.join(root,'scripts/i18n',file);
    if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename:file});
  }
  return context.window.NumberTycoonI18n;
}

function inventory() {
  const acornModule = {exports:{}};
  vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],
    {module:acornModule,exports:acornModule.exports});
  const {parse} = acornModule.exports;
  const entries = new Map();
  function add(raw,file,line) {
    const source = normalize(decode(raw));
    if (!source || !hangul.test(source)) return;
    if (!entries.has(source)) entries.set(source,{source,locations:[]});
    entries.get(source).locations.push({file,line});
  }
  function parts(text,file,line) {
    const markup = /<\/?[a-z][^>]*>/i.test(text);
    if (!markup) {add(text,file,line);return;}
    for (const run of text.split(/<\/?[a-z][^>]*>/i)) add(run,file,line);
    for (const attribute of text.matchAll(/(?:aria-label|title|placeholder|alt)=["']([^"']*)["']/g)) add(attribute[1],file,line);
  }
  for (const filename of files(path.join(root,'scripts')).filter(file => /\.js$/.test(file)
    && !file.includes(path.sep+'i18n'+path.sep) && !file.includes(path.sep+'archive'+path.sep))) {
    const file = path.relative(root,filename).replace(/\\/g,'/');
    const ast = parse(fs.readFileSync(filename,'utf8'),{ecmaVersion:'latest',sourceType:'module',locations:true});
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'Literal' && typeof node.value === 'string') parts(node.value,file,node.loc.start.line);
      if (node.type === 'TemplateLiteral') parts(node.quasis.map((q,i) => (q.value.cooked ?? q.value.raw)
        + (i < node.expressions.length ? `{${i}}` : '')).join(''),file,node.loc.start.line);
      for (const [name,value] of Object.entries(node)) {
        if (name === 'loc') continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
  }
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  parts(html,'index.html',1);
  for (const filename of files(path.join(root,'assets/formula-graphs')).filter(file => /\.svg$/.test(file) && !file.includes(path.sep+'en'+path.sep))) {
    const file = path.relative(root,filename).replace(/\\/g,'/');
    for (const text of fs.readFileSync(filename,'utf8').matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) parts(text[1],file,1);
  }
  return [...entries.values()];
}

if (require.main === module) {
  const catalog = loadCatalog();
  const missing = inventory().map(entry => ({...entry,translation:catalog.text(entry.source)}))
    .filter(entry => hangul.test(entry.translation));
  console.log(JSON.stringify({inventory:inventory().length,missing:missing.length,
    diagnostics:catalog.diagnostics(),entries:missing},null,2));
}
module.exports = {root,hangul,normalize,decode,files,loadCatalog,inventory};
