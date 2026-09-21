// Exercise the real native screen's submit handler without mounting unrelated native modules.
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript'), path=require('node:path');
function load(name){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>load(path.basename(n)),console});return exports;}
const intent=load('searchIntent'), demo=load('demoPlace');
const source=fs.readFileSync(path.join(__dirname,'../screens/HomeScreen.tsx'),'utf8');const ast=ts.createSourceFile('HomeScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let arrow;
function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='handleSearchSubmit')arrow=node.initializer.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert.ok(arrow);
function harness({device=[-81.38,28.54],previous={},where='',provider}={}){
 const calls=[], nav=[], updates=[], demoStates=[], loadingStates=[];const context={...intent,...demo,buildPlaceReviewSummary:()=>({}),currentEvidenceSignals:()=>[],setShowDemoFallback:value=>demoStates.push(value),setLoading:value=>loadingStates.push(value),searchQuery:'',diningNeed:'',searchLocation:where,userLocation:device,searchRequestId:{current:0},submittedSearchRef:{current:0},searchDebounceRef:{current:null},activeSearchContext:{current:previous},Keyboard:{dismiss(){}},navigation:{navigate:route=>nav.push(route)},clearTimeout,
 searchAcrossProviders:async(q,limit,scope)=>{calls.push({q,scope});if(provider)return provider(q,scope);return{places:[],intent:intent.resolveSearchIntent(q,scope)}},fetchDiscoveryEvidence:async()=>new Map(),setFilteredPlaces:p=>updates.push(p)};
 for(const name of ['setIsSearchingAddress','setSearchSuggestions','setIsSearchFocused','setSearchError','saveRecentSearch','setSearchQuery','setShowCategoryResults','switchToMapMode','setSearchDining','setDiningNeed','setSearchScopeLabel','setTargetLocation'])context[name]=()=>{};
 vm.runInNewContext(ts.transpileModule('globalThis.submit = '+arrow,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 return {...context,calls,nav,updates,demoStates,loadingStates};
}
test('native canonical Trattoria uses real provider search; only explicit demo aliases navigate demo',async()=>{const h=harness();await h.submit('Trattoria Tavvy');assert.equal(h.calls.length,1);assert.equal(h.calls[0].q,'Trattoria Tavvy');assert.equal(h.nav.length,0);await h.submit('demo restaurant');assert.deepEqual(h.nav,['DemoRestaurant']);assert.equal(h.calls.length,1)});
test('native near-me after a map search uses device coordinates and clears prior Boston scope',async()=>{const h=harness({previous:{mode:'map',coordinates:{latitude:42.36,longitude:-71.06},bounds:{minLat:42,maxLat:43,minLng:-72,maxLng:-70}},where:'Boston, MA'});await h.submit('Italian restaurants near me');const resolved=intent.resolveSearchIntent(h.calls[0].q,h.calls[0].scope);assert.equal(resolved.kind,'current');assert.equal(resolved.coordinates.latitude,28.54);assert.equal(h.calls[0].scope.bounds,undefined);assert.equal(h.calls[0].scope.location,undefined)});
test('native explicit Boston destination overrides Orlando device and previous Where',async()=>{const h=harness({where:'Miami, FL'});await h.submit('Italian Restaurants Near Boston, MA');const resolved=intent.resolveSearchIntent(h.calls[0].q,h.calls[0].scope);assert.equal(resolved.city,'Boston');assert.equal(resolved.region,'MA');assert.equal(resolved.coordinates,undefined)});
test('late native search cannot repopulate Home after selecting a demo shortcut',async()=>{let release;const h=harness({provider:()=>new Promise(resolve=>{release=resolve})});const pending=h.submit('restaurants in Boston, MA');await h.submit('tavvy demo');release({places:[],intent:{query:'restaurants',label:'Boston, MA'}});await pending;assert.equal(h.updates.length,0);assert.deepEqual(h.nav,['DemoRestaurant'])});

test('empty native exact-name lookup offers labeled demo without auto-navigation; partial failures do not',async()=>{
 const h=harness(); await h.submit('Trattoria Tavvy');assert.equal(h.demoStates.at(-1),true);assert.equal(h.nav.length,0);
 const partial=harness({provider:async()=>({places:[],partial:true,intent:{query:'Trattoria Tavvy',label:'Any location'}})});await partial.submit('Trattoria Tavvy');assert.equal(partial.demoStates.at(-1),false);
});

test('existing canonical native place remains the result with no demo fallback',async()=>{
 const h=harness({provider:async()=>({places:[{id:'00000000-0000-4000-8000-000000000001',name:'Trattoria Tavvy',latitude:42.36,longitude:-71.06,category:'restaurant'}],intent:{query:'Trattoria Tavvy',label:'Boston, MA'}})});await h.submit('Trattoria Tavvy');assert.equal(h.demoStates.at(-1),false);assert.equal(h.updates.at(-1)[0].name,'Trattoria Tavvy');assert.equal(h.nav.length,0);
});

for (const earlyQuery of ['demo restaurant','']) test(`pending native search → ${earlyQuery || 'blank submit'} releases loading and rejects the late response`,async()=>{
 let release;const h=harness({provider:()=>new Promise(resolve=>{release=resolve})});
 const pending=h.submit('restaurants in Boston, MA');assert.equal(h.loadingStates.at(-1),true);
 await h.submit(earlyQuery);assert.equal(h.loadingStates.at(-1),false);
 release({places:[],intent:{query:'restaurants',label:'Boston, MA'}});await pending;
 assert.equal(h.loadingStates.at(-1),false);assert.equal(h.updates.length,0);
 assert.deepEqual(h.nav,earlyQuery?['DemoRestaurant']:[]);
});
