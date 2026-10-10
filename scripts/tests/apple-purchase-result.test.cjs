const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
function harness(response) {
  let update;
  const events = [], finished = [], api = {};
  const iap = { initConnection: async () => {}, purchaseUpdatedListener: fn => { update = fn; return {remove(){}}; }, purchaseErrorListener: () => ({remove(){}}), finishTransaction: async v => finished.push(v) };
  const client = {auth:{getSession:async()=>({data:{session:{}}})},functions:{invoke:async()=>response}};
  const modules = {'react-native':{Platform:{OS:'ios'}}, 'react-native-iap':iap, './supabaseClient':{supabase:client}, './iapConfig':{IAP_PRODUCTS:{annual:{}}}};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../lib/iap.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code,{exports:api, require:name=>modules[name], console:{error(){}}});
  return { api, events, finished, async run(){api.subscribeToPurchaseResults(e=>events.push(e));await api.initIap();await update({productId:'annual',transactionReceipt:'verified-by-server'});} };
}
test('server-confirmed scheduled change is delivered to UI and acknowledged once',async()=>{
  const scheduledChange={productId:'annual',effectiveAt:'2026-10-11T00:10:11Z'};
  const h=harness({data:{status:'ok',expiresAt:scheduledChange.effectiveAt,scheduledChange},error:null});
  await h.run(); assert.equal(h.events[0].type,'success');assert.equal(h.events[0].scheduledChange,scheduledChange);assert.equal(h.finished.length,1);
});
test('normal purchase remains a normal success',async()=>{
  const h=harness({data:{status:'ok',expiresAt:'2026-10-11T00:10:11Z'},error:null});
  await h.run();assert.equal(h.events[0].type,'success');assert.equal(h.events[0].scheduledChange,undefined);assert.equal(h.finished.length,1);
});
test('receipt rejection cannot become scheduled success or finish the transaction',async()=>{
  const h=harness({data:null,error:{context:{json:async()=>({code:'OWNED_BY_OTHER_ACCOUNT',message:'Different owner'})}}});
  await h.run();assert.equal(h.events[0].type,'error');assert.equal(h.events[0].code,'OWNED_BY_OTHER_ACCOUNT');assert.equal(h.finished.length,0);
});
test('expired verified receipt is finished without granting success',async()=>{
  const h=harness({data:{status:'error',code:'EXPIRED',message:'Expired'},error:null});
  await h.run();assert.equal(h.events[0].type,'error');assert.equal(h.events[0].code,'EXPIRED');assert.equal(h.finished.length,1);
});
