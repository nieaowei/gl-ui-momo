# gl-ui-momo

为 GL.iNet SDK4 后台添加“应用程序 → Momo”。界面使用现有 Vue、GL 组件和 `/rpc` 管理员会话，与 LuCI 共用 Momo 配置。本扩展由本项目维护，并非 GL.iNet 官方发布的软件。

## 获取源码

```sh
git clone https://github.com/nieaowei/gl-ui-momo.git
cd gl-ui-momo
```

本仓库只包含原生界面插件。Momo 服务由 [OpenWrt-momo](https://github.com/nikkinikki-org/OpenWrt-momo) 提供，需要另行安装。

软件包名为 `gl-ui-momo`。GL 原生后台的软件包卸载接口会拒绝名称中包含 `gl-sdk` 的包，因此不再使用旧包名 `gl-sdk4-ui-momo`。源码仓库已更名为 `nieaowei/gl-ui-momo`，SDK4 视图文件名保持不变。

## 功能对齐

界面对齐 Momo LuCI 六个页面的 **89 项字段**，并增加条件显示的“代理切换”页签：85 项可写设置及 4 项只读订阅信息。前端和后端共用 `files/usr/share/momo-ui/schema.json`，包含：

| 分组 | 字段数 | 功能 |
|---|---:|---|
| 应用设置 | 7 | 启用、配置选择、启动延迟、测试配置、仅内核、定时重启 |
| 进程设置 | 13 | 快速重载、进程/内存/栈/文件描述符软硬限制、Go 环境变量 |
| 代理设置 | 21 | IPv4/IPv6、DNS、TCP/UDP 单独禁用或代理、入站接口、目标端口、DSCP/FWMark、保留网段、TUN 参数 |
| 路由器访问控制 | 6 | 用户、组、CGroup、DNS、代理、启用，支持规则增删改和排序 |
| 局域网访问控制 | 6 | IPv4、IPv6、MAC、DNS、代理、启用，支持规则增删改和排序 |
| 覆写设置 | 22 | 日志、DNS、NTP、缓存、控制面板/API，均可恢复“不覆写” |
| 日志设置 | 5 | 停止清理、定时和按大小清理 |
| 订阅 | 9 | 名称、URL、信息 URL、UA、优先级，以及流量、到期和更新信息 |

同时支持：

- 服务启停、重载、重启；打开和更新控制面板。
- 订阅增删改、更新和排序。
- 本地/订阅/启动配置读取与编辑，JSON/JSONC 注释、尾逗号和中文文件名。
- 文件导入、下载、另存、重命名和删除。当前使用的本地文件不可直接删除；重命名会更新当前配置引用。
- 完整日志、自动刷新、跟随输出、滚动到底部、日志清空和下载、生成并下载调试报告。
- 接口、用户/组、CGroup 和客户端地址提示；页面离开与文件切换时的未保存保护。
- 中文/英文及官方主题；正确使用路由器配置的 LuCI 端口。

### 代理切换

服务运行且启动配置包含有效的 `experimental.clash_api.external_controller` 时，显示“代理切换”页签。直接使用原生组件展示代理组、当前节点、节点类型和延迟，支持组/节点搜索、Selector 选择、运行模式切换及单节点/整组测速。URLTest 组展示内核的自动选择结果。

切换直接作用于当前内核，与面板同步，无需保存或重启。页面每 5 秒刷新；测速使用固定的 HTTPS 测试地址，超时 5 秒，整组测速最多同时执行 3 个请求，离开页签后停止派发后续测试。运行模式来自内核的 `mode-list`，支持自定义模式。

API 地址和密钥从运行配置读取，IPv4/IPv6 通配监听地址映射到回环地址。所有操作通过现有 SDK 管理员会话访问受限的本机接口，前端不使用硬编码密钥、跨域请求或 iframe。接口仅开放代理查询、Selector 成员切换、模式切换和固定地址测速。行为参照 [sing-box Clash API](https://github.com/SagerNet/sing-box/tree/testing/experimental/clashapi)。

### 独立后端

界面不调用 `luci.momo` RPC。Momo 和 UI 版本分别读取已安装的 `momo`、`gl-ui-momo` 包元数据，内核版本来自 sing-box。字段 schema 不保存版本号；脚本安装且没有 UI 包元数据时，UI 版本显示 `—`。用户、组及 CGroup 提示直接从系统读取；订阅更新和调试报告直接调用 Momo 自带脚本。订阅更新同时检查进程退出状态和 Momo 写入的成功标记，避免下载失败却误报成功。

`luci-app-momo` 可以不安装；若另行安装，原生界面与 LuCI 仍共用配置，页面显示可选的 LuCI 高级设置链接。Lua 公共库 `luci-lib-ip`、`luci-lib-nixio` 仍是依赖，它们不要求安装 Momo 的 LuCI 界面。

## 保存行为

常规“保存”只写配置；“保存并应用”保存后重启服务。仅更新受支持且实际变化的字段，不覆盖其他高级参数；未改动的列表保留原格式。

文件页“保存文件”仅写编辑器内容。“保存并使用此配置”先保存，再选中该来源并重启服务。保存订阅时默认本地优先，开关也支持切回远程优先；主动更新订阅仍会覆盖本地修改。

启动配置与 LuCI 一样可以编辑；“保存并重载服务”执行重载，启动配置会按来源重新生成。需要持久保留的修改应编辑来源配置。

首次增删或排序访问控制/订阅时，会将现有匿名 UCI 节转为同 ID 的命名节。字段值、匹配顺序和 ID 保留，避免位置变化导致订阅 ID 重算，从而破坏当前配置与缓存文件引用。

## 安装与卸载

已在 GL-MT3600BE、GL.iNet 4.11.0 beta1（OpenWrt 25.12-SNAPSHOT）验证。依赖 Momo 和 GL.iNet SDK4 后台；`luci-app-momo` 为可选界面，原生插件可单独使用。

将本目录复制到路由器，运行：

```sh
sh scripts/install.sh
```

刷新官方后台，打开 `http://192.168.8.1/#/momo`。安装增加独立菜单、视图、RPC 和字段定义，不修改官方主 bundle、登录页或 nginx 配置，不重启代理。原配置与旧界面文件备份在 `/root/momo-ui-backup/`。nginx 使用实际 `nginx -s reload` 使 Lua 缓存生效。

```sh
sh scripts/uninstall.sh
```

卸载只移除原生界面，保留 Momo、订阅与配置。固件升级后若扩展被移除，重新安装即可。

## GitHub Actions 自动构建与 Release

本仓库采用**插件独立构建**：当 `main` 上与软件包相关的内容发生变化时，`.github/workflows/build-release.yml` 自动读取上游最新正式 Release 对应提交中的 `momo/Makefile`，同步服务包的 `PKG_VERSION` 和 `PKG_RELEASE`，再加入本项目提交的前 7 位哈希，执行测试、构建并发布 GitHub Release，附带 APK 与同名 `.sha256` 文件。

例如，上游服务包为 `2026.10.14-r1`、本项目短哈希为 `abcdef0` 时：

| 用途 | 版本或文件名 |
|---|---|
| APK 版本 | `2026.10.14~abcdef0-r1` |
| APK 文件 | `gl-ui-momo-2026.10.14-abcdef0-r1.apk` |
| Release 标签 | `v2026.10.14-r1+abcdef0` |

APK 版本使用原生支持的 `~` 分隔提交哈希；文件名将其替换为 `-`，避免 GitHub 上传时改名导致校验文件失效；Git 标签使用 `+`。构建阶段只解析一次版本，发布阶段沿用同一结果，Release 说明记录上游版本和完整提交哈希。

- [下载最新 Release](https://github.com/nieaowei/gl-ui-momo/releases/latest)
- [查看独立构建工作流](https://github.com/nieaowei/gl-ui-momo/actions/workflows/build-release.yml)
- [中央 APK 软件源](https://github.com/nieaowei/openwrt-packages)

发布时自动同步版本，无需为每次插件修改手动递增版本。解析失败会终止发布；已发布标签不能由其他源码提交覆盖，并校验完整提交哈希以防短哈希碰撞。版本同步只修改构建工作区的 Makefile，不自动提交到仓库。

中央仓库定期读取本仓库最新正式 GitHub Release，仅下载 APK 和校验文件，完成校验、签名并生成 `packages.adb`；中央仓库不再拉取本仓库源码重新编译。可在中央仓库手动运行发布工作流以立即收集本项目的新版本。

## 编译

### 直接生成独立 APK

本包只有 Lua、JavaScript 和静态配置，无需交叉编译。安装 Docker 后，在本目录运行：

```sh
sh scripts/build-apk.sh
# 可选：指定输出目录
sh scripts/build-apk.sh /absolute/path/to/output
```

默认输出到仓库内已忽略的 `dist/`，包括 `gl-ui-momo-2026.10.14-r1.apk` 和同名 `.sha256` 校验文件；本地构建直接使用 Makefile 中的版本。如需采用发布版本规则，可先运行 `python3 scripts/prepare-release.py`，该命令需要 Python 3、Git 和网络，会更新本地 Makefile 中的版本字段。构建使用固定摘要的 Alpine 镜像和官方 `apk mkpkg`，生成兼容 APK 3.0.5 的 APKv3、`noarch` 安装包；容器构建阶段不访问网络。元数据、依赖、安装/升级/卸载钩子均从本包 Makefile 读取。原生 Linux 已有带 `mkpkg` 的 apk-tools 3 时，也可以设置 `MOMO_APK_NATIVE=1` 构建。

将 APK 复制到路由器的 `/tmp/` 后安装：

```sh
apk add --allow-untrusted /tmp/gl-ui-momo-2026.10.14-r1.apk
# 卸载 APK 安装的界面
apk del gl-ui-momo
```

这是本项目构建的未签名本地包，因此安装命令包含 `--allow-untrusted`。包管理器会检查 GL.iNet SDK4、`momo`、Lua 公共库及 curl 依赖，不会安装 `luci-app-momo`。安装/升级/卸载后自动重载 nginx，随后刷新管理页面。

已安装旧包 `gl-sdk4-ui-momo` 时，先通过 SSH 执行 `apk del gl-sdk4-ui-momo`，再安装新包。两者使用相同的 UI 文件路径，应先卸载旧包，避免文件归属冲突。新包可通过 GL 原生后台的软件包页面卸载。

已用 GL-MT3600BE 的 APK 3.0.5 完成完整性校验和无网络模拟安装。

### 在 OpenWrt 构建系统中编译

在包含 GL.iNet SDK4 包的 OpenWrt 构建环境中：

```sh
git clone https://github.com/nieaowei/gl-ui-momo.git package/gl-ui-momo
make package/gl-ui-momo/compile V=s
```

纯 Lua/JavaScript 包，OpenWrt 包定义中的架构为 `all`，生成 APK 时映射为 `noarch`。源码压缩包仍用于脚本安装；可安装的 APK 由上述构建命令生成。

## 验证

```sh
# 本机 Node，无第三方依赖
node scripts/test-ui.cjs
# 在安装后的路由器运行
lua scripts/test-model.lua
lua scripts/test-rpc.lua
# 暂时隔离旧 LuCI 界面/RPC，验证后自动恢复（会重启 rpcd）
sh scripts/test-no-luci.sh
```

- UI 回归：89/89 字段、85/85 可写控件、原有工作流，以及条件页签、代理/模式切换、测速、搜索和测速并发限制。
- 194 项隔离模型检查：加载实际适配器，将 UCI、配置文件、日志与服务调用隔离；验证字段、文件、规则、订阅和维护接口，SDK4 进程/RPC 兼容性及失败处理，以及代理组排序、中文节点、Selector/URLTest 行为、模式和测速。不会修改实时配置或启停真实服务。模型中禁止所有 `luci.momo` 调用，并覆盖原生命令退出状态、订阅成功标记、Momo/UI 包版本与系统提示。
- 48 项实际 RPC 检查（启用 Clash API 时）：原生下载、字段/规则/提示、非法输入、中文 JSONC 文件管理、代理查询及无变化的节点/模式切换；确认配置逐字节一致。仅创建临时测试文件，不清空真实日志、不更新真实订阅、不启停代理。无 LuCI 后端的扩展验证共 52 项，另检查旧文件/RPC 缺席、高级链接隐藏，以及直接生成调试报告。

访问控制以既有 SDK4 管理员身份校验为边界，不增加匿名方法或端口。下载使用固件原生 `/download` 和现有管理员会话，仅允许本扩展生成的私有临时文件，下载后自动删除。字段验证采用共享白名单；文件路径拒绝穿越与符号链接，文件采用私有临时文件原子替换；面板更新固定调用本机 API，密钥通过参数数组传递。

## 来源与许可证

本项目从 [nikkinikki-org/OpenWrt-momo](https://github.com/nikkinikki-org/OpenWrt-momo) 的原生界面扩展拆分，遵循 GPL-3.0-or-later，许可证全文见 [LICENSE](LICENSE)。

字段清单和控制面板下载选项参照 Momo 的 LuCI 界面。测试基线保存在 `scripts/luci-fields.json` 和 `scripts/fixtures/dashboard-presets.json`，下载选项基线内记录了来源，不需要原仓库在本机存在。

GL.iNet SDK4 固件按 `gl-sdk4-ui-${view}.common.js` 加载视图，因此 `view=momo` 对应的视图文件名为 `gl-sdk4-ui-momo.common.js`。
