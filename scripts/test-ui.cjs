const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const schema=JSON.parse(fs.readFileSync(path.join(__dirname,'../files/usr/share/momo-ui/schema.json'),'utf8'));
const inventory={fields:JSON.parse(fs.readFileSync(path.join(__dirname,'fields.json'),'utf8'))};
const sandbox={module:{exports:{}},window:{confirm:()=>true,location:{hostname:'192.168.8.1'}},TextEncoder};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../files/www/views/gl-sdk4-ui-momo.common.js'),'utf8'),sandbox);
const component=sandbox.module.exports,state=component.data();
Object.assign(state,component.methods,{$store:{getters:{lang:'en'}},$set:(o,k,v)=>o[k]=v,$refs:{},$nextTick:fn=>fn.call(state)});
for(const [key,getter]of Object.entries(component.computed))Object.defineProperty(state,key,{get:()=>getter.call(state)});
function node(tag,data,children){if(Array.isArray(data)){children=data;data={};}return{tag,data:data||{},children:children||[]};}
function nodes(tree){return[tree,...(tree.children||[]).filter(v=>v&&typeof v==='object').flatMap(nodes)];}
const calls=[];let stored='{"log":{"level":"info"}}';
state.rpc=async(method,args)=>{calls.push({method,args});if(method==='get_profile')return{text:stored,readonly:false,prefer:'remote'};if(method==='get_config')return{schema,settings:state.settings,rules:state.rules,profiles:[{value:'subscription:test',label:'Test'}],subscriptions:[],version:{}};if(method==='save_profile'){stored=args.text;return{success:true};}if(method==='prepare_download')return{path:'/tmp/momo-ui-downloads/test.bin'};if(method==='get_status')return{running:true};return{success:true};};
async function main(){
 state.schema=schema;state.loaded=true;state.profiles=[{value:'subscription:test',label:'Test'}];state.settings={config:{profile:'subscription:test',start_delay:'0'},procd:{},proxy:{},mixin:{},log:{}};state.rules={router_access_control:[],lan_access_control:[]};
 state.original=JSON.stringify(state.settings);state.originalRules=JSON.stringify(state.rules);
 const versionText=()=>nodes(component.render.call(state,node)).find(n=>n.data.class==='momo-versions').children.join('');
 state.version={app:'test-momo',core:'test-core',ui:'2026.10.14~abcdef0-r1'};assert.equal(versionText(),'Momo test-momo · sing-box test-core · UI 2026.10.14~abcdef0-r1');
 state.version.ui='';assert(versionText().endsWith(' · UI —'),'script installation without package metadata shows no fabricated UI version');assert.equal(schema.version,undefined);
 const master=()=>nodes(component.render.call(state,node)).filter(n=>n.data.attrs?.['data-momo-field']==='config.enabled');
 for(const tab of ['general','proxy','mixin','subscriptions','files','logs']){state.active=tab;assert.equal(master().length,1,'one master switch on every tab');}
 const serviceButtons=nodes(component.render.call(state,node)).filter(n=>n.tag==='gl-button').map(n=>n.children[0]);assert(!serviceButtons.includes('Start')&&!serviceButtons.includes('Stop'));assert(serviceButtons.includes('Restart')&&serviceButtons.includes('Reload configuration'));
 const originalRpc=state.rpc;let savedEnabled=false,failToggle=false;
 state.statusLoaded=true;state.syncEnabled(false);state.settings.config.start_delay='9';
 state.rpc=async(method,args)=>{if(method==='set_config'){assert.deepEqual(JSON.parse(JSON.stringify(args)),{settings:{config:{enabled:args.settings.config.enabled}},apply:true});savedEnabled=args.settings.config.enabled==='1';if(failToggle)throw Error('service action failed');return{success:true};}if(method==='get_status')return{enabled:savedEnabled,running:savedEnabled};throw Error('unexpected master switch RPC '+method);};
 assert(await state.setEnabled(true));assert.equal(state.enabled,true);assert.equal(state.settings.config.enabled,'1');assert.equal(JSON.parse(state.original).config.enabled,'1');assert.equal(state.settings.config.start_delay,'9');assert.equal(JSON.parse(state.original).config.start_delay,'0');assert(state.dirty,'master switch preserves unrelated unsaved settings');
 assert(await state.setEnabled(false));assert.equal(state.enabled,false);assert.equal(state.running,false);assert.equal(state.settings.config.enabled,'0');assert(state.dirty);
 failToggle=true;assert.equal(await state.setEnabled(true),false);assert.equal(state.enabled,true,'read saved state even if applying fails');assert.equal(state.error,'service action failed');assert.equal(state.serviceChanging,false);
 state.running=false;assert(nodes(component.render.call(state,node)).some(n=>n.children.includes('Enabled, not running')),'enabled and stopped is visible');
 state.rpc=originalRpc;state.settings.config.start_delay='0';state.error='';state.notice='';assert(!state.dirty);state.active='general';
 const keys=new Set();for(const s of schema.sections)for(const g of s.groups)for(const f of g.fields)keys.add(s.key+'.'+f.key);for(const[k,r]of Object.entries(schema.rules))for(const f of r.fields)keys.add(k+'.'+f.key);for(const f of schema.subscription.fields)keys.add('subscription.'+f.key);
 assert.equal(keys.size,89);for(const field of inventory.fields)assert(keys.has(field.section+'.'+field.key),field.section+'.'+field.key+' missing from schema');
 const rendered=new Set();for(const tab of ['general','proxy','mixin','logs']){state.active=tab;for(const n of nodes(component.render.call(state,node)))if(n.data.attrs?.['data-momo-field'])rendered.add(n.data.attrs['data-momo-field']);}
 state.active='proxy';state.addRule('router_access_control');state.addRule('lan_access_control');for(const n of nodes(component.render.call(state,node)))if(n.data.attrs?.['data-momo-field'])rendered.add(n.data.attrs['data-momo-field']);state.rules={router_access_control:[],lan_access_control:[]};
 state.active='subscriptions';await state.editSub();for(const n of nodes(component.render.call(state,node)))if(n.data.attrs?.['data-momo-field'])rendered.add(n.data.attrs['data-momo-field']);state.sub=null;
 for(const field of inventory.fields)if(!['used','total','expire','update'].includes(field.key)||field.section!=='subscription')assert(rendered.has(field.section+'.'+field.key),field.section+'.'+field.key+' missing from rendered controls');
 state.active='mixin';const clearChoice=nodes(component.render.call(state,node)).filter(n=>n.tag==='el-option'&&n.data.attrs.value==='');assert.equal(clearChoice.length,13,'all enum, boolean and preset overrides must support unmodified');assert(schema.sections.find(s=>s.key==='mixin').groups.every(g=>g.fields.every(f=>f.optional)));
 const expectedPresets=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/dashboard-presets.json'),'utf8')).choices;assert.equal(expectedPresets.length,5);
 const downloadField=schema.sections.flatMap(s=>s.groups.flatMap(g=>g.fields)).find(f=>f.key==='external_control_ui_download_url');assert.deepEqual(downloadField.choices,expectedPresets);assert.equal(downloadField.kind,'url','custom URLs must retain URL validation');
 const downloadControl=()=>nodes(component.render.call(state,node)).find(n=>n.data.attrs?.['data-momo-field']==='mixin.external_control_ui_download_url');
 const downloadSelect=()=>nodes(downloadControl()).find(n=>n.tag==='el-select');assert(downloadSelect().data.attrs.filterable&&downloadSelect().data.attrs['allow-create']&&downloadSelect().data.attrs['default-first-option']);
 // Vue 2 extracts props from attrs in place. Reproduce that mutation between renders.
 for(const value of [expectedPresets[0].value,expectedPresets[3].value,'https://example.invalid/custom-dashboard.zip','']){
   downloadSelect().data.on.input(value);assert.equal(state.settings.mixin.external_control_ui_download_url,value);assert.equal(downloadSelect().data.attrs.value,value);
   const options=nodes(downloadControl()).filter(n=>n.tag==='el-option');assert.equal(options.length,6);assert.deepEqual(options.slice(1).map(n=>({value:n.data.attrs.value,label:n.data.attrs.label})),expectedPresets);
   for(const option of options){delete option.data.attrs.value;delete option.data.attrs.label;}
   assert.deepEqual(downloadField.choices,expectedPresets,'rendering must not consume shared schema options');
 }
 delete state.settings.mixin.external_control_ui_download_url;
 state.active='proxy';assert(nodes(component.render.call(state,node)).some(n=>n.tag==='el-option'&&n.data.attrs.value===''),'protocols must support disabled');
 state.active='files';await state.loadFile('subscription:test');assert.equal(state.fileDirty,false);state.fileText='{ // JSONC\n "log":{"level":"debug"},\n}';
 await nodes(component.render.call(state,node)).find(n=>n.tag==='gl-button'&&n.children[0]==='Save file').data.on.click();assert.equal(stored,state.fileText);assert(!calls.some(c=>c.method==='set_config'));
 state.preferLocal=false;await state.saveFile(false);assert.equal(calls.filter(c=>c.method==='save_profile').at(-1).args.prefer_local,false);
 state.settings.config.start_delay='10';state.fileText='{"log":{"level":"warn"}}';await state.saveFile(true);
 const saveIndex=calls.findLastIndex(c=>c.method==='save_profile'),applyIndex=calls.findLastIndex(c=>c.method==='set_config');assert(applyIndex>saveIndex);assert.equal(state.dirty,true,'file activation must preserve unrelated unsaved settings');
 await state.loadFile('runtime');assert.equal(state.fileReadonly,false);state.fileText='{}';await state.saveFile(true);assert.equal(calls.at(-2).method,'service');
 state.fileText='changed';state.ask=async()=>true;let navigation=await new Promise(resolve=>component.beforeRouteLeave.call(state,{},{},resolve));assert.equal(navigation,true);state.ask=async()=>false;navigation=await new Promise(resolve=>component.beforeRouteLeave.call(state,{},{},resolve));assert.equal(navigation,false);state.ask=async()=>true;
 state.active='logs';const actions=nodes(component.render.call(state,node)).filter(n=>n.tag==='gl-button').map(n=>n.children[0]);for(const label of ['Clear log','Download complete log','Scroll to bottom','Generate and download debug report','Update dashboard'])assert(actions.includes(label),label+' action missing');
 let exported;state.$downloadFile=async(...args)=>exported=args;await state.download('momo-test.log','fixture');assert.deepEqual(exported,['/tmp/momo-ui-downloads/test.bin','momo-test.log',true]);
 state.active='general';state.clashEnabled=false;assert(!nodes(component.render.call(state,node)).some(n=>n.data.attrs?.id==='momo-tab-proxies'));
 const proxyFixture={enabled:true,groups:['Group','Auto'],mode:'Rule',modes:['Rule','Global','Direct'],proxies:{Group:{name:'Group',type:'Selector',all:['Fast','中文 /?#'],now:'Fast'},Auto:{name:'Auto',type:'URLTest',all:['Fast','中文 /?#'],now:'Fast'},Fast:{name:'Fast',type:'Hysteria2',delay:42},'中文 /?#':{name:'中文 /?#',type:'Hysteria2'}}};
 let concurrent=0,maxConcurrent=0;
 state.rpc=async(method,args)=>{calls.push({method,args});if(method==='get_proxies')return proxyFixture;if(method==='get_status')return{running:true,clash_api:false,ui_version:'2026.10.14~fedcba0-r1'};if(method==='select_proxy')proxyFixture.proxies[args.group].now=args.name;if(method==='set_clash_mode')proxyFixture.mode=args.mode;if(method==='test_proxy'){concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);await Promise.resolve();concurrent--;if(args.name==='failed')throw Error('test timeout');return{delay:64};}return{success:true};};
 state.clashEnabled=true;state.active='proxies';await state.loadProxies(true);
 assert(nodes(component.render.call(state,node)).some(n=>n.data.attrs?.id==='momo-tab-proxies'));
 let proxyNodes=nodes(component.render.call(state,node));assert(proxyNodes.some(n=>n.tag==='button'&&n.data.attrs?.['aria-label']==='Group: 中文 /?#'&&!n.data.attrs.disabled));assert(proxyNodes.find(n=>n.data.attrs?.['aria-label']==='Auto: 中文 /?#').data.attrs.disabled,'URLTest must remain read-only');
 state.proxySearch='中文';assert.equal(state.visibleProxyGroups.length,2);state.proxySearch='missing';assert.equal(state.visibleProxyGroups.length,0);state.proxySearch='';
 await state.selectProxy('Group','中文 /?#');assert.equal(state.proxyData.proxies.Group.now,'中文 /?#');assert.equal(calls.filter(c=>c.method==='select_proxy').at(-1).args.name,'中文 /?#');
 await state.setClashMode('Direct');assert.equal(state.proxyData.mode,'Direct');
 await state.testProxy('Fast');assert.equal(state.proxyDelays.Fast,64);await state.testProxy('failed');assert.equal(state.proxyDelays.failed,0);
 await state.testProxyGroup({all:['a','b','c','d','e','f','g']});assert(maxConcurrent<=3&&maxConcurrent>1,'group latency tests use bounded concurrency');
 state.proxyData.proxies.Cycle={now:'Cycle'};assert.equal(state.proxyPath('Cycle').length,1,'cyclic proxy groups cannot hang rendering');
 const draft=JSON.stringify(state.settings);await state.refreshStatus();assert.equal(state.clashEnabled,false);assert.equal(state.active,'general');assert.equal(state.version.ui,'2026.10.14~fedcba0-r1');assert.equal(JSON.stringify(state.settings),draft,'version polling preserves unsaved settings');
 console.log('PASS 89/89 schema fields, 85/85 writable controls, existing workflows, conditional Clash tab, proxy selection, mode switching, latency tests and bounded concurrency');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
