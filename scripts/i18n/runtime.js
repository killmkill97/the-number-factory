(() => {
  const preferenceKey = 'numberTycoonLanguage_v1';
  const hangul = /[\uac00-\ud7a3\u3131-\u318e]/;
  const dictionaries = new Map();
  const patterns = [];
  const patternBuckets = new Map();
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const cache = new Map();
  const misses = new Set();
  const conflicts = [];
  const protectedSelector = 'script,style,textarea,input,[contenteditable="true"],[data-i18n-skip],'
    + '#authProfileName,#authProfileEmail,#automatiumCaretMirror,.automatium-program-list-name,.automatium-quick-name';
  const protectedAttributes = '[data-i18n-skip],#authProfileName,#authProfileEmail,'
    + '.automatium-program-list-name,.automatium-quick-name';
  const attributes = ['title', 'aria-label', 'placeholder', 'alt'];
  const normalize = value => String(value).replace(/\s+/g, ' ').trim();
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let language = 'en';
  let fragments = null;
  let observer = null;
  let initialized = false;
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === 'ko' || saved === 'en') language = saved;
  } catch { /* Private browsing can make preferences read-only. */ }

  function patternWords(value) {
    return [...new Set((value.match(/[\uac00-\ud7a3]+/g) || []).map(word => word.slice(0, 2)))];
  }

  function register(entries) {
    for (const [source, english] of entries) {
      const key = normalize(source);
      if (!key || typeof english !== 'string') continue;
      if (dictionaries.has(key)) {
        if (dictionaries.get(key) !== english) conflicts.push({source:key, existing:dictionaries.get(key), english});
        continue;
      }
      dictionaries.set(key, english);
      if (!/\{\d+\}/.test(key)) continue;
      const captures = [], protectedCaptures = new Set();
      let offset = 0, expression = '^';
      for (const match of key.matchAll(/\{(\d+)\}/g)) {
        expression += escapeRegExp(key.slice(offset, match.index)) + '(.*?)';
        captures.push(match[1]);
        const before = key[match.index - 1], after = key[match.index + match[0].length];
        if ((before === "'" || before === '"') && before === after) protectedCaptures.add(match[1]);
        offset = match.index + match[0].length;
      }
      expression += escapeRegExp(key.slice(offset)) + '$';
      const prefix = key.split(/\{\d+\}/)[0];
      const inline = hangul.test(key) && prefix.trim().length >= 2
        ? new RegExp(expression.slice(1,-1) + (/\{\d+\}$/.test(key) ? '(?=$|\\s*·)' : ''), 'g') : null;
      const record = {source:key, english, captures, protectedCaptures, inline, expression:new RegExp(expression),
        specificity:key.replace(/\{\d+\}/g, '').length};
      patterns.push(record);
      const words = patternWords(key);
      for (const word of words) {
        if (!patternBuckets.has(word)) patternBuckets.set(word, []);
        patternBuckets.get(word).push(record);
      }
    }
    fragments = null;
    cache.clear();
  }

  function translate(source, depth = 0) {
    const original = String(source ?? '');
    if (language === 'ko' || !hangul.test(original) || depth > 5) return original;
    const key = normalize(original);
    if (!key) return original;
    if (cache.has(original)) return cache.get(original);
    let result = dictionaries.get(key);
    if (result === undefined) {
      const candidates = new Set();
      for (const word of patternWords(key)) for (const record of patternBuckets.get(word) || []) candidates.add(record);
      for (const record of [...candidates].sort((a,b) => b.specificity - a.specificity)) {
        const match = record.expression.exec(key);
        if (!match) continue;
        const values = new Map(record.captures.map((id,index) => [id,
          record.protectedCaptures.has(id) ? match[index + 1] : translate(match[index + 1], depth + 1)]));
        result = record.english.replace(/\{(\d+)\}/g, (token,id) => values.get(id) ?? token);
        break;
      }
    }
    if (result === undefined) {
      let composed = key;
      const inlineCandidates = new Set();
      for (const word of patternWords(key)) for (const record of patternBuckets.get(word) || []) {
        if (record.inline) inlineCandidates.add(record);
      }
      for (const record of [...inlineCandidates].sort((a,b) => b.specificity - a.specificity)) {
        composed = composed.replace(record.inline, (...match) => {
          const values = new Map(record.captures.map((id,index) => [id,
            record.protectedCaptures.has(id) ? match[index + 1] : translate(match[index + 1], depth + 1)]));
          return record.english.replace(/\{(\d+)\}/g, (token,id) => values.get(id) ?? token);
        });
      }
      if (!fragments) {
        const keys = [...dictionaries.keys()].filter(value => hangul.test(value)
          && !/[{}<>\n]/.test(value) && value.length <= 220).sort((a,b) => b.length - a.length);
        fragments = keys.length ? new RegExp(keys.map(key =>
          (hangul.test(key[0]) ? '(?<![\\uac00-\\ud7a3])' : '') + escapeRegExp(key)
          + (hangul.test(key[key.length - 1]) ? '(?![\\uac00-\\ud7a3])' : '')).join('|'), 'g') : /$^/g;
      }
      result = composed.replace(fragments, value => dictionaries.get(value));
    }
    if (hangul.test(result) && misses.size < 512) misses.add(key);
    const leading = original.match(/^\s*/)[0], trailing = original.match(/\s*$/)[0];
    const output = leading + result + trailing;
    cache.set(original, output);
    if (cache.size > 4096) cache.delete(cache.keys().next().value);
    return output;
  }

  function translateTextNode(node) {
    const element = node.parentElement;
    if (!element || element.closest(protectedSelector)) return;
    const current = node.nodeValue ?? '';
    const saved = textSources.get(node);
    const source = saved && current === saved.output ? saved.source : current;
    const isProgram = element.closest('pre code') && /\/\/|\/\*/.test(source);
    const output = isProgram ? translateCode(source) : translate(source);
    textSources.set(node, {source, output});
    if (current !== output) node.nodeValue = output;
  }

  function translateCode(source) {
    return String(source).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, comment => translate(comment));
  }

  function translateElement(element) {
    if (element.closest(protectedAttributes)) return;
    let saved = attributeSources.get(element);
    if (!saved) { saved = new Map();attributeSources.set(element, saved); }
    for (const name of attributes) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const previous = saved.get(name);
      const source = previous && current === previous.output ? previous.source : current;
      const output = translate(source);
      saved.set(name, {source, output});
      if (current !== output) element.setAttribute(name, output);
    }
    if (element.tagName === 'IMG') {
      const current = element.getAttribute('src') || '';
      if (/assets\/formula-graphs\//.test(current)) {
        const source = current.replace(/(assets\/formula-graphs\/)en\//, '$1');
        const output = language === 'en' ? source.replace('assets/formula-graphs/', 'assets/formula-graphs/en/') : source;
        if (current !== output) element.setAttribute('src', output);
      }
    }
  }

  function apply(root = document.documentElement) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root);return; }
    if (root.nodeType === 1) {
      translateElement(root);
      if (root.matches(protectedSelector)) return;
    }
    const walker = document.createTreeWalker(root, 5);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) translateTextNode(node);
      else translateElement(node);
    }
  }

  function setLanguage(next, {persist = true} = {}) {
    if (!['en', 'ko'].includes(next)) return false;
    language = next;
    cache.clear();
    if (persist) try { localStorage.setItem(preferenceKey, language); } catch { /* Keep the current session usable. */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      const selector = document.getElementById('languageSelect');
      if (selector) selector.value = language;
      apply();
      window.dispatchEvent(new CustomEvent('numbertycoon:languagechange', {detail:{language}}));
    }
    return true;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    document.documentElement.lang = language;
    const selector = document.getElementById('languageSelect');
    if (selector) {
      selector.value = language;
      selector.addEventListener('change', () => setLanguage(selector.value));
    }
    apply();
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(records => {
        const roots = new Set();
        for (const record of records) {
          if (record.type === 'childList') for (const node of record.addedNodes) roots.add(node);
          else roots.add(record.target);
        }
        for (const root of roots) if (root.isConnected) apply(root);
      });
      observer.observe(document.documentElement, {childList:true, subtree:true, characterData:true,
        attributes:true, attributeFilter:attributes.concat('src')});
    }
  }

  window.NumberTycoonI18n = {register, text:translate, code:translateCode, apply, setLanguage,
    getLanguage:() => language, initialize, preferenceKey,
    diagnostics:() => ({missing:[...misses],conflicts:[...conflicts],entries:dictionaries.size,patterns:patterns.length})};
  register([
    ['언어', 'Language'],['게임 언어','Game language'],['영어','English'],
    ['숫자의 끝을 보는 타이쿤 - 프로토타입','Number Tycoon: To the End of Numbers - Prototype']
  ]);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true});
    else initialize();
    for (const method of ['alert','confirm','prompt']) {
      if (typeof window[method] !== 'function') continue;
      const native = window[method].bind(window);
      window[method] = (message, ...rest) => native(translate(message), ...rest);
    }
    window.addEventListener('storage', event => {
      if (event.key === preferenceKey) setLanguage(event.newValue === 'ko' ? 'ko' : 'en', {persist:false});
    });
  }
})();
