/* Native SDK4 view. Uses the router's Vue runtime, GL components and login session. */
module.exports = (function () {
    'use strict';
    var words = {
        description: ['使用 sing-box 管理透明代理，修改后点击“保存并应用”生效。', 'Manage transparent proxy with sing-box. Save and apply to activate changes.'],
        running: ['运行中', 'Running'], stopped: ['未运行', 'Stopped'], enabled: ['启用 Momo', 'Enable Momo'],
        status: ['服务状态', 'Service status'], version: ['版本', 'Version'], core: ['内核', 'Core'],
        general: ['基本设置', 'General'], proxy: ['代理设置', 'Proxy'], mixin: ['覆写设置', 'Overrides'],
        subscriptions: ['订阅管理', 'Subscriptions'], files: ['配置文件', 'Profiles'], logs: ['日志', 'Logs'],
        profile: ['当前配置', 'Selected profile'], start_delay: ['启动延迟（秒）', 'Start delay (seconds)'],
        scheduled_restart: ['定时重启', 'Scheduled restart'], scheduled_restart_cron: ['重启计划（Cron）', 'Restart schedule (Cron)'],
        test_profile: ['启动前检查配置', 'Check profile before starting'], core_only: ['仅运行内核', 'Core only'],
        fast_reload: ['快速重载', 'Fast reload'], transparent: ['启用透明代理', 'Enable transparent proxy'],
        ipv4_dns_hijack: ['IPv4 DNS 劫持', 'IPv4 DNS hijacking'], ipv6_dns_hijack: ['IPv6 DNS 劫持', 'IPv6 DNS hijacking'],
        ipv4_proxy: ['IPv4 代理', 'IPv4 proxy'], ipv6_proxy: ['IPv6 代理', 'IPv6 proxy'],
        router_proxy: ['代理路由器流量', 'Proxy router traffic'], lan_proxy: ['代理局域网流量', 'Proxy LAN traffic'],
        fake_ip_ping_hijack: ['Fake IP Ping 劫持', 'Fake IP ping hijacking'],
        bypass_china_mainland_ip: ['绕过中国大陆 IPv4', 'Bypass mainland China IPv4'],
        bypass_china_mainland_ip6: ['绕过中国大陆 IPv6', 'Bypass mainland China IPv6'],
        tcp_mode: ['TCP 代理方式', 'TCP proxy mode'], udp_mode: ['UDP 代理方式', 'UDP proxy mode'],
        log_level: ['日志级别', 'Log level'], log_disabled: ['禁用内核日志', 'Disable core logging'], log_timestamp: ['记录时间戳', 'Log timestamps'],
        cache_enabled: ['启用缓存', 'Enable cache'], cache_store_fakeip: ['保存 Fake IP 缓存', 'Store Fake IP cache'],
        cache_store_rdrc: ['保存 RDRC 缓存', 'Store RDRC cache'], dns_independent_cache: ['独立 DNS 缓存', 'Independent DNS cache'],
        dns_reverse_mapping: ['DNS 反向映射', 'DNS reverse mapping'],
        save: ['保存', 'Save'], apply: ['保存并应用', 'Save and apply'], refresh: ['刷新', 'Refresh'],
        restart: ['重启服务', 'Restart'], reload: ['重载服务', 'Reload'], stop: ['停止服务', 'Stop'], start: ['启动服务', 'Start'],
        dashboard: ['打开控制面板', 'Open dashboard'], advanced: ['LuCI 高级设置', 'Advanced settings in LuCI'],
        saved: ['已保存', 'Saved'], applied: ['已保存，正在重启服务，请查看运行状态。', 'Saved. Restart requested; check service status.'],
        requested: ['服务操作已提交，请查看运行状态。', 'Service action requested; check service status.'],
        error: ['操作失败', 'Operation failed'], empty: ['暂无数据', 'No data'], loading: ['正在加载…', 'Loading…'],
        name: ['名称', 'Name'], url: ['订阅地址', 'Subscription URL'], info_url: ['流量信息地址（可选）', 'Usage URL (optional)'],
        user_agent: ['User Agent', 'User Agent'], prefer: ['配置优先级', 'Profile preference'], remote: ['远程', 'Remote'], local: ['本地', 'Local'],
        add: ['添加订阅', 'Add subscription'], edit: ['编辑', 'Edit'], cancel: ['取消', 'Cancel'], delete: ['删除', 'Delete'], update: ['更新订阅', 'Update'],
        delete_confirm: ['确定删除此订阅？', 'Delete this subscription?'], updated: ['订阅已更新', 'Subscription updated'],
        usage: ['已用 / 总量', 'Used / Total'], expire: ['到期时间', 'Expires'], update_time: ['上次更新', 'Last updated'],
        filename: ['文件名（.json）', 'Filename (.json)'], content: ['JSON 配置内容', 'JSON profile content'],
        load: ['读取文件', 'Load file'], save_file: ['保存文件', 'Save file'], new_file: ['新建文件', 'New file'],
        file_tip: ['可读取和编辑本地文件、订阅配置，也可导入 JSON 文件。保存文件不会立即影响正在运行的代理。', 'Read and edit local files and subscription profiles, or import JSON files. Saving a file does not immediately change the running proxy.'],
        file_source: ['选择配置', 'Choose profile'], file_label: ['本地文件：', 'Local file: '], sub_label: ['订阅：', 'Subscription: '],
        runtime: ['启动配置（只读）', 'Startup profile (read-only)'], runtime_tip: ['启动配置由 Momo 自动生成。要修改，请编辑来源配置或另存为本地文件。', 'Momo generates this startup profile. Edit its source or save a local copy to make changes.'],
        sub_tip: ['保存时默认使用本地修改，避免重启后被远程配置覆盖。手动更新订阅仍会覆盖文件内容。', 'Saving prefers local edits by default so restarting keeps your changes. Manually updating the subscription still replaces its content.'],
        prefer_local: ['本地修改优先', 'Prefer local edits'], remote_tip: ['当前为远程优先，重启可能重新下载并覆盖修改。', 'Remote is preferred; restarting may download and replace your changes.'],
        import_file: ['导入 JSON 文件', 'Import JSON file'], download_file: ['下载文件', 'Download file'], copy_file: ['另存为本地文件', 'Save a local copy'],
        save_activate: ['保存并使用此配置', 'Save and activate this profile'], file_saved: ['文件已保存，尚未重新加载服务。', 'Profile saved. The service has not been reloaded.'],
        file_discard: ['编辑器有未保存的修改，是否丢弃？', 'Discard unsaved profile edits?'], file_empty: ['请先选择配置，或新建、导入文件。', 'Choose a profile, create a file, or import one.'],
        file_too_large: ['文件不能超过 2 MiB。', 'File must not exceed 2 MiB.'],
        app_log: ['应用日志', 'Application log'], core_log: ['内核日志', 'Core log'],
        log_tip: ['显示最近 200 行。', 'Showing the last 200 lines.'],
        no_profile: ['请选择配置', 'Select a profile'], missing: ['请填写名称和订阅地址。', 'Enter a name and subscription URL.'],
        unsaved: ['有未保存的修改', 'Unsaved changes'], no_changes: ['配置已同步', 'Configuration synchronized'],
        file_invalid: ['请输入有效的 .json 文件名和 JSON 对象。', 'Enter a valid .json filename and JSON object.'],
        refresh_confirm: ['刷新会丢弃未保存的修改，是否继续？', 'Refresh and discard unsaved changes?']
    };
    var css = [
        '.momo-native .momo-main{padding:0;min-width:0}',
        '.momo-native .momo-desc{margin:0 0 16px;line-height:1.6;color:var(--text-subtitle)}',
        '.momo-native .momo-status{display:flex;align-items:center;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;margin-bottom:20px}',
        '.momo-native .momo-status strong{font-size:16px;font-weight:600}',
        '.momo-native .momo-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--text-disabled);margin-right:8px}',
        '.momo-native .momo-dot.on{background:var(--success,#20a87b)}',
        '.momo-native .momo-versions{font-size:11px;color:var(--text-subtitle);margin-top:6px;line-height:1.5}',
        '.momo-native .momo-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;min-width:0}',
        '.momo-native .gl-btn,.momo-confirm .gl-btn{height:36px;min-height:36px;margin:0;padding:0 18px;font-size:14px;line-height:20px;white-space:nowrap;flex-shrink:0}',
        '.momo-native .gl-btn:active:not(.is-disabled):not(.is-loading),.momo-confirm .gl-btn:active:not(.is-disabled):not(.is-loading){padding:0 16px}',
        '.momo-native .momo-tabs{display:flex;gap:24px;border-bottom:1px solid var(--border);margin:0 0 16px;overflow-x:auto;scrollbar-width:thin}',
        '.momo-native .momo-tab{height:42px;flex:0 0 auto;padding:0 2px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--text-subtitle);font:inherit;cursor:pointer;white-space:nowrap}',
        '.momo-native .momo-tab.is-active{color:var(--primary);border-bottom-color:var(--primary);font-weight:600}',
        '.momo-native .momo-tab:hover{color:var(--primary)}',
        '.momo-native .momo-tab:focus-visible,.momo-native .momo-import:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}',
        '.momo-native .momo-body{min-width:0}',
        '.momo-native .momo-group{margin:0 0 12px;border:1px solid var(--border);border-radius:5px;overflow:hidden}',
        '.momo-native .momo-group>summary{cursor:pointer;padding:12px 16px;font-weight:600;font-size:14px;line-height:20px;background:var(--background-subtitle);color:var(--text-subtitle)}',
        '.momo-native .momo-group-content{padding:0 16px 12px}',
        '.momo-native .momo-row{display:flex;gap:24px;align-items:center;justify-content:space-between;min-height:52px;box-sizing:border-box;border-bottom:1px solid var(--border);padding:8px 0}',
        '.momo-native .momo-row:last-child{border-bottom:0}',
        '.momo-native .momo-label{flex:1;min-width:0;line-height:1.5;overflow-wrap:anywhere}',
        '.momo-native .momo-control{width:320px;max-width:55%;flex-shrink:0;min-width:0}',
        '.momo-native .momo-control .el-select{width:100%}',
        '.momo-native .momo-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)}',
        '.momo-native .momo-muted,.momo-native .momo-field-hint{font-size:12px;color:var(--text-subtitle);line-height:1.6;margin:8px 0}',
        '.momo-native .momo-rule{border:1px solid var(--border);border-radius:5px;padding:0 14px 8px;margin:12px 0}',
        '.momo-native .momo-rule-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--border)}',
        '.momo-native .momo-sub{padding:16px;border:1px solid var(--border);border-radius:5px;margin-top:12px}',
        '.momo-native .momo-sub-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}',
        '.momo-native .momo-sub-head strong{overflow-wrap:anywhere;min-width:0}',
        '.momo-native .momo-sub-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 24px;font-size:12px;color:var(--text-subtitle);margin-top:14px;line-height:1.6;overflow-wrap:anywhere}',
        '.momo-native .momo-editor{margin-top:16px;min-width:0}',
        '.momo-native .momo-sub-editor{padding:0 16px 16px;border:1px solid var(--border);border-radius:5px}',
        '.momo-native .momo-editor .el-textarea__inner{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;line-height:1.6;min-height:360px;padding:12px;tab-size:2;resize:vertical}',
        '.momo-native .momo-toolbar{margin:16px 0 12px}',
        '.momo-native .momo-import{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 18px;border:1px solid var(--text-weak);border-radius:20px;color:var(--text-weak);cursor:pointer;white-space:nowrap;font-size:14px}',
        '.momo-native .momo-import:hover{background:var(--background-main)}',
        '.momo-native .momo-import.is-disabled{opacity:.4;cursor:not-allowed}',
        '.momo-native .momo-log-options{display:flex;gap:12px 28px;flex-wrap:wrap;align-items:center}',
        '.momo-native .momo-log-options .momo-row{gap:12px;border:0;min-height:40px;padding:0}',
        '.momo-native .momo-log{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;height:420px;max-height:65vh;overflow:auto;margin:8px 0 0;padding:12px 16px;border:1px solid var(--border);border-radius:5px;background:var(--background-subtitle);color:var(--text-regular);box-sizing:border-box}',
        '.momo-native .momo-error{color:var(--error,#d95050);margin:12px 0;line-height:1.6;overflow-wrap:anywhere}',
        '.momo-native .momo-notice{margin:12px 0;color:var(--success,#20a87b);line-height:1.6}',
        '.momo-native .momo-advanced{margin-top:16px;font-size:12px}',
        '.momo-confirm .momo-actions{display:flex;justify-content:flex-end;gap:8px}',
        '@media(max-width:767px){.momo-native .momo-status{align-items:flex-start}.momo-native .momo-tabs{gap:20px}.momo-native .momo-group>summary{padding:10px 12px}.momo-native .momo-group-content{padding:0 12px 12px}.momo-native .momo-row{gap:8px;flex-wrap:wrap;padding:10px 0}.momo-native .momo-control{width:100%;max-width:100%}.momo-native .momo-label{flex-basis:100%}.momo-native .momo-row.is-switch{flex-wrap:nowrap;min-height:48px}.momo-native .momo-row.is-switch .momo-label{flex-basis:auto}.momo-native .momo-sub-info{grid-template-columns:1fr}.momo-native .momo-footer{align-items:flex-start}.momo-native .momo-footer>.momo-actions{width:100%;justify-content:flex-end}.momo-native .momo-log-options .momo-label{flex-basis:auto}.momo-native .momo-editor .el-textarea__inner{min-height:320px}.momo-native .momo-rule{padding:0 10px 8px}.momo-native .momo-import,.momo-native .gl-btn{padding:0 14px}}'
    ].join('\n');
    Object.assign(words,{"update_dashboard": ["更新控制面板", "Update dashboard"], "dashboard_updated": ["控制面板已更新", "Dashboard updated"], "unmodified": ["不覆写", "Unmodified"], "disabled": ["禁用", "Disabled"], "on": ["启用", "Enabled"], "off": ["关闭", "Disabled"], "list_hint": ["输入后按回车添加，可添加多项", "Type and press Enter to add multiple values"], "add_rule": ["添加规则", "Add rule"], "remove_rule": ["移除规则", "Remove rule"], "up": ["上移", "Move up"], "down": ["下移", "Move down"], "rules_hint": ["规则按从上到下的顺序匹配。修改后保存并应用。", "Rules match from top to bottom. Save and apply changes."], "clear_log": ["清空日志", "Clear log"], "clear_log_confirm": ["确定清空当前日志？", "Clear this log?"], "auto_refresh": ["自动刷新", "Auto refresh"], "follow_log": ["跟随日志底部", "Follow log output"], "scroll_bottom": ["滚动到底部", "Scroll to bottom"], "debug_download": ["生成并下载调试报告", "Generate and download debug report"], "download_log": ["下载完整日志", "Download complete log"], "rename_file": ["重命名", "Rename file"], "delete_file": ["删除文件", "Delete file"], "delete_file_confirm": ["确定删除此本地配置文件？", "Delete this local profile file?"], "new_name": ["新文件名", "New filename"], "save_reload": ["保存并重载服务", "Save and reload service"], "leave_confirm": ["有未保存的设置、规则或文件修改，确定离开？", "Leave and discard unsaved settings, rules or profile edits?"], "file_invalid": ["请输入有效文件名，并填写 JSON 或 JSONC 对象。", "Enter a valid filename and a JSON or JSONC object."], "runtime": ["启动配置", "Startup profile"], "runtime_tip": ["此文件由 Momo 自动生成，可直接编辑保存；重载或重启时会根据来源配置重新生成。需要保留的修改请编辑来源配置。", "Momo generates this file. You can edit and save it; reloading or restarting regenerates it from the source profile. Edit the source for persistent changes."], "file_tip": ["支持本地文件、订阅和启动配置，可导入、下载、重命名及删除本地文件。保存支持 JSONC 注释和中文文件名。", "Edit local files, subscriptions and startup profiles; import, download, rename or delete local files. JSONC comments and Unicode filenames are supported."], "content": ["JSON / JSONC 配置内容", "JSON / JSONC profile content"], "filename": ["文件名", "Filename"], "log_tip": ["显示完整日志；可自动刷新、下载或清空。", "Showing the complete log. Refresh automatically, download, or clear it."], "loading_hints": ["正在加载接口和客户端提示…", "Loading interface and client hints…"]});
    Object.assign(words,{
        proxies:['代理切换','Proxy switching'],proxy_search:['搜索代理组或节点','Search groups or nodes'],
        clash_mode:['运行模式','Mode'],Rule:['规则','Rule'],Global:['全局','Global'],Direct:['直连','Direct'],
        proxy_current:['当前','Current'],proxy_test:['测速','Test latency'],proxy_test_group:['本组测速','Test group'],
        proxy_auto:['此组由内核自动选择节点','The core selects this group automatically'],
        proxy_live:['切换即时生效，与控制面板同步。','Changes take effect immediately and stay in sync with the dashboard.'],
        proxy_selected:['代理选择已更新','Proxy selection updated'],proxy_mode_saved:['运行模式已更新','Mode updated'],
        proxy_unavailable:['Clash API 未启用或服务已停止。','Clash API is disabled or the service is stopped.'],
        proxy_no_groups:['没有匹配的代理组。','No matching proxy groups.'],proxy_unknown:['未测速','Not tested'],
        proxy_timeout:['超时','Timeout'],proxy_testing:['测速中…','Testing…'],proxy_test_done:['测速完成','Latency tests complete']
    });
    css += [
        '.momo-native .momo-proxy-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px}',
        '.momo-native .momo-proxy-search{flex:1;min-width:200px}',
        '.momo-native .momo-mode{display:flex;gap:10px;align-items:center}',
        '.momo-native .momo-mode .el-select{width:130px}',
        '.momo-native .momo-page-proxies>.momo-muted{font-size:12px;margin:6px 0}',
        '.momo-native .momo-proxy-group-wrap{position:relative;margin-bottom:8px}',
        '.momo-native .momo-proxy-group{margin-bottom:0}',
        '.momo-native .momo-proxy-group>summary{box-sizing:border-box;min-height:40px;padding:10px 56px 10px 12px;font-size:13px;line-height:18px}',
        '.momo-native .momo-proxy-group-action{position:absolute;top:2px;right:8px}',
        '.momo-native .momo-proxy-group-probe{display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--text-subtitle);cursor:pointer}',
        '.momo-native .momo-proxy-group-probe:hover:not(:disabled){color:var(--primary);background:var(--background-main)}',
        '.momo-native .momo-proxy-group>.momo-group-content{padding:0 10px 8px}',
        '.momo-native .momo-proxy-group .momo-proxy-grid{padding-top:8px}',
        '.momo-native .momo-proxy-summary{display:inline-flex;width:calc(100% - 18px);vertical-align:middle;align-items:center;justify-content:space-between;gap:8px 16px;flex-wrap:wrap}',
        '.momo-native .momo-proxy-heading{display:flex;align-items:center;gap:10px;min-width:0;overflow-wrap:anywhere}',
        '.momo-native .momo-proxy-type{font-size:10px;font-weight:400;color:var(--text-subtitle)}',
        '.momo-native .momo-proxy-now{font-size:11px;font-weight:400;line-height:16px;overflow-wrap:anywhere}',
        '.momo-native .momo-proxy-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}',
        '.momo-native .momo-proxy-node{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:5px;min-width:0;overflow:hidden;background:var(--background-card)}',
        '.momo-native .momo-proxy-node.is-selected{border-color:var(--primary);background:var(--primary-background)}',
        '.momo-native .momo-proxy-choice{display:block;flex:1;width:100%;min-height:30px;box-sizing:border-box;padding:6px 8px 4px;border:0;background:transparent;text-align:left;color:var(--text-regular);font:inherit;font-size:12px;font-weight:500;line-height:18px;cursor:pointer}',
        '.momo-native .momo-proxy-choice>span{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
        '.momo-native .momo-proxy-choice:disabled{cursor:default}',
        '.momo-native .momo-proxy-choice:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}',
        '.momo-native .momo-proxy-node.is-selected .momo-proxy-choice{color:var(--primary)}',
        '.momo-native .momo-proxy-node-footer{padding:0 8px 6px}',
        '.momo-native .momo-proxy-metrics{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0}',
        '.momo-native .momo-proxy-protocol{font-size:11px;line-height:14px;color:var(--text-subtitle)}',
        '.momo-native .momo-proxy-delay{border:0;background:transparent;padding:2px 0;font:inherit;font-size:12px;font-variant-numeric:tabular-nums;line-height:16px;color:var(--text-subtitle);cursor:pointer}',
        '.momo-native .momo-proxy-delay:hover:not(:disabled){text-decoration:underline}',
        '.momo-native .momo-proxy-delay:focus-visible,.momo-native .momo-proxy-group-probe:focus-visible{outline:2px solid var(--primary);outline-offset:2px}',
        '.momo-native .momo-proxy-delay:disabled,.momo-native .momo-proxy-group-probe:disabled{cursor:default;opacity:.5}',
        '.momo-native .momo-proxy-delay.is-good{color:var(--success,#20a87b)}',
        '.momo-native .momo-proxy-delay.is-slow{color:var(--warning,#c28b2e)}',
        '.momo-native .momo-proxy-delay.is-failed{color:var(--error,#d95050)}',
        '@media(max-width:767px){.momo-native .momo-proxy-search{min-width:100%;width:100%}.momo-native .momo-proxy-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}.momo-native .momo-proxy-summary{gap:4px 12px}.momo-native .momo-proxy-now{flex-basis:100%}}'
    ].join('\n');
    return {
        name:'momo',
        data:function(){return {
            settings:{config:{},procd:{},proxy:{},mixin:{},log:{}},rules:{router_access_control:[],lan_access_control:[]},
            schema:{sections:[],rules:{},subscription:{fields:[]}},original:'',originalRules:'',hints:{},profiles:[],subscriptions:[],version:{},luciPort:8080,luciAvailable:false,
            clashEnabled:false,proxyData:{proxies:{},groups:[],modes:[]},proxySearch:'',proxyPending:false,proxyError:'',proxyDelays:{},proxyTesting:{},proxyTestGeneration:0,
            running:false,loaded:false,busy:false,error:'',notice:'',active:'general',sub:null,subOriginal:'',
            fileRef:'',fileName:'',fileText:'',fileOriginal:'',fileOriginalTarget:'',fileLoaded:false,fileReadonly:false,
            preferLocal:true,fileOriginalPreference:true,renameName:null,logKind:'app',logText:'',logAuto:true,logFollow:true,
            timer:null,statusPending:false,logPending:false,disposed:false,unloadHandler:null,confirmVisible:false,confirmMessage:'',confirmResolve:null
        };},
        computed:{
            dirty:function(){return this.loaded&&(JSON.stringify(this.settings)!==this.original||JSON.stringify(this.rules)!==this.originalRules);},
            fileTarget:function(){return /^subscription:/.test(this.fileRef)||this.fileRef==='runtime'?this.fileRef:(this.fileName?'file:'+this.fileName:'');},
            fileDirty:function(){return this.fileLoaded&&(this.fileText!==this.fileOriginal||this.fileTarget!==this.fileOriginalTarget||this.preferLocal!==this.fileOriginalPreference);},
            subDirty:function(){return !!this.sub&&JSON.stringify(this.sub)!==this.subOriginal;},
            hasUnsaved:function(){return this.dirty||this.fileDirty||this.subDirty;},
            visibleProxyGroups:function(){var data=this.proxyData,query=this.proxySearch.trim().toLowerCase();return (data.groups||[]).map(function(name){return data.proxies[name];}).filter(function(group){return group&&(!query||group.name.toLowerCase().includes(query)||(group.all||[]).some(function(name){return name.toLowerCase().includes(query);}));});},
            advancedUrl:function(){return 'http://'+window.location.hostname+':'+this.luciPort+'/cgi-bin/luci/admin/services/momo';}
        },
        created:function(){this.fetchConfig();this.refreshStatus();},
        mounted:function(){
            var self=this;
            this.unloadHandler=function(event){if(self.hasUnsaved){event.preventDefault();event.returnValue='';}};
            window.addEventListener('beforeunload',this.unloadHandler);
            this.timer=setInterval(function(){
                if(document.hidden)return;
                self.refreshStatus();if(self.active==='proxies'&&!self.busy)self.loadProxies(false);if(self.active==='logs'&&self.logAuto&&!self.busy)self.loadLog(false);
            },5000);
        },
        beforeRouteLeave:function(to,from,next){if(!this.hasUnsaved)next(true);else this.ask(this.t('leave_confirm')).then(next);},
        beforeDestroy:function(){this.disposed=true;this.proxyTestGeneration++;clearInterval(this.timer);window.removeEventListener('beforeunload',this.unloadHandler);},
        methods:{
            ask:function(message){var self=this;if(this.confirmResolve)this.confirmResolve(false);this.confirmMessage=message;this.confirmVisible=true;return new Promise(function(resolve){self.confirmResolve=resolve;});},
            confirmAnswer:function(value){var resolve=this.confirmResolve;this.confirmResolve=null;this.confirmVisible=false;if(resolve)resolve(value);},
            language:function(){return /^zh/.test((this.$store&&this.$store.getters.lang)||(this.$i18n&&this.$i18n.locale)||'en')?0:1;},
            t:function(key){return words[key]?words[key][this.language()]:key;},
            label:function(pair){return Array.isArray(pair)?pair[this.language()]:pair;},
            rpc:function(method,args,timeout){return window.$rpcRequest('call',['sid','momo',method,args||{}],{timeout:timeout||30000,isCancel:false});},
            run:async function(fn){
                if(this.busy)return false;this.busy=true;this.error='';this.notice='';
                try{await fn();return true;}catch(e){this.error=e&&(e.message||e.err_msg)||this.t('error');return false;}finally{this.busy=false;}
            },
            loadConfig:async function(){
                var data=await this.rpc('get_config');
                this.schema=data.schema;this.settings=data.settings;this.rules=data.rules||{router_access_control:[],lan_access_control:[]};
                this.schema.sections.forEach(function(section){if(!data.settings[section.key]||Array.isArray(data.settings[section.key]))data.settings[section.key]={};});
                Object.keys(this.rules).forEach(function(k){if(!Array.isArray(data.rules[k]))data.rules[k]=[];});
                this.profiles=Array.isArray(data.profiles)?data.profiles:[];this.subscriptions=Array.isArray(data.subscriptions)?data.subscriptions:[];
                this.version=data.version||{};this.luciPort=data.luci_port||8080;this.luciAvailable=data.luci_available===true;
                this.original=JSON.stringify(this.settings);this.originalRules=JSON.stringify(this.rules);this.loaded=true;
            },
            fetchConfig:function(){var self=this;return this.run(async function(){await self.loadConfig();try{self.hints=await self.rpc('get_hints');}catch(e){self.hints={};}});},
            refreshLists:async function(){var data=await this.rpc('get_config');this.profiles=Array.isArray(data.profiles)?data.profiles:[];this.subscriptions=Array.isArray(data.subscriptions)?data.subscriptions:[];},
            refreshStatus:async function(){
                if(this.statusPending||this.disposed)return;this.statusPending=true;
                try{var data=await this.rpc('get_status');this.running=data.running;this.clashEnabled=data.clash_api===true;if(!this.clashEnabled&&this.active==='proxies'){this.active='general';this.proxyTestGeneration++;}}catch(e){this.error=e&&e.message||this.t('error');}finally{this.statusPending=false;}
            },
            refresh:async function(){if(this.hasUnsaved&&!await this.ask(this.t('refresh_confirm')))return;this.fetchConfig();this.refreshStatus();},
            save:function(apply){
                var self=this;return this.run(async function(){
                    var args={settings:self.settings,apply:apply};
                    if(JSON.stringify(self.rules)!==self.originalRules)args.rules=self.rules;
                    await self.rpc('set_config',args,apply?130000:30000);await self.loadConfig();
                    self.notice=self.t(apply?'applied':'saved');await self.refreshStatus();
                });
            },
            action:function(action){var self=this;return this.run(async function(){await self.rpc('service',{action:action},130000);self.notice=self.t('requested');await self.refreshStatus();});},
            dashboard:function(){
                var win=window.open('about:blank','_blank');if(win)win.opener=null;var self=this;
                return this.run(async function(){try{
                    var data=await self.rpc('get_dashboard'),url=new URL('http://'+window.location.hostname+':'+data.port+'/ui/');
                    url.search=new URLSearchParams({host:window.location.hostname,hostname:window.location.hostname,port:data.port,secret:data.secret}).toString();
                    if(win)win.location.href=url.toString();else window.location.href=url.toString();
                }catch(e){if(win)win.close();throw e;}});
            },
            updateDashboard:function(){var self=this;return this.run(async function(){await self.rpc('update_dashboard',{},130000);self.notice=self.t('dashboard_updated');});},
            tab:function(name){if(name==='proxies'&&!this.clashEnabled)return;if(this.active==='proxies'&&name!=='proxies')this.proxyTestGeneration++;this.active=name;if(name==='proxies')this.loadProxies(true);if(name==='logs')this.loadLog(true);if(name==='files'&&!this.fileLoaded)this.loadFile(this.settings.config.profile||'runtime');},
            loadProxies:async function(manual){
                if(this.proxyPending||this.disposed||!this.clashEnabled)return;this.proxyPending=true;
                try{var data=await this.rpc('get_proxies');if(!data.enabled){this.clashEnabled=false;if(this.active==='proxies')this.active='general';return;}var proxies=data.proxies||{};Object.keys(proxies).forEach(function(name){var item=proxies[name];if(Object.prototype.hasOwnProperty.call(item,'all')&&!Array.isArray(item.all))item.all=[];});this.proxyData={proxies:proxies,groups:Array.isArray(data.groups)?data.groups:[],mode:data.mode||'',modes:Array.isArray(data.modes)?data.modes:[]};this.proxyError='';}
                catch(e){this.proxyError=e&&(e.message||e.err_msg)||this.t('error');}finally{this.proxyPending=false;}
            },
            proxyPath:function(name){var names=[],seen=new Set();while(name&&!seen.has(name)&&names.length<16){names.push(name);seen.add(name);var item=this.proxyData.proxies[name];name=item&&item.now;}return names;},
            proxyDelay:function(name){if(Object.prototype.hasOwnProperty.call(this.proxyDelays,name))return this.proxyDelays[name];var path=this.proxyPath(name);for(var i=path.length-1;i>=0;i--){var value=this.proxyData.proxies[path[i]];if(value&&typeof value.delay==='number')return value.delay;}return null;},
            selectProxy:function(group,name){var self=this;return this.run(async function(){await self.rpc('select_proxy',{group:group,name:name});self.notice=self.t('proxy_selected');await self.loadProxies(true);});},
            setClashMode:function(mode){var self=this;return this.run(async function(){await self.rpc('set_clash_mode',{mode:mode});self.notice=self.t('proxy_mode_saved');await self.loadProxies(true);});},
            probeProxy:async function(name){this.$set(this.proxyTesting,name,true);try{var data=await this.rpc('test_proxy',{name:name},15000);this.$set(this.proxyDelays,name,data.delay);}catch(e){this.$set(this.proxyDelays,name,0);}finally{this.$set(this.proxyTesting,name,false);}},
            testProxy:function(name){var self=this;return this.run(async function(){await self.probeProxy(name);});},
            testProxyGroup:function(group){var self=this;return this.run(async function(){
                var generation=++self.proxyTestGeneration,names=Array.from(new Set(group.all||[])),index=0;
                async function worker(){while(index<names.length&&!self.disposed&&self.active==='proxies'&&self.proxyTestGeneration===generation){var name=names[index++];await self.probeProxy(name);}}
                await Promise.all([worker(),worker(),worker()]);if(self.active==='proxies'&&self.proxyTestGeneration===generation)self.notice=self.t('proxy_test_done');
            });},
            addRule:function(kind){var row={id:'',enabled:'1',dns:'0',proxy:'0'};(this.schema.rules[kind].fields||[]).forEach(function(f){if(f.kind==='list')row[f.key]=[];});this.rules[kind].push(row);},
            moveRule:function(kind,index,delta){var rows=this.rules[kind],target=index+delta;if(target<0||target>=rows.length)return;rows.splice(target,0,rows.splice(index,1)[0]);},
            removeRule:function(kind,index){this.rules[kind].splice(index,1);},
            editSub:async function(sub){if(this.subDirty&&!await this.ask(this.t('leave_confirm')))return;this.sub=Object.assign({id:'',name:'',url:'',info_url:'',user_agent:'sing-box',prefer:'remote'},sub||{});this.subOriginal=JSON.stringify(this.sub);},
            cancelSub:async function(){if(this.subDirty&&!await this.ask(this.t('leave_confirm')))return;this.sub=null;},
            saveSub:function(){var self=this;return this.run(async function(){
                if(!self.sub.name||!/^https?:\/\/\S+$/.test(self.sub.url))throw new Error(self.t('missing'));
                var args={};['id','name','url','info_url','user_agent','prefer'].forEach(function(k){args[k]=self.sub[k];});
                await self.rpc('save_subscription',args);self.sub=null;await self.refreshLists();self.notice=self.t('saved');
            });},
            updateSub:function(id){var self=this;return this.run(async function(){await self.rpc('update_subscription',{id:id},610000);await self.refreshLists();self.notice=self.t('updated');});},
            deleteSub:async function(id){if(!await this.ask(this.t('delete_confirm')))return;var self=this;return this.run(async function(){await self.rpc('delete_subscription',{id:id});await self.refreshLists();});},
            sortSub:function(index,delta){var self=this;return this.run(async function(){var rows=self.subscriptions.slice(),target=index+delta;if(target<0||target>=rows.length)return;rows.splice(target,0,rows.splice(index,1)[0]);await self.rpc('reorder_subscriptions',{ids:rows.map(function(s){return s.id;})});await self.refreshLists();});},
            loadFile:async function(source){
                if(this.fileDirty&&!await this.ask(this.t('file_discard')))return;var self=this,ref=source||this.fileTarget;
                return this.run(async function(){var data=await self.rpc('get_profile',{source:ref});
                    self.fileRef=ref;self.fileName=ref.indexOf('file:')===0?ref.slice(5):'';self.fileText=data.text;self.fileOriginal=data.text;
                    self.fileOriginalTarget=ref;self.fileLoaded=true;self.fileReadonly=false;self.preferLocal=true;self.fileOriginalPreference=true;self.renameName=null;
                });
            },
            newFile:async function(copy){
                if(!copy&&this.fileDirty&&!await this.ask(this.t('file_discard')))return;
                this.fileName=copy?'profile-copy.json':'';this.fileRef='';this.fileText=copy?this.fileText:'{\n  "log": { "level": "info" },\n  "inbounds": [],\n  "outbounds": []\n}\n';
                this.fileOriginal='';this.fileOriginalTarget='';this.fileLoaded=true;this.fileReadonly=false;this.preferLocal=true;this.fileOriginalPreference=true;this.renameName=null;this.error='';this.notice='';
            },
            importFile:async function(event){
                var self=this,file=event.target.files&&event.target.files[0];event.target.value='';if(!file)return;
                if(this.fileDirty&&!await this.ask(this.t('file_discard')))return;
                return this.run(async function(){var content=await file.text();await self.newFile(true);self.fileName=file.name;self.fileText=content;});
            },
            download:async function(name,value){var prepared=await this.rpc('prepare_download',{name:name,text:value});await this.$downloadFile(prepared.path,name,true);},
            downloadFile:function(){var self=this;return this.run(async function(){await self.download(self.fileName||(self.fileRef==='runtime'?'startup.json':self.fileRef.replace(':','-')+'.json'),self.fileText);});},
            saveFile:function(apply){var self=this;return this.run(async function(){
                if(!self.fileTarget||!self.fileText.trim()||self.fileName&&(/^[.]/.test(self.fileName)||/[\\/:\u0000-\u001f\u007f]/.test(self.fileName)||self.fileName.indexOf('..')!==-1))throw new Error(self.t('file_invalid'));
                var source=self.fileTarget;
                await self.rpc('save_profile',{source:source,text:self.fileText,prefer_local:self.preferLocal});
                self.fileRef=source;self.fileOriginal=self.fileText;self.fileOriginalTarget=source;self.fileOriginalPreference=self.preferLocal;
                await self.refreshLists();self.notice=self.t('file_saved');
                if(apply){
                    if(source==='runtime')await self.rpc('service',{action:'reload'},130000);
                    else{
                        await self.rpc('set_config',{settings:{config:{profile:source}},apply:true},130000);
                        self.$set(self.settings.config,'profile',source);var original=JSON.parse(self.original);original.config.profile=source;self.original=JSON.stringify(original);
                    }
                    self.notice=self.t('applied');await self.refreshStatus();
                }
            });},
            renameFile:function(){var self=this;return this.run(async function(){
                var old=self.fileRef,name=self.renameName;var data=await self.rpc('rename_profile',{name:old.slice(5),new_name:name});
                self.fileRef=data.source;self.fileName=name;if(self.fileOriginalTarget===old)self.fileOriginalTarget=data.source;
                if(self.settings.config.profile===old){self.$set(self.settings.config,'profile',data.source);var original=JSON.parse(self.original);original.config.profile=data.source;self.original=JSON.stringify(original);}
                self.renameName=null;await self.refreshLists();self.notice=self.t('saved');
            });},
            deleteFile:async function(){if(!await this.ask(this.t('delete_file_confirm')))return;var self=this;return this.run(async function(){
                await self.rpc('delete_profile',{name:self.fileRef.slice(5)});self.fileRef='';self.fileName='';self.fileText='';self.fileLoaded=false;self.renameName=null;await self.refreshLists();
            });},
            scrollLog:function(){var el=this.$refs.logOutput;if(el)el.scrollTop=el.scrollHeight;},
            loadLog:async function(manual){
                if(this.logPending||this.disposed)return;this.logPending=true;
                try{this.logText=(await this.rpc('get_log',{kind:this.logKind})).text;if(this.logFollow)this.$nextTick(this.scrollLog);}
                catch(e){if(manual)this.error=e&&e.message||this.t('error');}finally{this.logPending=false;}
            },
            clearLog:async function(){if(!await this.ask(this.t('clear_log_confirm')))return;var self=this;return this.run(async function(){await self.rpc('clear_log',{kind:self.logKind});await self.loadLog(true);});},
            debugDownload:function(){var self=this;return this.run(async function(){var data=await self.rpc('debug',{},130000);await self.download('momo-debug.log',data.text);});}
        },
        render:function(h){
            var self=this;
            function t(key){return self.t(key);}
            function btn(key,click,primary,disabled){return h('gl-button',{attrs:{type:primary?'primary':'default',disabled:self.busy||!!disabled},on:{click:click}},[t(key)]);}
            function input(value,change,label,type){return h('el-input',{attrs:{value:value||'',type:type||'text',disabled:self.busy,'aria-label':label,placeholder:label,'show-password':type==='password'},on:{input:change}});}
            // Vue extracts component props by deleting their keys from attrs.
            // Copy each option so a render cannot consume the shared schema choices.
            function select(value,options,change,label,extra){return h('el-select',{attrs:Object.assign({value:value,disabled:self.busy,placeholder:label,'aria-label':label,'popper-class':'main-select'},extra||{}),on:{input:change}},options.map(function(o){return h('el-option',{key:String(o.value),attrs:Object.assign({},o)});}));}
            function row(label,control,switchRow,key){return h('div',{class:['momo-row',switchRow?'is-switch':''],attrs:{'data-momo-field':key||null}},[h('span',{class:'momo-label'},[label]),h('div',{class:switchRow?'':'momo-control'},[control])]);}
            function control(field,values,change,key){
                var label=self.label(field.label),value=values[field.key],kind=field.kind;
                if(kind==='flag')return row(label,h('gl-switch',{attrs:{value:value==='1',size:'small',disabled:self.busy,'aria-label':label},on:{input:function(v){change(v?'1':'0');}}}),true,key);
                if(field.choices){
                    var presets=field.choices.slice();
                    if(field.optional)presets.unshift({value:'',label:t('unmodified')});
                    return row(label,select(value||'',presets,change,label,{filterable:true,'allow-create':true,'default-first-option':true}),false,key);
                }
                if(kind==='list'){
                    var options=(self.hints[field.hint]||[]);if(!Array.isArray(options))options=[];
                    if(field.hint==='dscp')options=Array.from({length:64},function(_,i){return String(i);});
                    options=options.map(function(o){return typeof o==='string'?{value:o,label:o}:o;});
                    return row(label,select(Array.isArray(value)?value:value?[value]:[],options,change,t('list_hint'),{multiple:true,filterable:true,'allow-create':true,'default-first-option':true,'collapse-tags':false}),false,key);
                }
                if(kind==='enum'||kind==='tristate'||kind==='profile'){
                    var choices=kind==='profile'?self.profiles.map(function(p){return {value:p.value,label:p.label};}):kind==='tristate'?[{value:'0',label:t('off')},{value:'1',label:t('on')}]:field.values.map(function(v){return {value:v,label:v==='local'?t('local'):v==='remote'?t('remote'):v};});
                    if(field.optional)choices.unshift({value:'',label:self.active==='mixin'?t('unmodified'):t('disabled')});
                    return row(label,select(value||'',choices,change,label),false,key);
                }
                return row(label,input(value,change,field.optional&&self.active==='mixin'?label+' ('+t('unmodified')+')':label,kind==='secret'?'password':'text'),false,key);
            }
            function group(label,children,open){return h('details',{class:'momo-group',attrs:{open:open}},[h('summary',[label]),h('div',{class:'momo-group-content'},children)]);}
            function schemaGroups(){
                var output=[];
                (self.schema.sections||[]).filter(function(s){return s.tab===self.active;}).forEach(function(section){
                    section.groups.forEach(function(g){var children=g.fields.map(function(field){return control(field,self.settings[section.key]||{},function(v){self.$set(self.settings[section.key],field.key,v);},section.key+'.'+field.key);});
                        output.push(group(self.label(section.label)+' · '+self.label(g.label),children,section.key==='config'||section.key==='log'||g.key==='proxy'||g.key==='log'||g.key==='dns'));
                    });
                });return output;
            }
            var body=[];
            if(this.active==='proxies'){
                if(!this.clashEnabled)body.push(h('p',{class:'momo-muted'},[t('proxy_unavailable')]));
                else{
                    body.push(h('div',{class:'momo-proxy-toolbar'},[
                        h('div',{class:'momo-proxy-search'},[input(this.proxySearch,function(value){self.proxySearch=value;},t('proxy_search'))]),
                        h('div',{class:'momo-mode'},[h('span',[t('clash_mode')]),select(this.proxyData.mode,this.proxyData.modes.map(function(mode){return {value:mode,label:t(mode)};}),this.setClashMode,t('clash_mode'))]),
                        btn('refresh',function(){self.proxyDelays={};self.loadProxies(true);},false,this.proxyPending)
                    ]));
                    body.push(h('p',{class:'momo-muted'},[t('proxy_live')]));
                    if(this.proxyError)body.push(h('p',{class:'momo-error',attrs:{role:'alert'}},[this.proxyError]));
                    if(this.proxyPending&&!this.proxyData.groups.length)body.push(h('p',[t('loading')]));
                    else if(!this.visibleProxyGroups.length)body.push(h('p',{class:'momo-muted'},[t('proxy_no_groups')]));
                    this.visibleProxyGroups.forEach(function(proxyGroup,index){
                        var selectable=proxyGroup.type==='Selector',query=self.proxySearch.trim().toLowerCase();
                        var members=(proxyGroup.all||[]).filter(function(name){return !query||proxyGroup.name.toLowerCase().includes(query)||name.toLowerCase().includes(query);});
                        body.push(h('div',{key:proxyGroup.name,class:'momo-proxy-group-wrap'},[h('details',{class:'momo-group momo-proxy-group',attrs:{open:!!query||index===0}},[
                            h('summary',[h('div',{class:'momo-proxy-summary'},[
                                h('span',{class:'momo-proxy-heading'},[h('strong',[proxyGroup.name]),h('span',{class:'momo-proxy-type'},[proxyGroup.type+' · '+(proxyGroup.all||[]).length])]),
                                h('span',{class:'momo-proxy-now'},[t('proxy_current')+': '+self.proxyPath(proxyGroup.now).join(' → ')])
                            ])]),
                            h('div',{class:'momo-group-content'},[
                                !selectable?h('p',{class:'momo-muted'},[t('proxy_auto')]):null,
                                h('div',{class:'momo-proxy-grid'},members.map(function(name){
                                    var node=self.proxyData.proxies[name]||{},selected=proxyGroup.now===name,delay=self.proxyDelay(name),testing=self.proxyTesting[name];
                                    var delayLabel=testing?t('proxy_testing'):delay===null?t('proxy_unknown'):delay>0?delay+' ms':t('proxy_timeout');
                                    return h('div',{key:name,class:['momo-proxy-node',selected?'is-selected':'']},[
                                        h('button',{class:'momo-proxy-choice',attrs:{type:'button',title:name,disabled:self.busy||!selectable||selected,'aria-pressed':String(selected),'aria-label':proxyGroup.name+': '+name},on:{click:function(){self.selectProxy(proxyGroup.name,name);}}},[h('span',[(selected?'✓ ':'')+name])]),
                                        h('div',{class:'momo-proxy-node-footer'},[h('div',{class:'momo-proxy-metrics'},[h('span',{class:'momo-proxy-protocol'},[node.type||'—']),h('button',{class:['momo-proxy-delay',delay===0?'is-failed':delay>0&&delay<300?'is-good':delay>=300?'is-slow':''],attrs:{type:'button',title:t('proxy_test'),'aria-label':t('proxy_test')+': '+name,disabled:self.busy||testing},on:{click:function(){self.testProxy(name);}}},[delayLabel])])])
                                    ]);
                                }))
                            ])
                        ]),h('div',{class:'momo-proxy-group-action'},[h('button',{class:'momo-proxy-group-probe',attrs:{type:'button',title:t('proxy_test_group'),'aria-label':t('proxy_test_group')+': '+proxyGroup.name,disabled:self.busy},on:{click:function(){self.testProxyGroup(proxyGroup);}}},[h('svg',{attrs:{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linejoin':'round','aria-hidden':'true'}},[h('path',{attrs:{d:'M13 2 3 14h8l-1 8 11-12h-8l1-8Z'}})])])])]));
                    });
                }
            }else if(!this.loaded)body.push(h('p',[t('loading')]));
            else if(['general','proxy','mixin','logs'].includes(this.active)){
                body=schemaGroups();
                if(this.active==='proxy')Object.keys(this.schema.rules).forEach(function(kind){
                    var rule=self.schema.rules[kind],rows=self.rules[kind]||[],content=[h('p',{class:'momo-muted'},[t('rules_hint')])];
                    rows.forEach(function(ruleRow,index){content.push(h('div',{class:'momo-rule',key:ruleRow.id||'new-'+index},[
                        h('div',{class:'momo-rule-head'},[h('strong',['#'+(index+1)]),h('div',{class:'momo-actions'},[btn('up',function(){self.moveRule(kind,index,-1);},false,index===0),btn('down',function(){self.moveRule(kind,index,1);},false,index===rows.length-1),btn('remove_rule',function(){self.removeRule(kind,index);})])])
                    ].concat(rule.fields.map(function(field){return control(field,ruleRow,function(v){self.$set(ruleRow,field.key,v);},kind+'.'+field.key);}))))});
                    content.push(btn('add_rule',function(){self.addRule(kind);},true));body.push(group(self.label(rule.label),content,false));
                });
                if(this.active==='logs'){
                    body.push(h('div',{class:'momo-actions momo-toolbar'},[
                        select(this.logKind,[{value:'app',label:t('app_log')},{value:'core',label:t('core_log')}],function(v){self.logKind=v;self.loadLog(true);},t('logs')),
                        btn('refresh',function(){self.loadLog(true);}),btn('clear_log',this.clearLog),btn('download_log',function(){return self.run(async function(){await self.download('momo-'+self.logKind+'.log',self.logText);});}),btn('scroll_bottom',this.scrollLog),btn('debug_download',this.debugDownload)
                    ]));
                    body.push(h('div',{class:'momo-log-options'},[['logAuto','auto_refresh'],['logFollow','follow_log']].map(function(pair){return row(t(pair[1]),h('gl-switch',{attrs:{value:self[pair[0]],size:'small','aria-label':t(pair[1])},on:{input:function(v){self[pair[0]]=v;}}}),true);})));
                    body.push(h('p',{class:'momo-muted'},[t('log_tip')]));body.push(h('pre',{class:'momo-log',ref:'logOutput'},[this.logText||t('empty')]));
                }
            }else if(this.active==='subscriptions'){
                body.push(btn('add',function(){self.editSub();},true));
                this.subscriptions.forEach(function(s,index){body.push(h('div',{class:'momo-sub',key:s.id},[
                    h('div',{class:'momo-sub-head'},[h('strong',[s.name||s.id]),h('div',{class:'momo-actions'},[
                        btn('up',function(){self.sortSub(index,-1);},false,index===0),btn('down',function(){self.sortSub(index,1);},false,index===self.subscriptions.length-1),
                        btn('update',function(){self.updateSub(s.id);}),btn('edit',function(){self.editSub(s);}),btn('delete',function(){self.deleteSub(s.id);},false,self.settings.config.profile==='subscription:'+s.id)
                    ])]),h('div',{class:'momo-sub-info'},['used','total','expire','update'].map(function(k){var field=self.schema.subscription.fields.find(function(f){return f.key===k;});return h('span',[self.label(field.label)+': '+(s[k]||'—')]);}))
                ]));});
                if(this.sub){var subFields=this.schema.subscription.fields.filter(function(f){return f.kind!=='readonly';}).map(function(field){return control(field,self.sub,function(v){self.$set(self.sub,field.key,v);},'subscription.'+field.key);});
                    subFields.push(h('div',{class:'momo-actions momo-toolbar'},[btn('save',this.saveSub,true),btn('cancel',this.cancelSub)]));body.push(h('div',{class:'momo-editor momo-sub-editor'},subFields));
                }
            }else if(this.active==='files'){
                body.push(h('p',{class:'momo-muted'},[t('file_tip')]));
                var sources=this.profiles.map(function(p){return {value:p.value,label:t(p.value.indexOf('file:')===0?'file_label':'sub_label')+p.label};});sources.push({value:'runtime',label:t('runtime')});
                body.push(row(t('file_source'),select(this.fileRef,sources,function(v){self.loadFile(v);},t('file_source'))));
                body.push(h('div',{class:'momo-actions momo-toolbar'},[
                    btn('load',function(){self.loadFile();},false,!this.fileTarget),btn('new_file',function(){self.newFile(false);}),btn('copy_file',function(){self.newFile(true);},false,!this.fileLoaded),
                    h('label',{class:['momo-import',this.busy?'is-disabled':''],attrs:{tabindex:this.busy?-1:0,role:'button','aria-disabled':String(this.busy)},on:{keydown:function(e){if(!self.busy&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.currentTarget.querySelector('input').click();}}}},[t('import_file'),h('input',{style:{display:'none'},attrs:{type:'file',accept:'.json,.jsonc,application/json',disabled:this.busy,'aria-label':t('import_file')},on:{change:this.importFile}})]),
                    btn('download_file',this.downloadFile,false,!this.fileLoaded),
                    btn('rename_file',function(){self.renameName=self.fileRef.slice(5);},false,!this.fileRef.startsWith('file:')),
                    btn('delete_file',this.deleteFile,false,!this.fileRef.startsWith('file:')||this.fileRef===this.settings.config.profile)
                ]));
                if(this.renameName!==null){body.push(row(t('new_name'),input(this.renameName,function(v){self.renameName=v;},t('new_name'))));body.push(h('div',{class:'momo-actions'},[btn('rename_file',this.renameFile,true),btn('cancel',function(){self.renameName=null;})]));}
                if(this.fileRef.startsWith('subscription:')){
                    body.push(h('p',{class:'momo-muted'},[t('sub_tip')]));body.push(row(t('prefer_local'),h('gl-switch',{attrs:{value:this.preferLocal,size:'small',disabled:this.busy,'aria-label':t('prefer_local')},on:{input:function(v){self.preferLocal=v;}}}),true));
                    if(!this.preferLocal)body.push(h('p',{class:'momo-muted'},[t('remote_tip')]));
                }else if(this.fileRef==='runtime')body.push(h('p',{class:'momo-muted'},[t('runtime_tip')]));
                else if(this.fileLoaded)body.push(row(t('filename'),input(this.fileName,function(v){self.fileName=v;},'profile.json')));
                if(this.fileLoaded)body.push(h('div',{class:'momo-editor'},[h('el-input',{attrs:{type:'textarea',rows:18,value:this.fileText,placeholder:t('content'),disabled:this.busy,'aria-label':t('content')},on:{input:function(v){self.fileText=v;}}})]));
                else body.push(h('p',{class:'momo-muted'},[t('file_empty')]));
            }
            return h('div',{class:'momo-native'},[
                h('el-dialog',{class:'momo-confirm',attrs:{visible:this.confirmVisible,title:self.language()===0?'确认操作':'Confirm action','append-to-body':true,'close-on-click-modal':false},on:{close:function(){self.confirmAnswer(false);}}},[h('p',[this.confirmMessage]),h('div',{slot:'footer',class:'momo-actions'},[btn('cancel',function(){self.confirmAnswer(false);}),h('gl-button',{attrs:{type:'primary'},on:{click:function(){self.confirmAnswer(true);}}},[self.language()===0?'确定':'Confirm'])])]),
                h('style',[css]),h('gl-title',{attrs:{title:'Momo'}}),h('gl-card',[h('div',{class:'momo-main'},[
                    h('p',{class:'momo-desc'},[t('description')]),h('div',{class:'momo-status'},[
                        h('div',[h('strong',[h('i',{class:['momo-dot',this.running?'on':'']}),t(this.running?'running':'stopped')]),h('div',{class:'momo-versions'},['Momo '+(this.version.app||'—')+' · sing-box '+(this.version.core||'—')+' · UI '+(this.schema.version||'—')])]),
                        h('div',{class:'momo-actions'},[btn(this.running?'restart':'start',function(){self.action(self.running?'restart':'start');}),btn('reload',function(){self.action('reload');},false,!this.running),btn('stop',function(){self.action('stop');},false,!this.running),btn('dashboard',this.dashboard,false,!this.running),btn('update_dashboard',this.updateDashboard,false,!this.running)])
                    ]),h('div',{class:'momo-tabs',attrs:{role:'tablist','aria-label':'Momo'}},['general','proxy','mixin','subscriptions','files','logs'].concat(this.clashEnabled?['proxies']:[]).map(function(k){return h('button',{class:['momo-tab',self.active===k?'is-active':''],attrs:{type:'button',role:'tab',id:'momo-tab-'+k,'aria-selected':String(self.active===k),'aria-controls':'momo-panel'},on:{click:function(){self.tab(k);}}},[t(k)]);})),
                    this.error?h('p',{class:'momo-error',attrs:{role:'alert'}},[this.error]):null,this.notice?h('p',{class:'momo-notice',attrs:{role:'status'}},[this.notice]):null,
                    h('div',{class:['momo-body','momo-page-'+this.active],attrs:{id:'momo-panel',role:'tabpanel','aria-labelledby':'momo-tab-'+this.active}},body),this.active==='proxies'?null:h('div',{class:'momo-footer'},[h('span',{class:'momo-muted'},[t(this.hasUnsaved?'unsaved':'no_changes')]),h('div',{class:'momo-actions'},this.active==='files'?[
                        btn('save_file',function(){return self.saveFile(false);},false,!this.fileLoaded||!this.fileTarget||!this.fileDirty),btn(this.fileRef==='runtime'?'save_reload':'save_activate',function(){return self.saveFile(true);},true,!this.fileLoaded||!this.fileTarget)
                    ]:[btn('refresh',this.refresh),btn('save',function(){return self.save(false);},false,!this.loaded||!this.dirty),btn('apply',function(){return self.save(true);},true,!this.loaded)])]),
                    this.luciAvailable?h('div',{class:'momo-advanced'},[h('a',{class:'text-btn',attrs:{href:this.advancedUrl,target:'_blank',rel:'noopener noreferrer'}},[t('advanced')])]):null
                ])])
            ]);
        }
    };
})();
