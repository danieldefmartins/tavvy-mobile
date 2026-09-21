const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const file = path.join(__dirname, '../../App.tsx'), text = fs.readFileSync(file, 'utf8'), tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
const functions = tree.statements.filter(node => ts.isFunctionDeclaration(node) && ['TabNavigator', 'AppsStack'].includes(node.name?.text));
const componentNames = new Set();
function collect(node) {
  if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'component' && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isIdentifier(node.initializer.expression)) componentNames.add(node.initializer.expression.text);
  ts.forEachChild(node, collect);
}
functions.forEach(collect);
let dark = false;
const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat().filter(Boolean) } }) };
const scope = Object.fromEntries([...componentNames].filter(name => name !== 'AppsStack').map(name => [name, name]));
Object.assign(scope, { useReleaseCopy: () => message => message, React, Tab: { Navigator: 'TabNavigator', Screen: 'TabScreen' }, MenuStackNav: { Navigator: 'AppsNavigator', Screen: 'AppsScreen' }, View: 'View', Ionicons: 'Ionicons', AddButton: 'AddButton', TabIconWithBadge: 'TabIconWithBadge', useThemeContext: () => ({ isDark: dark, theme: { textSecondary: dark ? '#CBD5E1' : '#475569' } }), useUnreadMessagesContext: () => ({ unreadCount: 0 }) });
const code = functions.map(node => node.getText(tree)).join('\n') + '\nexport { TabNavigator, AppsStack };';
const exportsUnderTest = {};
new Function(...Object.keys(scope), 'exports', ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText)(...Object.values(scope), exportsUnderTest);
test('visible footer is Discover, Tools, Saved, Profile and Tools opens the existing tools stack', () => {
  const tabs = exportsUnderTest.TabNavigator();
  const visible = tabs.props.children.filter(tab => !tab.props.options?.tabBarButton);
  assert.deepEqual(visible.map(tab => tab.props.options.tabBarLabel), ['Discover', 'Tools', 'Saved', 'Profile']);
  const tools = visible[1];assert.equal(tools.props.name, 'Tools');assert.equal(tools.props.component, exportsUnderTest.AppsStack);assert.equal(tools.props.options.tabBarAccessibilityLabel, tools.props.options.tabBarLabel, 'the accessible Tools label follows the visible localized label');
  for (const [name, expected] of [['Tools', 'AppsMain'], ['Apps', 'AppsMain'], ['Menu', 'AppsMain'], ['Saved', 'SavedMain'], ['Profile', 'ProfileMain']]) {
    const stack = exportsUnderTest.AppsStack({ route: { name } });assert.equal(stack.props.initialRouteName, expected);
    assert(stack.props.children.some(screen => screen.props.name === 'AppsMain' && screen.props.component === 'AppsScreen'));
  }
});
test('Tools uses nine themed dots and retains default tab and stack back behavior', () => {
  for (const isDark of [false, true]) {
    dark = isDark;const tabs = exportsUnderTest.TabNavigator();assert.equal(tabs.props.backBehavior, undefined);
    const options = tabs.props.screenOptions({ route: { name: 'Tools' } });const color = options.tabBarActiveTintColor;
    for (const size of [23, 24, 25]) {
      const icon = options.tabBarIcon({ focused: true, color, size });
      const rows = icon.props.children;
      assert.equal(rows.length, 3);
      assert(rows.every(row => row.props.children.length === 3 && row.props.style.flexDirection === 'row' && !row.props.style.flexWrap));
      const dots = rows.flatMap(row => row.props.children);
      assert.equal(dots.length, 9);
      assert(dots.every(dot => dot.props.style.backgroundColor === color && dot.props.style.borderRadius > 0));
      assert.equal(icon.props.style.flexWrap, undefined, 'fractional dot sizing must not create extra wrapped rows');
      assert.equal(icon.props.accessibilityElementsHidden, true);
    }
    assert.equal(options.tabBarStyle.backgroundColor, isDark ? '#0F0F0F' : '#FAFAFA');
  }
});
