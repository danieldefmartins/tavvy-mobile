const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
function harness(cover=null){
 const slots=[],effects=[],requests=[];let cursor=0,dirty=true,tree;
 const react={createElement(type,props,...children){
  // React Native rejects even a whitespace-only text node outside <Text>.
  if(type!=='Text')for(const child of children.flat(Infinity))if((typeof child==='string'&&child!=='')||typeof child==='number')throw Error('Text strings must be rendered within a <Text> component');
  return {type,props:{...props,children}};
 },useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(next!==slots[i]){slots[i]=next;dirty=true}}]},useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){old?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn()})}}};
 const catalog={},gallery={};new Function('exports',compile(fs.readFileSync(path.resolve(__dirname,'../../lib/cruises/catalog.ts'),'utf8')))(catalog);new Function('require','exports',compile(fs.readFileSync(path.resolve(__dirname,'../../lib/cruises/gallery.ts'),'utf8')))(name=>{assert.equal(name,'./catalog');return catalog},gallery);
 const deps={react:{...react,default:react},'react-native':Object.fromEntries(['View','Text','Image','TouchableOpacity','ActivityIndicator'].map(name=>[name,name])),'../../lib/cruises/service':{getCruiseGallery:shipId=>new Promise((resolve,reject)=>requests.push({shipId,resolve,reject}))},'../../lib/cruises/gallery':gallery,'../../contexts/ThemeContext':{useThemeContext:()=>({theme:{}})},'../../hooks/useReleaseCopy':{useReleaseCopy:()=>value=>value}};
 const exports={};new Function('require','exports',compile(fs.readFileSync(path.resolve(__dirname,'../../components/cruises/CruisePhotoGallery.tsx'),'utf8')))(name=>{assert(name in deps,name);return deps[name]},exports);
 const render=()=>{for(let n=0;dirty&&n<20;n++){dirty=false;cursor=0;tree=exports.default({shipId:'fixture-ship',cover});effects.splice(0).forEach(f=>f())}assert(!dirty);return tree};
 const all=(node=tree)=>!node||typeof node!=='object'?[]:[node,...(node.props.children||[]).flat(Infinity).flatMap(all)];
 const text=(node=tree)=>typeof node==='string'?node:node&&typeof node==='object'?(node.props.children||[]).flat(Infinity).map(text).join(''):'';
 const tick=async()=>{await new Promise(r=>setImmediate(r));render()};
 const press=label=>{const node=all().find(n=>n.type==='TouchableOpacity'&&text(n)===label);assert(node,'button '+label);node.props.onPress();render()};
 render();return {requests,render,all,text,tick,press};
}
test('actual native gallery renders loading and empty states without unwrapped text or invented photos',async()=>{
 const h=harness();assert.equal(h.all().filter(n=>n.type==='ActivityIndicator').length,1);assert.equal(h.all().filter(n=>n.type==='Image').length,0);h.requests[0].resolve([]);await h.tick();assert.equal(h.all().filter(n=>n.type==='ActivityIndicator'||n.type==='Image').length,0);assert(!h.text().includes('Photos could not be loaded.'));
});
test('actual native gallery renders failure and retry without a raw-text crash',async()=>{
 const h=harness();h.requests[0].reject(Error('fixture read failure'));await h.tick();assert(h.text().includes('Photos could not be loaded.'));h.press('Try again');assert.equal(h.requests.length,2);h.requests[1].resolve([]);await h.tick();assert(!h.text().includes('Photos could not be loaded.'));
});
test('actual native gallery keeps captions in Text, cover deduplication and Show more behavior',async()=>{
 const rows=Array.from({length:10},(_,i)=>({id:String(i),url:'https://example.invalid/'+i+'.webp',alt:'Fixture photo '+i,caption:'Caption '+i,width:400,height:300,source_id:'fixture'}));const h=harness({url:rows[0].url,alt:rows[0].alt});h.requests[0].resolve(rows);await h.tick();assert.equal(h.all().filter(n=>n.type==='Image').length,8);assert(h.text().includes('Caption 0'));h.press('Show more');assert.equal(h.all().filter(n=>n.type==='Image').length,10);assert(!h.text().includes('Show more'));
});
