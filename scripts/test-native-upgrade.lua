-- Exercise the native package adapter with mocked commands and no package changes.
local json = require "cjson.safe"
package.loaded["oui.rpc"] = {ERROR_CODE_INTERNAL_ERROR = -32603}
local commands, captures = {}, {}
local available, installed = "2026.10.14~0123456-r1", "2026.10.14~fedcba0-r1"
local fault, yielding
local native = {status = 200, body = '0 {"info":"official installer"}'}
ngx = {HTTP_POST = 8, HTTP_OK = 200, location = {}, pipe = {}}
ngx.location.capture = function(path, args)
    captures[#captures + 1] = {path = path, request = assert(json.decode(args.body))}
    return native
end
ngx.pipe.spawn = function(args, options)
    local argv = {}; for i = 5, #args do argv[#argv + 1] = args[i] end
    commands[#commands + 1] = argv
    assert(options.merge_stderr == true)
    if yielding then coroutine.yield("command pending") end
    local kind = argv[2] == "query" and argv[3] or argv[1] == "/usr/bin/update_plugins_db" and "refresh" or "install"
    local text = ""
    if kind == "--available" then text = "Version: " .. available .. "\n"
    elseif kind == "--installed" then text = "Version: " .. installed .. "\n"
    elseif kind == "install" then
        assert(argv[1] == "/usr/bin/apk" and argv[2] == "--wait" and argv[4] == "add" and argv[5] == "--upgrade")
        assert(argv[6] == "gl-ui-momo=" .. available)
        if fault ~= "mismatch" then installed = available end
        text = "package operation complete\n"
    end
    local output = text .. "\nMOMO_UI_EXIT:0\n"
    if fault == kind then output = "fixture failure\nMOMO_UI_EXIT:1\n" end
    if fault == "truncated" then output = "incomplete response" end
    return {stdout_read_all = function() return output end}
end
local adapter = dofile(assert(arg[1]))
local passed = 0
local function check(label, value) assert(value, label); passed = passed + 1; print("PASS " .. label) end
local function reset()
    commands = {}; fault = nil; available = "2026.10.14~0123456-r1"; installed = "2026.10.14~fedcba0-r1"
end
local args = {name = {"gl-ui-momo"}}
local result = adapter.install_package(args)
check("upgrades to exact source version even when hash sorts lower",result.info and installed == available and #commands == 4)
check("refreshes native package database after verified install",commands[4][1] == "/usr/bin/update_plugins_db")
check("no new RPC methods beyond native install override",adapter.install_package and next(adapter, "install_package") == nil)
for _, params in ipairs({{name = {"curl"}}, {name = {"gl-ui-momo", "curl"}}, {name = {"gl-ui-momo;false"}}}) do
    reset(); result = adapter.install_package(params)
    local capture = captures[#captures]
    check("other requests use official installer",result.info == "official installer" and #commands == 0 and capture.path == "/cgi-bin/glc" and capture.request.method == "install_package" and capture.request.args.name[1] == params.name[1])
end
native = {status = 503, body = "unavailable"}; check("native HTTP failures retain RPC error",adapter.install_package({name = {"curl"}}) == -32603)
native = {status = 200, body = "-32004 official failure"}; local code, err = adapter.install_package({name = {"curl"}}); check("native error code and message retained",code == -32004 and err == "official failure")
native = {status = 200, body = "-32602"}; check("native errors without message retain code",adapter.install_package({name = {"curl"}}) == -32602)
native = {status = 200}; check("missing native response body is reported",adapter.install_package({name = {"curl"}}) == -32603)
for _, case in ipairs({{"--available",1},{"install",2},{"mismatch",3},{"refresh",4},{"truncated",1}}) do
    reset(); fault = case[1]; result = adapter.install_package(args)
    check("reports " .. fault .. " failure",result.err_msg and #commands == case[2])
end
for _, invalid in ipairs({"", "1;false", "1'", "1/../../etc/passwd"}) do
    reset(); available = invalid; result = adapter.install_package(args)
    check("rejects invalid source version",result.err_msg and #commands == 1)
end
reset(); yielding = true
local co = coroutine.create(function() return adapter.install_package(args) end)
local steps = 0
repeat local ok, value = coroutine.resume(co); assert(ok,value); result = value; steps = steps + 1 until coroutine.status(co) == "dead"
check("supports yielding SDK4 command proxy",steps == 5 and result.info)
print(passed .. " native package adapter checks passed; installed packages untouched")
