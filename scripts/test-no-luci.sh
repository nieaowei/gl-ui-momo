#!/bin/sh
# Temporarily isolate the optional LuCI app; restore all files on exit.
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run as root on the router.' >&2; exit 1; }
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
backup=$(mktemp -d /tmp/momo-ui-no-luci.XXXXXX)
chmod 700 "$backup"
list="$backup/paths"
: > "$list"
rpcd_reloaded=0
restore() {
    status=$?
    set +e
    trap - EXIT HUP INT TERM
    failed=0
    while IFS= read -r path; do
        if [ -e "$backup$path" ]; then
            mkdir -p "$(dirname "$path")"
            mv "$backup$path" "$path" || failed=1
        fi
    done < "$list"
    if [ "$rpcd_reloaded" = 1 ]; then /etc/init.d/rpcd restart >/dev/null || failed=1; fi
    if [ "$failed" = 0 ]; then
        rm -rf "$backup"
        echo 'Restored optional LuCI app files and RPC service.'
    else
        echo "Restoration needs attention; backup retained: $backup" >&2
        status=1
    fi
    exit "$status"
}
trap restore EXIT
trap 'exit 130' HUP INT TERM
for path in /usr/share/rpcd/ucode/luci.momo /usr/share/rpcd/acl.d/luci-app-momo.json \
    /usr/share/luci/menu.d/luci-app-momo.json /www/luci-static/resources/tools/momo.js \
    /www/luci-static/resources/view/momo; do
    if [ -e "$path" ]; then
        mkdir -p "$backup$(dirname "$path")"
        echo "$path" >> "$list"
        mv "$path" "$backup$path"
    fi
done
rpcd_reloaded=1
/etc/init.d/rpcd restart >/dev/null
MOMO_REQUIRE_NO_LUCI=1 lua "$script_dir/test-rpc.lua"
