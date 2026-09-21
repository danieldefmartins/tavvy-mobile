const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const file = path.resolve(__dirname, '../../components/FocusedStatusBar.tsx');
function fixture() {
  let focused = true;
  const calls = [], ref = { current: null };
  const StatusBar = Object.assign(function StatusBar() {}, { setBarStyle: (...args) => calls.push(args) });
  const react = { createElement: (type, props) => ({ type, props }), useRef: value => { if (!ref.current) ref.current = value; return ref; }, useCallback: fn => fn };
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  new Function('require', 'exports', js)(id => {
    if (id === 'react') return { ...react, default: react };
    if (id === 'react-native') return { StatusBar };
    if (id === '@react-navigation/native') return { useIsFocused: () => focused };
    throw Error(id);
  }, exports);
  return { ...exports, calls, StatusBar, setFocused: value => { focused = value; } };
}
test('retained blurred routes contribute no status-bar override', () => {
  const f = fixture();
  assert.equal(f.default({ barStyle: 'light-content' }).type, f.StatusBar);
  f.setFocused(false);
  assert.equal(f.default({ barStyle: 'light-content' }), null);
  f.setFocused(true);
  assert.equal(f.default({ barStyle: 'dark-content' }).props.barStyle, 'dark-content');
});
test('modal dismissal restores current theme, not an earlier captured theme', () => {
  const f = fixture();
  const dismiss = f.useRestoreFocusedStatusBar('light-content');
  f.useRestoreFocusedStatusBar('dark-content');
  dismiss();
  assert.deepEqual(f.calls, [['dark-content', false]]);
});
test('late modal dismissal cannot override a newly focused route', () => {
  const f = fixture();
  const dismiss = f.useRestoreFocusedStatusBar('dark-content');
  f.setFocused(false);
  f.useRestoreFocusedStatusBar('dark-content');
  dismiss();
  assert.deepEqual(f.calls, []);
});
