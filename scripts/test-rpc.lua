-- Live authenticated endpoint checks. Only creates disposable local files;
-- never changes subscription/ACL sections, live logs or service state.
local json=require "cjson.safe"
local fs=require "nixio.fs"
local nixio=require "nixio"
local token=assert(fs.readfile("/proc/sys/kernel/random/uuid")):match("^[%x%-]+")
local request_path="/tmp/momo-test-"..token
local name="界面测试-"..token..".jsonc"
local renamed="重命名-"..token..".jsonc"
local passed=0
local function call(method,args)
 local f=assert(nixio.open(request_path,nixio.open_flags("wronly","creat","excl"),600))
 local body=assert(json.encode({jsonrpc="2.0",id=1,method="call",params={"","momo",method,args or {}}}))
 assert(f:write(body)==#body);f:close()
 local timeout=method=="debug" and 130 or 30
 local proc=assert(io.popen("curl -sS --max-time "..timeout.." -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @"..request_path.." http://127.0.0.1/rpc"))
 local raw=proc:read("*a");proc:close();fs.unlink(request_path)
 return assert(json.decode(raw))
end
local function check(label,value)assert(value,label);passed=passed+1;print("PASS "..label)end
local function reject(label,method,args)local r=call(method,args);check(label,r.error~=nil or type(r.result)=="table" and r.result.err_code~=nil)end
local before=assert(fs.readfile("/etc/config/momo"))
local success,err=pcall(function()
 local config=call("get_config").result;check("read all sections and schema",config and config.schema.version=="1.3.0" and config.settings.log and config.settings.procd)
 check("Momo and core versions without LuCI API",config.version.app~="" and config.version.core~="")
 if os.getenv("MOMO_REQUIRE_NO_LUCI")=="1" then
   check("LuCI app runtime files are absent",fs.stat("/usr/share/rpcd/ucode/luci.momo")==nil and fs.stat("/www/luci-static/resources/view/momo/app.js")==nil)
   local listing=assert(io.popen("ubus -S list luci.momo 2>/dev/null"));local objects=listing:read("*a");listing:close();check("luci.momo RPC is unregistered",not objects:find("luci.momo",1,true))
   check("optional advanced link hidden",config.luci_available==false)
   if config.settings.config.enabled=="1" and call("get_status").result.running then
     local report=call("debug").result;check("native debug report without LuCI RPC",report and report.text and report.text:find("Momo Debug Info",1,true)~=nil)
   end
 end
 check("both ACL groups",type(config.rules.router_access_control)=="table" and type(config.rules.lan_access_control)=="table")
 check("LuCI link port",config.luci_port==8080)
 check("service status",type(call("get_status").result.running)=="boolean")
 check("interface and host hints",type(call("get_hints").result.interfaces)=="table")
 check("current source profile",#call("get_profile",{source=config.settings.config.profile}).result.text>0)
 check("startup editor",call("get_profile",{source="runtime"}).result.readonly==false)
 check("complete application log",type(call("get_log",{kind="app"}).result.text)=="string")
 check("complete core log",type(call("get_log",{kind="core"}).result.text)=="string")
 check("dashboard API",type(call("get_dashboard").result.port)=="number")
 if call("get_status").result.clash_api then
   local proxy=call("get_proxies").result
   check("native proxy list and mode",proxy.enabled and type(proxy.proxies)=="table" and type(proxy.groups)=="table" and type(proxy.mode)=="string")
   check("proxy response does not expose credentials",proxy.secret==nil and proxy.port==nil)
   local selected
   for _,name in ipairs(proxy.groups) do local group=proxy.proxies[name];if group.type=="Selector" and group.now then selected=group;break end end
   if selected then
     check("native selector accepts current member",call("select_proxy",{group=selected.name,name=selected.now}).result.success)
     check("selector remains unchanged after no-op test",call("get_proxies").result.proxies[selected.name].now==selected.now)
     reject("selector rejects unknown member","select_proxy",{group=selected.name,name="__momo_audit_missing__"})
   end
   check("native mode accepts current mode",call("set_clash_mode",{mode=proxy.mode}).result.success)
   check("mode remains unchanged after no-op test",call("get_proxies").result.mode==proxy.mode)
   reject("reject unknown Clash mode","set_clash_mode",{mode="__momo_audit_missing__"})
   reject("latency failure is a structured error","test_proxy",{name="__momo_audit_missing__"})
 end
 reject("service injection","service",{action="restart; touch /tmp/invalid"})
 reject("unknown section","set_config",{settings={network={enabled="1"}}})
 reject("unknown option","set_config",{settings={config={unknown="1"}}})
 reject("invalid mode","set_config",{settings={proxy={udp_mode="redirect"}}})
 reject("invalid cron","set_config",{settings={config={scheduled_restart_cron="60 24 * * *"}}})
 reject("invalid address","set_config",{settings={proxy={reserved_ip={"999.0.0.1"}}}})
 reject("invalid DSCP","set_config",{settings={proxy={bypass_dscp={"64"}}}})
 reject("forged ACL row","set_config",{settings={},rules={router_access_control={{id="config",enabled="1"}}}})
 reject("invalid MAC","set_config",{settings={},rules={lan_access_control={{id="",mac={"invalid"}}}}})
 reject("partial subscription ordering","reorder_subscriptions",{ids={}})
 reject("file traversal","get_profile",{name="../../etc/shadow.json"})
 reject("invalid JSONC","save_profile",{name=name,text="{,}"})
 reject("JSON array","save_profile",{name=name,text="[]"})
 local content='{ /* JSONC */ "url":"https://example.invalid/a//b", "padding":"'..string.rep("x",32768)..'",}'
 check("save Unicode JSONC over 32 KiB",call("save_profile",{name=name,text=content}).result.success)
 check("JSONC file round trip",call("get_profile",{name=name}).result.text==content)
 local mode=assert(fs.stat("/etc/momo/profiles/"..name)).modestr;check("private file permissions",mode=="rw-------" or mode=="-rw-------")
 check("rename local file",call("rename_profile",{name=name,new_name=renamed}).result.success)
 check("renamed file contents",call("get_profile",{name=renamed}).result.text==content)
 check("delete disposable file",call("delete_profile",{name=renamed}).result.success)
 assert(fs.symlink("/etc/config/momo","/etc/momo/profiles/"..name))
 reject("file symlink","save_profile",{name=name,text="{}"});fs.unlink("/etc/momo/profiles/"..name)
 reject("invalid subscription URL","save_subscription",{name="test",url="file:///etc/shadow",prefer="remote"})
 local prepared=call("prepare_download",{name="报告.log",text="native-download-fixture"}).result
 check("prepare authenticated native download",prepared and prepared.path:match("^/tmp/momo%-ui%-downloads/[%x%-]+%.bin$"))
 local headers=request_path..".headers"
 local proc=assert(io.popen("curl -sS --max-time 15 -D "..headers.." -H 'glinet: 1' -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode path="..prepared.path.." --data-urlencode filename=momo-fixture.log --data-urlencode delete=1 http://127.0.0.1/download"))
 local downloaded=proc:read("*a");proc:close()
 check("native HTTP download contents",downloaded=="native-download-fixture")
 local response=assert(fs.readfile(headers)):lower();fs.unlink(headers)
 check("native attachment headers",response:find("application/octet%-stream") and response:find("content%-disposition: attachment"))
 check("native export removed after download",fs.lstat(prepared.path)==nil)
 check("save current options without restart",call("set_config",{settings=config.settings,apply=false}).result.success)
 check("live configuration byte-for-byte preserved",fs.readfile("/etc/config/momo")==before)
end)
fs.unlink(request_path);fs.unlink("/etc/momo/profiles/"..name);fs.unlink("/etc/momo/profiles/"..renamed)
if not success then io.stderr:write(tostring(err),"\n");os.exit(1)end
print(passed.." live RPC checks passed")
