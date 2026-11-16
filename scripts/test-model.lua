-- Test actual adapter against an isolated UCI directory and remapped file tree.
-- Never touches the live config, profiles, logs, subscriptions or service.
local realfs=require "nixio.fs"
local realnixio=require "nixio"
local realuci=require "uci"
local json=require "cjson.safe"
local token=assert(realfs.readfile("/proc/sys/kernel/random/uuid")):match("^[%x%-]+")
local root="/tmp/momo-ui-model-"..token
assert(realfs.mkdir(root));assert(realfs.chmod(root,700))
for _,name in ipairs({"save","profiles","subscriptions","logs","run","cgroup"}) do assert(realfs.mkdir(root.."/"..name)) end
for _,name in ipairs({"momo","network","uhttpd"}) do assert(realfs.writefile(root.."/"..name,(assert(realfs.readfile("/etc/config/"..name))))) end
assert(realfs.writefile(root.."/run/config.json",json.encode({experimental={clash_api={external_controller="127.0.0.1:9095",secret="test-quote'-secret"}}})))
assert(realfs.writefile(root.."/logs/app.log","application fixture\n"));assert(realfs.writefile(root.."/logs/core.log","core fixture\n"));assert(realfs.writefile(root.."/logs/debug.log","debug fixture\n"))
assert(realfs.writefile(root.."/passwd","root:x:0:0:root:/root:/bin/sh\nfixture:x:1:1::/:/bin/false\n"))
assert(realfs.writefile(root.."/group","root:x:0:\nfixture:x:1:\n"))
assert(realfs.writefile(root.."/installed","P:momo\nV:test-momo\n\nP:gl-ui-momo\nV:2026.10.14~abcdef0-r1\n\nP:gl-sdk4-ui-momo\nV:must-not-use\n\nP:luci-app-momo\nV:must-not-use\n\n"))
assert(realfs.writefile(root.."/schema.json",assert(realfs.readfile(arg[2] or "/usr/share/momo-ui/schema.json"))))
assert(realfs.writefile(root.."/cgroup/cgroup.controllers","cpu memory\n"))
for _,name in ipairs({"services","services/test","services/momo","services/momo/private"}) do assert(realfs.mkdir(root.."/cgroup/"..name)) end
assert(realfs.symlink(root.."/cgroup",root.."/cgroup/loop"))
local function mapped(p)
    if p:match("^/tmp/momo%-ui%-debug%-[%x%-]+$") then return root.."/logs/"..p:match("([^/]+)$") end
    for prefix,target in pairs({["/etc/momo/profiles"]="profiles",["/etc/momo/subscriptions"]="subscriptions",["/var/log/momo"]="logs",["/etc/momo/run"]="run",["/tmp/momo-ui-downloads"]="downloads",["/etc/passwd"]="passwd",["/etc/group"]="group",["/lib/apk/db/installed"]="installed",["/usr/lib/opkg/status"]="opkg-status",["/usr/share/momo-ui/schema.json"]="schema.json",["/sys/fs/cgroup"]="cgroup",["/www/luci-static/resources/view/momo/app.js"]="optional-luci.js"}) do
        if p==prefix or p:sub(1,#prefix+1)==prefix.."/" then return root.."/"..target..p:sub(#prefix+1) end
    end
    return p
end
local fs={};for k,v in pairs(realfs) do fs[k]=v end
for _,name in ipairs({"readfile","writefile","stat","lstat","unlink","dir","mkdir","chmod"}) do fs[name]=function(p,...) return realfs[name](mapped(p),...) end end
fs.rename=function(a,b) return realfs.rename(mapped(a),mapped(b)) end
local nixio={};for k,v in pairs(realnixio) do nixio[k]=v end
nixio.open=function(p,...) return realnixio.open(mapped(p),...) end
package.loaded["nixio.fs"]=fs;package.loaded["nixio"]=nixio
local function cursor() return realuci.cursor(root,root.."/save") end
package.loaded.uci={cursor=cursor}
local service_calls,commands={},{}
local bus_faults={}
local bus_yield=false
local service_running=true
package.loaded["oui.ubus"]={call=function(object,method,args)
    assert(object~="luci.momo","native UI must never call luci.momo")
    if bus_yield then coroutine.yield("rpc pending") end
    local fault=bus_faults[object.."."..method]
    if fault then
        return fault.result,fault.err
    end
    if object=="rc" then service_calls[#service_calls+1]=args;return {} end
    if object=="service" then return {momo={instances={main={running=service_running}}}} end
    if method=="getHostHints" then return {hosts={["02:00:00:00:00:01"]={name="fixture",ipaddrs={"192.0.2.1"},ip6addrs={"2001:db8::1"}}}} end
    return {success=true}
end}
package.loaded["oui.rpc"]={ERROR_CODE_INVALID_PARAMS=-32602}
local command_output,command_error,command_options="\n204",nil,nil
local command_router
local native_faults,command_yield={},false
local debug_path
local subscription_success="1"
ngx={pipe={spawn=function(args,options)
    commands[#commands+1]=args
    command_options=options
    if command_error then return nil,command_error end
    local output
    if args[1]=="/bin/sh" and args[4]=="momo-ui" then
        if command_yield then coroutine.yield("command pending") end
        local target=args[5]
        if target=="/bin/sh" and args[8]=="momo-debug" then
            debug_path=args[9];target="/etc/momo/scripts/debug.sh";assert(fs.writefile(debug_path,"debug fixture\n"))
        end
        if native_faults[target] then output=native_faults[target]
        elseif target=="/usr/bin/sing-box" then output="sing-box version test-core\n\nMOMO_UI_EXIT:0\n"
        elseif target=="/etc/momo/scripts/debug.sh" then output="debug fixture\n\nMOMO_UI_EXIT:0\n"
        elseif target=="/etc/init.d/momo" then
            assert(args[6]=="update_subscription" and type(args[7])=="string")
            local c=cursor();c:set("momo",args[7],"success",subscription_success);c:commit("momo")
            output="\nMOMO_UI_EXIT:0\n"
        else error("Unexpected native command: "..tostring(target)) end
    else output=command_router and command_router(args) or command_output end
    -- Match firmware oui-init.lua: no stderr reader; wait returns stdout.
    return {stdout_read_all=function() return output end,wait=function() return output end}
end}}
local m=dofile(arg[1] or "/usr/lib/oui-httpd/rpc/momo")
local passed=0
local function check(label,value) assert(value,label);passed=passed+1;print("PASS "..label) end
local function ok(label,method,args) local result,err=m[method](args or {});check(label,type(result)=="table" and result.success==true);return result end
local function reject(label,method,args) local result=m[method](args or {});check(label,type(result)=="number" or type(result)=="table" and result.err_code~=nil) end
local success,err=pcall(function()
 local config=m.get_config();local schema=config.schema;local selected_before=cursor():get("momo","config","profile")
 check("version comes from Momo and sing-box without LuCI RPC",config.version.app=="test-momo" and config.version.core=="test-core")
 check("UI version comes from installed gl-ui-momo package",config.version.ui=="2026.10.14~abcdef0-r1")
 check("field schema has no release version",schema.version==nil)
 check("LuCI link hidden when optional UI is absent",config.luci_available==false)
 assert(realfs.writefile(root.."/optional-luci.js","fixture"));check("optional LuCI UI detected",m.get_config().luci_available==true);realfs.unlink(root.."/optional-luci.js")
 local identifiers=m.get_hints();check("native users and groups",#identifiers.users==2 and #identifiers.groups==2)
 check("native cgroups exclude Momo and symlinks",#identifiers.cgroups==2 and identifiers.cgroups[2]=="services/test")
 local count=#schema.subscription.fields
 for _,s in ipairs(schema.sections) do for _,g in ipairs(s.groups) do count=count+#g.fields end end
 for _,r in pairs(schema.rules) do count=count+#r.fields end
 check("89 LuCI fields in shared schema",count==89)
 local name="中文 配置-"..token..".JSONC";local source="file:"..name
 local content=[[{ // line comment
 "url":"https://example.invalid/a//b/*c*/", /* block */ "array":[1,2,], "quoted":"a\"//b",}]]
 ok("JSONC and Unicode filename","save_profile",{source=source,text=content})
 check("JSONC round trip preserves comments",m.get_profile({source=source}).text==content)
 reject("reject invalid JSONC comma","save_profile",{source=source,text="{,}"})
 reject("reject invalid JSONC value","save_profile",{source=source,text='{"x":,}'})
 reject("reject unclosed comment","save_profile",{source=source,text="{/*"})
 reject("reject top-level array","save_profile",{source=source,text="[]"})
 local settings={}
 for _,s in ipairs(schema.sections) do settings[s.key]={};for _,g in ipairs(s.groups) do for _,f in ipairs(g.fields) do
   local value="fixture"
   if f.kind=="flag" or f.kind=="tristate" then value="1"
   elseif f.kind=="enum" then value=f.values[1]
   elseif f.kind=="uint" then value="100"
   elseif f.kind=="port" then value="123"
   elseif f.kind=="profile" then value=source
   elseif f.kind=="cron" then value="*/5 * * * *"
   elseif f.kind=="url" then value="https://example.invalid/config?a=1&b=2"
   elseif f.kind=="listen" then value="[::1]:9090"
   elseif f.kind=="ports" then value="21 80 443 1000-2000"
   elseif f.kind=="secret" then value="quote'\"secret"
   elseif f.kind=="list" then
     local hints={ip4={"198.51.100.0/24"},ip6={"2001:db8::/32"},dscp={"4","63"},fwmark={"0x80/0xff"},interfaces={"lan"}}
     value=hints[f.hint] or {"root"}
   end
   settings[s.key][f.key]=value
 end end end
 ok("save every static LuCI field","set_config",{settings=settings,apply=false})
 local read=m.get_config().settings
 for section,options in pairs(settings) do for key,value in pairs(options) do
    if type(value)=="table" then check("round trip "..section.."."..key,type(read[section][key])=="table" and #read[section][key]==#value)
    else check("round trip "..section.."."..key,read[section][key]==value) end
 end end
 local reset={mixin={}}
 for _,s in ipairs(schema.sections) do if s.key=="mixin" then for _,g in ipairs(s.groups) do for _,f in ipairs(g.fields) do reset.mixin[f.key]="" end end end end
 ok("reset all overrides to unmodified","set_config",{settings=reset})
 check("reset removes UCI override keys",next(m.get_config().settings.mixin)==nil)
 ok("disable TCP and UDP independently","set_config",{settings={proxy={tcp_mode="",udp_mode=""}}})
 check("disabled protocols remove UCI options",cursor():get("momo","proxy","tcp_mode")==nil and cursor():get("momo","proxy","udp_mode")==nil)
 ok("cron weekday and month names","set_config",{settings={config={scheduled_restart_cron="0 3 * JAN MON-FRI"}}})
 for _,case in ipairs({{"invalid port",{mixin={ntp_server_port="65536"}}},{"invalid listen",{mixin={external_control_api_listen="example.invalid:1"}}},{"invalid mode",{proxy={udp_mode="redirect"}}},{"invalid DSCP",{proxy={bypass_dscp={"64"}}}},{"invalid IP",{proxy={reserved_ip={"999.1.2.3"}}}},{"invalid ports",{proxy={proxy_tcp_dport="70000"}}},{"unknown field",{proxy={shell="x"}}},{"invalid cron",{config={scheduled_restart_cron="60 24 * * *"}}}}) do reject(case[1],"set_config",{settings=case[2]}) end
 local router={{id="",enabled="1",user={"root"},group={"root"},cgroup={"services/test"},dns="1",proxy="0"},{id="",enabled="1",user={},group={},cgroup={},dns="1",proxy="1"}}
 local lan={{id="",enabled="1",ip={"192.0.2.1"},ip6={"2001:db8::1"},mac={"02:00:00:00:00:01"},dns="1",proxy="0"},{id="",enabled="0",ip={},ip6={},mac={},dns="0",proxy="1"}}
 ok("add both access control rule groups","set_config",{settings={},rules={router_access_control=router,lan_access_control=lan}})
 local r=m.get_config().rules
 check("router rule ordering and list values",#r.router_access_control==2 and r.router_access_control[1].proxy=="0" and r.router_access_control[2].proxy=="1")
 check("LAN rule fields",#r.lan_access_control==2 and r.lan_access_control[1].mac[1]=="02:00:00:00:00:01")
 local first=r.router_access_control[1].id
 local c=cursor();c:set("momo",first,"future_option","preserve-me");c:commit("momo")
 local reversed={r.router_access_control[2],r.router_access_control[1]}
 ok("reorder access control rules","set_config",{settings={},rules={router_access_control=reversed}})
 check("rule order persists",m.get_config().rules.router_access_control[2].id==first)
 check("preserve unknown rule options",cursor():get("momo",first,"future_option")=="preserve-me")
 ok("remove access control rule","set_config",{settings={},rules={router_access_control={reversed[1]}}})
 check("removed rule deleted from UCI",cursor():get("momo",first)==nil)
 reject("reject forged rule ID","set_config",{settings={},rules={router_access_control={{id="config",enabled="1"}}}})
 reject("reject rule wrong MAC","set_config",{settings={},rules={lan_access_control={{id="",mac={"not-a-mac"}}}}})
 local a=ok("create subscription A","save_subscription",{id="",name="测试 A",url="https://example.invalid/a",info_url="",user_agent="sing-box",prefer="remote"}).id
 local b=ok("create subscription B","save_subscription",{id="",name="测试 B",url="https://example.invalid/b",prefer="local"}).id
 local ids={};for _,s in ipairs(m.get_config().subscriptions) do if s.id~=a and s.id~=b then ids[#ids+1]=s.id end end;ids[#ids+1]=b;ids[#ids+1]=a
 ok("reorder subscriptions","reorder_subscriptions",{ids=ids})
 local subs=m.get_config().subscriptions;check("subscription order persists",subs[#subs-1].id==b and subs[#subs].id==a)
 reject("reject partial subscription order","reorder_subscriptions",{ids={a}})
 ok("subscription local preference","save_profile",{source="subscription:"..a,text="{}",prefer_local=true})
 check("local preference written",cursor():get("momo",a,"prefer")=="local")
 ok("subscription remote preference","save_profile",{source="subscription:"..a,text="{}",prefer_local=false})
 check("remote preference written",cursor():get("momo",a,"prefer")=="remote")
 ok("rename selected profile","rename_profile",{name=name,new_name="重命名-"..token..".json"})
 local renamed="重命名-"..token..".json"
 check("rename updates selected UCI profile",cursor():get("momo","config","profile")=="file:"..renamed)
 reject("cannot delete selected profile","delete_profile",{name=renamed})
 ok("clear selected profile","set_config",{settings={config={profile=""}}})
 ok("delete local file","delete_profile",{name=renamed})
 reject("reject file traversal","save_profile",{source="file:../../config/momo",text="{}"})
 assert(realfs.symlink(root.."/momo",root.."/profiles/symlink.json"))
 reject("reject file symlink","save_profile",{name="symlink.json",text="{}"})
 ok("startup profile is editable","save_profile",{source="runtime",text='{/* startup */ "log":{"level":"info"},}'})
 check("startup contents preserved",m.get_profile({source="runtime"}).text:find("startup",1,true)~=nil)
 assert(realfs.writefile(root.."/run/config.json",json.encode({experimental={clash_api={external_controller="127.0.0.1:9095",secret="test-quote'-secret"}}})))
 ok("dashboard update uses safe argument vector","update_dashboard")
 check("quoted API secret passed literally",commands[#commands][9]=="Authorization: Bearer test-quote'-secret")
 check("update timeout and merged errors match SDK4",command_options.stdout_read_timeout==125000 and command_options.merge_stderr==true)
 command_output='{"message":"download failed"}\n500'
 local failed=m.update_dashboard();check("dashboard HTTP errors are reported",failed.err_code and failed.err_msg:find("HTTP 500",1,true) and failed.err_msg:find("download failed",1,true))
 command_output="curl: (7) Failed to connect\n000"
 failed=m.update_dashboard();check("dashboard connection errors are reported",failed.err_code and failed.err_msg:find("Failed to connect",1,true))
 command_output="incomplete response";reject("dashboard malformed response is not success","update_dashboard")
 command_output="";reject("dashboard empty response is not success","update_dashboard")
 command_error="proxy unavailable";reject("dashboard command spawn failure is reported","update_dashboard");command_error=nil
 command_output='{}\n200';ok("dashboard HTTP 200 is accepted","update_dashboard")
 check("complete log read",m.get_log({kind="app"}).text=="application fixture\n")
 ok("clear log","clear_log",{kind="app"});check("log cleared",m.get_log({kind="app"}).text=="")
 check("debug report download",m.debug().text=="debug fixture\n")
 check("private debug temporary file removed",debug_path and fs.lstat(debug_path)==nil)
 check("interface and client hints",#m.get_hints().mac==1)
 local prepared=m.prepare_download({name="中文报告.log",text="download fixture"});check("prepare native authenticated download",prepared.path and fs.readfile(prepared.path)=="download fixture");reject("reject invalid download filename","prepare_download",{name="../bad",text="x"})
 ok("service manager restart","service",{action="restart"});check("service uses fixed manager and action",service_calls[#service_calls].name=="momo" and service_calls[#service_calls].action=="restart")
 reject("reject service injection","service",{action="restart; false"})
 local proxy_name="中文节点 /?#'\""
 local proxy_fixture={Group={name="Group",type="Selector",now="fast",all={"fast",proxy_name}},Auto={name="Auto",type="URLTest",now="fast",all={"fast",proxy_name}},fast={name="fast",type="Hysteria2",history={{delay=45}},secret="must-not-export"},[proxy_name]={name=proxy_name,type="Hysteria2",history={}},GLOBAL={type="Selector",now="Group",all={"Group","Auto"}}}
 local mode="Rule"
 command_router=function(args)
   local method,body
   for i,value in ipairs(args) do if value=="--request" then method=args[i+1] elseif value=="--data-binary" then body=json.decode(args[i+1]) end end
   local path=args[#args]:match("http://127%.0%.0%.1:9095(.*)");assert(path,"fixed local API address")
   if path=="/proxies" then return json.encode({proxies=proxy_fixture}).."\n200" end
   if path=="/configs" then if method=="PATCH" then mode=body.mode;return "\n204" end;return json.encode({mode=mode,["mode-list"]={"Rule","Global","Direct","Custom"}}).."\n200" end
   if path=="/proxies/Group" then if method=="PUT" then proxy_fixture.Group.now=body.name;return "\n204" end;return json.encode(proxy_fixture.Group).."\n200" end
   if path=="/proxies/Auto" then return json.encode(proxy_fixture.Auto).."\n200" end
   if path:find("/delay?timeout=5000&url=",1,true) then return '{"delay":42}\n200' end
   return '{"message":"not found"}\n404'
 end
 assert(realfs.writefile(root.."/run/config.json",json.encode({experimental={clash_api={external_controller="0.0.0.0:9095",secret="test-secret"}},outbounds={{tag="Auto"},{tag="Group"}}})))
 check("Clash tab capability follows running configuration",m.get_status().clash_api==true)
 local proxies=m.get_proxies();check("native proxy groups follow profile ordering",proxies.enabled and proxies.groups[1]=="Auto" and proxies.groups[2]=="Group" and proxies.groups[3]=="GLOBAL")
 check("native proxy response omits secrets",not proxies.secret and not proxies.proxies.fast.secret)
 check("native proxy latency and modes",proxies.proxies.fast.delay==45 and #proxies.modes==4 and proxies.mode=="Rule")
 ok("switch proxy with Unicode and literal punctuation","select_proxy",{group="Group",name=proxy_name});check("selection JSON preserves node name",proxy_fixture.Group.now==proxy_name)
 reject("cannot select unknown group member","select_proxy",{group="Group",name="missing"})
 reject("automatic URLTest groups cannot be manually selected","select_proxy",{group="Auto",name="fast"})
 reject("proxy selection rejects missing group","select_proxy",{name="fast"})
 ok("switch to backend advertised custom mode","set_clash_mode",{mode="Custom"});check("Clash mode updates",mode=="Custom")
 reject("reject unsupported mode","set_clash_mode",{mode="arbitrary"})
 check("test proxy latency",m.test_proxy({name=proxy_name}).delay==42)
 local delay_args=commands[#commands];check("proxy name is percent encoded as one path segment",delay_args[#delay_args]:find("%20%2F%3F%23%27%22/delay",1,true)~=nil)
 check("latency timeout bounded",command_options.stdout_read_timeout==13000)
 command_router=function()return '{"message":"backend unavailable"}\n503'end
 reject("proxy API failure is returned","get_proxies")
 command_router=function()return 'invalid-json\n200'end
 reject("malformed proxy JSON is returned as error","get_proxies")
 command_router=function(args)
   for i,value in ipairs(args) do if value=="--request" and args[i+1]=="PATCH" then return "invalid-json\n200" end end
   return '{"mode":"Rule","mode-list":["Rule","Global","Direct"]}\n200'
 end
 reject("malformed mode update response cannot report success","set_clash_mode",{mode="Rule"})
 command_router=nil
 service_running=false;check("stopped service hides Clash tab",m.get_status().clash_api==false);service_running=true
 assert(realfs.writefile(root.."/run/config.json","{}"));local before_disabled=#commands
 check("disabled Clash API hides native tab",m.get_status().clash_api==false and m.get_proxies().enabled==false and #commands==before_disabled)
 reject("disabled Clash API cannot switch proxies","select_proxy",{group="Group",name="fast"})
 for _,binding in ipairs({{"[::]:9095","[::1]"},{":9095","127.0.0.1"},{"localhost:9095","127.0.0.1"},{"192.0.2.1:9095","192.0.2.1"}}) do
   assert(realfs.writefile(root.."/run/config.json",json.encode({experimental={clash_api={external_controller=binding[1]}}})))
   check("Clash binding "..binding[1],m.get_dashboard().host==binding[2])
 end
 assert(realfs.writefile(root.."/run/config.json",json.encode({experimental={clash_api={external_controller="127.0.0.1:9095",secret="test-secret"}}})))
 ok("native subscription update","update_subscription",{id=a})
 local update_args=commands[#commands];check("subscription ID remains a literal command argument",update_args[5]=="/etc/init.d/momo" and update_args[6]=="update_subscription" and update_args[7]==a)
 check("subscription update retains long timeout",command_options.stdout_read_timeout==600000)
 subscription_success="0";reject("zero-exit failed subscription is rejected","update_subscription",{id=a});subscription_success="1"
 for _,case in ipairs({{"service.list","get_status"},{"rc.init","service",{action="restart"}}}) do
   for _,fault in ipairs({{err="audit timeout"},{result="malformed result"}}) do
     bus_faults[case[1]]=fault
     local survived,result=pcall(m[case[2]],case[3] or {})
     check(case[2].." handles RPC "..(fault.err or "invalid response"),survived and type(result)=="table" and result.err_code~=nil and type(result.err_msg)=="string")
   end
   bus_faults[case[1]]=nil
 end
 bus_faults["luci-rpc.getHostHints"]={err="optional host hints unavailable"}
 local hints=m.get_hints();check("optional host hint failure preserves interface hints",hints.interfaces and hints.ip4 and not hints.err_code)
 bus_faults["luci-rpc.getHostHints"]=nil
 for _,case in ipairs({{"/etc/momo/scripts/debug.sh","debug",{}},{"/etc/init.d/momo","update_subscription",{id=a}}}) do
   for _,output in ipairs({"native failure\nMOMO_UI_EXIT:1\n","truncated output"}) do
     native_faults[case[1]]=output;reject("native command failure: "..case[2],case[2],case[3])
   end
   native_faults[case[1]]=nil
 end
 check("failed debug temporary file removed",debug_path and fs.lstat(debug_path)==nil)
 native_faults["/usr/bin/sing-box"]="missing core\nMOMO_UI_EXIT:127\n";check("core version failure keeps configuration available",m.get_config().schema and m.get_config().version.core=="");native_faults["/usr/bin/sing-box"]=nil
 assert(realfs.writefile(root.."/installed",""));assert(realfs.writefile(root.."/opkg-status","Package: momo\nVersion: opkg-fixture\nStatus: install ok installed\n\n"));check("opkg Momo version fallback",m.get_config().version.app=="opkg-fixture")
 assert(realfs.writefile(root.."/opkg-status","Package: momo\nVersion: opkg-fixture\nStatus: install ok installed\n\nPackage: gl-ui-momo\nVersion: opkg-ui-fixture\nStatus: install ok installed\n\n"));check("opkg UI version fallback",m.get_config().version.ui=="opkg-ui-fixture")
 assert(realfs.writefile(root.."/installed","P:gl-ui-momo\nV:2026.10.14~fedcba0-r1\n\n"));check("UI version refreshes from installed package metadata",m.get_config().version.ui=="2026.10.14~fedcba0-r1")
 assert(realfs.writefile(root.."/installed","P:gl-sdk4-ui-momo\nV:legacy-ui\n\n"));assert(realfs.writefile(root.."/opkg-status",""));check("missing UI package does not use legacy or schema version",m.get_config().version.ui=="")
 -- Firmware uses yielding sockets under Lua 5.1; synchronous mocks miss pcall failures.
 bus_yield=true;command_yield=true
 for _,case in ipairs({{"get_status"},{"get_config"},{"get_hints"},{"debug"},{"update_subscription",{id=a}},{"service",{action="restart"}}}) do
   local co=coroutine.create(function() return m[case[1]](case[2] or {}) end)
   local result,steps
   steps=0
   repeat
     local resumed,value=coroutine.resume(co);assert(resumed,value);result=value;steps=steps+1;assert(steps<10,"RPC coroutine did not finish")
   until coroutine.status(co)=="dead"
   check(case[1].." supports yielding SDK4 RPC",steps>1 and type(result)=="table" and not result.err_code and (case[1]~="get_hints" or #result.mac==1))
 end
 bus_yield=false;command_yield=false
end)
os.execute("rm -rf "..root)
if not success then io.stderr:write(tostring(err),"\n");os.exit(1) end
print(passed.." isolated model checks passed; live router configuration untouched")
