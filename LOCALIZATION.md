# Localization

## Runtime

- English (`en`) is the default. Settings also offers Korean (`ko`).
- The explicit preference is stored separately in `numberTycoonLanguage_v1` in browser local storage. It does not change the game save format or cloud save.
- `scripts/i18n/runtime.js` loads before the game, followed by the generated `catalog-en.js`.
- Korean remains the source language of game data. The display layer translates text, accessibility labels, placeholders, dialogs, and formula graph images.
- Source text is retained per DOM node so switching back to Korean is reversible. A bounded translation cache and indexed template lookup handle changing numeric values.
- User program names, preset names, profile information, editable code, and input values are not translated. N keywords, upgrade IDs, save IDs, and formula calculations remain unchanged.
- Built-in N examples translate comments only. Existing programs are not rewritten.

## Editing Translations

Edit the `en-*` source catalogs in `scripts/i18n`, not `catalog-en.js`:

- `en-progression.js`: currencies, progression, upgrades, research, and challenges.
- `en-interface.js`: controls, settings, status, and dialogs.
- `en-narrative.js`: achievements, hints, news, and Definition dialogue.
- `en-automation.js`: N reference, examples, and automation messages.
- `en-formulas.js`: formula help and graph labels.
- `en-supplement*.js`: additional complete phrases and dynamic templates.

Each entry is `[Korean source, English target]`. Dynamic values use `{0}`, `{1}`, etc. Preserve all placeholders and mathematical expressions. Add full assembled phrases when text is built from multiple source fragments. Earlier duplicate keys win; avoid conflicting translations.

Rebuild after editing catalogs or source SVG labels:

```powershell
node tools/build-localization.cjs
node --test tests/localization.test.cjs
```

The build consolidates the catalog and creates `assets/formula-graphs/en/*.svg`. English graphs preserve the original numeric paths and only replace text labels. No external translation service is called at runtime.

## Verification

```powershell
node tools/localization-catalog.cjs
node tools/preview-localization.cjs
```

The first command audits Korean source coverage. The preview runs at `http://localhost:8765/tests/localization-preview.html` with memory-only storage, no Firebase, no session/main loop, and disabled recurring timers. Its QA controls change only the isolated fixture. Remove the generated preview HTML after browser checks.

`NumberTycoonI18n.diagnostics()` reports uncataloged text and conflicts for development. Static inventory coverage alone cannot catch every dynamically assembled sentence, so also check rendered late-game descriptions, English/Korean switching, long names, and mobile layout.

When adding features, keep achievement/news identity separate from displayed translated text. Typewriter dialogue must localize the complete line before revealing characters. English-only research-card layout rules keep long descriptions inside fixed tree nodes.
