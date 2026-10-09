const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const exportsUnderTest={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../supabase/functions/pros-dashboard-register/record.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsUnderTest});
const build=exportsUnderTest.buildRegistrationRecord;
test('city text never enters the geometry field and unpaid registration cannot inherit active defaults',()=>{
 const r=build({businessName:'Demo Service',city:'Boston',state:'MA',location:'Boston, MA',is_active:true,subscription_status:'active',user_id:'other'},'caller-id','demo@example.com');
 assert.equal(r.user_id,'caller-id');assert.equal(r.slug,'demo-service-caller-id');assert.equal(r.city,'Boston');assert.equal(r.location,undefined);assert.equal(r.is_active,false);assert.equal(r.subscription_status,'none');assert.equal(r.subscription_plan,null);
});
test('only finite coordinates in geographical bounds become a PostGIS point',()=>{
 assert.equal(build({businessName:'Demo',latitude:42,longitude:-71},'id').location,'SRID=4326;POINT(-71 42)');
 for(const [latitude,longitude] of [[91,0],[0,181],[NaN,0],[0,Infinity],['42','-71']])assert.equal(build({businessName:'Demo',latitude,longitude},'id').location,undefined);
});
test('a profile requires a business name and gets a stable user-specific slug',()=>{
 assert.throws(()=>build({},'id'),/Business name/);
 assert.notEqual(build({businessName:'Same name'},'one').slug,build({businessName:'Same name'},'two').slug);
});
