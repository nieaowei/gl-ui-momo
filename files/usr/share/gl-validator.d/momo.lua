-- The adapter applies the shared field schema and checks every filename/source.
-- Permit Unicode, JSONC, URLs and secrets through the SDK's generic text filter.
local function string_value(v) return type(v)=="string" end
return {
    set_config={settings=function(v) return type(v)=="table" end,rules=function(v) return type(v)=="table" end},
    save_subscription={name=string_value,url=string_value,info_url=string_value,user_agent=string_value},
    get_profile={source=string_value,name=string_value},
    save_profile={source=string_value,name=string_value,text=string_value},
    rename_profile={name=string_value,new_name=string_value},
    delete_profile={name=string_value},
    prepare_download={name=string_value,text=string_value},
    select_proxy={group=string_value,name=string_value},
    set_clash_mode={mode=string_value},
    test_proxy={name=string_value}
}
