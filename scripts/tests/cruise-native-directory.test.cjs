const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript');
function harness(){
 const slots=[],effects=[],timers=new Map(),requests=[],navigations=[];let cursor=0,nextTimer=0,dirty=true,tree;
 const react={createElement:(type,props,...children)=>({type,props:{...props,children}}),useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{const value=typeof v==='function'?v(slots[i]):v;if(value!==slots[i]){slots[i]=value;dirty=true}}]},useEffect(fn,deps){const i=cursor++;const old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){old?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn()})}}};
 const exports={};const dependencies={'../ToolHeader':{default:'ToolHeader'},react:{...react,default:react},'react-native':new Proxy({StyleSheet:{create:x=>x}},{get:(o,k)=>o[k]||k}),'@react-navigation/native':{useNavigation:()=>({navigate:(...args)=>navigations.push(args)})},'@expo/vector-icons':{Ionicons:'Icon'},'../../contexts/ThemeContext':{useThemeContext:()=>({theme:{}})},'../../lib/cruises/catalog':{safeCruiseUrl:x=>/^https:/.test(x||'')?x:null},'../../lib/cruises/service':{searchCruiseShips:args=>new Promise((resolve,reject)=>requests.push({args,resolve,reject}))}};
 const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../components/cruises/CruiseDirectory.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports','setTimeout','clearTimeout',code)(name=>{assert(name in dependencies,name);return dependencies[name]},exports,(fn)=>{const id=++nextTimer;timers.set(id,fn);return id},id=>timers.delete(id));
 const render=()=>{for(let i=0;dirty&&i<15;i++){dirty=false;cursor=0;tree=exports.default({onBack:()=>navigations.push(['back'])});effects.splice(0).forEach(fn=>fn())}return tree};
 function all(node=tree){return !node||typeof node!=='object'?[]:[node,...(node.props?.children||[]).flat(Infinity).flatMap(all)]}
 const text=(node=tree)=>typeof node==='string'?node:node&&typeof node==='object'?(node.props?.children||[]).flat(Infinity).map(text).join(''):'';
 const press=label=>{const node=all().find(x=>x.type==='TouchableOpacity'&&text(x)===label);assert(node,'button '+label);node.props.onPress();render()};
 const tick=async()=>{render();const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());await new Promise(r=>setImmediate(r));render()};
 render();return {requests,navigations,press,tick,text,all,render};
}
const ship=(id,name)=>({ship:{id,universe_id:'universe-'+id,slug:id,name,operator_name:'Fixture line',kind:'ocean',operating_status:'operating',photo:null}});
test('selected tabs keep loaded ships, pagination uses canonical Universe IDs, and stale pages cannot replace a new filter',async()=>{
 const h=harness();await h.tick();assert.equal(h.requests[0].args.status,'operating');h.requests[0].resolve({ships:[ship('one','Ship One')],hasMore:true});await h.tick();assert.match(h.text(),/Ship One/);
 h.press('All types');h.press('Operating ships');await h.tick();assert.equal(h.requests.length,1);assert.match(h.text(),/Ship One/);
 const card=h.all().find(x=>x.type==='TouchableOpacity'&&h.text(x).includes('Ship One'));card.props.onPress();assert.deepEqual(h.navigations[0],['UniverseLanding',{universeId:'universe-one'}]);assert(h.all().some(x=>x.props?.accessibilityLabel==='No verified ship photo'));
 h.press('Load more ships');await h.tick();assert.equal(h.requests[1].args.offset,1);h.press('River');await h.tick();assert.equal(h.requests[2].args.kind,'river');assert.equal(h.requests[2].args.offset,0);h.requests[2].resolve({ships:[ship('river','River Fixture')],hasMore:false});await h.tick();h.requests[1].resolve({ships:[ship('old','Stale Old Ship')],hasMore:false});await h.tick();assert.match(h.text(),/River Fixture/);assert(!h.text().includes('Stale Old Ship'));
});
test('failed reads show a retry instead of an empty verified fleet; announced selection stays separate',async()=>{
 const h=harness();await h.tick();h.requests[0].reject(Error('Ships unavailable'));await h.tick();assert.match(h.text(),/Ships unavailable/);assert(!h.text().includes('Verified ships will appear'));h.press('Try again');await h.tick();h.requests[1].resolve({ships:[],hasMore:false});await h.tick();assert.match(h.text(),/Verified ships will appear/);h.press('Announced ships');await h.tick();assert.equal(h.requests[2].args.status,'announced');
});
