const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function extract(file, predicate) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let found; function visit(node) { if(predicate(node,source)) found=node; ts.forEachChild(node,visit); } visit(source);
  assert(found); return found.getText(source);
}
function compile(source, scope) {
  const js=ts.transpileModule(`const handler=${source};`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  return new Function(...Object.keys(scope), js+'; return handler;')(...Object.values(scope));
}
for (const [file,product] of [['screens/ecard/ECardPremiumUpsellScreen.tsx','annual'],['screens/ProsPaywallScreen.tsx','pros']]) {
  test(`${file}: restore is handled once by its caller; other products do not interrupt purchase`,()=>{
    const call=extract(file,(n,s)=>ts.isCallExpression(n)&&n.expression.getText(s)==='subscribeToPurchaseResults');
    const callback=call.slice('subscribeToPurchaseResults('.length,-1);
    const alerts=[],changes=[];
    const handler=compile(callback,{active:true,ECARD_PRO_ANNUAL:'annual',ECARD_PRO_MONTHLY:'monthly',PROS_FOUNDING_ANNUAL:'pros',setIsLoading:x=>changes.push(x),setLoading:x=>changes.push(x),refreshProfile:()=>{},copy:x=>x,t:(_,o)=>o.defaultValue,Alert:{alert:(...args)=>alerts.push(args)},navigation:{goBack(){},navigate(){}}});
    handler({type:'success',productId:product,restored:true});
    handler({type:'error',productId:'unrelated',message:'irrelevant'});
    assert.equal(alerts.length,0);assert.equal(changes.length,0);
    handler({type:'success',productId:product,restored:false});
    assert.equal(alerts.length,1);assert.equal(changes.length,1);
  });
}
test('Settings reports a failed restore even when another product succeeds',async()=>{
  const decl=extract('screens/SettingsScreen.tsx',(n,s)=>ts.isVariableDeclaration(n)&&n.name.getText(s)==='handleRestorePurchases');
  const callback=decl.slice(decl.indexOf('=')+1);
  const alerts=[];
  const handler=compile(callback,{IAP_ENABLED:true,copy:x=>x,deletionCopy:{close:'Close'},setIsRestoringPurchases(){},Alert:{alert:(...args)=>alerts.push(args)},require:()=>({restorePurchases:async()=>({restored:1,failed:1,messages:['Pros verification failed']})})});
  await handler();assert.equal(alerts.length,1);assert.equal(alerts[0][1],'Pros verification failed');
});
