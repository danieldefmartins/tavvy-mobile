const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const i18next = require('i18next');
const ROOT = path.resolve(__dirname, '../..');
const languages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'ar', 'tr', 'hi', 'id', 'th', 'vi', 'ja', 'ko', 'zh'];
const resources = Object.fromEntries(languages.map(language => [language, {
  translation: JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/locales', language, 'translation.json'), 'utf8')),
}]));
let context;
function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(ROOT, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'exports', code)(id => {
    if (id === 'react-i18next') return { useTranslation: () => context };
    if (id === '../lib/releaseCopy') return maps;
    throw new Error('Unexpected dependency: ' + id);
  }, exports);
  return exports;
}
const maps = load('lib/releaseCopy.ts');
const { useReleaseCopy } = load('hooks/useReleaseCopy.ts');
async function copyFor(language) {
  const i18n = i18next.createInstance();
  await i18n.init({ lng: language, fallbackLng: 'en', resources, interpolation: { escapeValue: false } });
  context = { t: i18n.t.bind(i18n), i18n };
  return useReleaseCopy();
}

test('actual copy hook resolves every new Settings/creation string in EN/PT/ES', async () => {
  const added = Object.entries(maps.RELEASE_COPY_KEYS).filter(([, key]) => key.startsWith('finish'));
  assert.ok(added.length >= 60);
  for (const language of ['en', 'pt', 'es']) {
    const copy = await copyFor(language);
    for (const [message, key] of added) {
      const translated = resources[language].translation.release[key];
      assert.equal(typeof translated, 'string', `${language}:${key}`);
      assert.ok(translated.trim().length > 0);
      assert.equal(copy(message), language === 'en' ? message : translated);
    }
  }
});

test('all other supported locales retain working fallback for newly introduced UI', async () => {
  for (const language of languages.filter(value => !['en', 'pt', 'es'].includes(value))) {
    const copy = await copyFor(language);
    assert.equal(copy('Choose your look'), 'Choose your look');
    assert.notEqual(copy('Appearance'), 'Appearance', `${language}: existing translation must remain`);
    assert.equal(copy('Unrecognized user-provided example'), 'Unrecognized user-provided example');
  }
});

test('translated country search keeps all original country and template associations', () => {
  const file = ts.createSourceFile('TypePicker.tsx', fs.readFileSync(path.join(ROOT, 'components/ecard/wizard/TypePicker.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let countries;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'COUNTRIES') countries = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(file);
  const entries = countries.elements.map(item => Object.fromEntries(item.properties.filter(ts.isPropertyAssignment).filter(prop => ts.isStringLiteral(prop.initializer)).map(prop => [prop.name.getText(file), prop.initializer.text])));
  assert.deepEqual(entries.map(item => item.code), ['BR', 'US', 'GB', 'CA', 'MX', 'AR', 'CO', 'PT', 'ES', 'FR', 'DE', 'AU', 'IN', 'NG', 'JP']);
  assert.equal(entries[0].template, 'civic-card');
  assert.ok(entries.slice(1).every(item => item.template === 'politician-generic'));
  const settings = fs.readFileSync(path.join(ROOT, 'screens/SettingsScreen.tsx'), 'utf8');
  for (const value of ['miles', 'km']) assert.ok(settings.includes(`setDistanceUnit('${value}')`));
  for (const value of ['standard', 'dark', 'satellite']) assert.ok(settings.includes(`setDefaultMapLayer('${value}')`));
});
