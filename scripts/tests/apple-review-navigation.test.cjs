const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const registration = fs.readFileSync(path.join(root, 'screens/ProsRegistrationScreen.tsx'), 'utf8');
const tree = ts.createSourceFile('registration.tsx', registration, ts.ScriptTarget.Latest, true);
function declaration(name) {
  let found;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(tree) === name) found = node; ts.forEachChild(node, visit); }
  visit(tree);
  assert(found, name);
  return `const ${found.getText(tree)};`;
}
function build(name, scope) {
  const code = ts.transpileModule(declaration(name), {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
  return new Function(...Object.keys(scope), `${code}; return ${name};`)(...Object.values(scope));
}
function harness(os, fail = false) {
  const calls = [];
  const formData = {businessName:'Demo', city:'Boston', state:'MA', categoryIds:[1], primaryCategoryId:1, selectedTier:'early_adopter'};
  const run = build('handleSubmit', {Platform:{OS:os}, formData, PROS_CATEGORIES:[{id:1,slug:'cleaning'}], register:async()=>{calls.push('register');if(fail)throw Error('offline')}, subscribe:async tier=>calls.push(['subscribe',tier]), navigation:{replace:route=>calls.push(['route',route])}, Alert:{alert:(...args)=>calls.push(['alert',...args])}});
  return {run,calls};
}
test('iOS registration creates a profile before routing to StoreKit and never grants a legacy subscription', async()=>{
  const h=harness('ios');await h.run();assert.deepEqual(h.calls,['register',['route','ProsPaywall']]);
  assert.deepEqual(build('steps',{Platform:{OS:'ios'}}),['business','services','location','review']);
});
test('failed profile creation does not start a subscription or navigate to purchase',async()=>{
  const h=harness('ios',true);await h.run();assert.equal(h.calls[0],'register');assert.equal(h.calls[1][0],'alert');assert.equal(h.calls.length,2);
});
test('non-iOS registration preserves its existing tier flow and reaches a registered dashboard',async()=>{
  const h=harness('android');await h.run();assert.deepEqual(h.calls.slice(0,2),['register',['subscribe','early_adopter']]);h.calls[2][3][0].onPress();assert.deepEqual(h.calls.at(-1),['route','ProsDashboard']);
});
test('every literal destination in the eCard hub and Pros registration exists in the app navigator',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const routes=new Set([...app.matchAll(/\.Screen\s+name="([^"]+)"/g)].map(m=>m[1]));
  for(const file of ['screens/ecard/ECardHubScreen.tsx','screens/ProsRegistrationScreen.tsx']){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of source.matchAll(/navigation\.(?:navigate|replace)\('([^']+)'/g)) assert(routes.has(match[1]),`${file}: ${match[1]} must be reachable`);
  }
});
