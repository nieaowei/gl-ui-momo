#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
[ "$(id -u)" = 0 ] || { echo 'Run as root on the router.' >&2; exit 1; }
[ -f /usr/share/gl-ngx/oui-rpc.lua ] && [ -d /www/views ] || { echo 'GL.iNet SDK4 is required.' >&2; exit 1; }
[ -x /etc/init.d/momo ] && [ -f /etc/momo/scripts/include.sh ] || { echo 'Install momo first.' >&2; exit 1; }
if [ -e /usr/lib/oui-httpd/rpc/plugins ] && ! grep -q '^-- Momo UI native package upgrade adapter\.$' /usr/lib/oui-httpd/rpc/plugins; then
    echo 'An existing plugins Lua adapter is present; keep it and resolve the conflict before installing.' >&2
    exit 1
fi
lua -e 'assert(loadfile("files/usr/lib/oui-httpd/rpc/momo")); assert(loadfile("files/usr/lib/oui-httpd/rpc/plugins")); assert(loadfile("files/usr/share/gl-validator.d/momo.lua"))'
lua -e 'local text=require("nixio.fs").readfile("files/usr/share/momo-ui/schema.json"); assert(require("cjson.safe").decode(text)); assert(require("luci.ip"))'
backup="/root/momo-ui-backup/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$backup"
chmod 700 /root/momo-ui-backup "$backup"
cp -p /etc/config/momo "$backup/momo.config"
for path in usr/lib/oui-httpd/rpc/momo usr/lib/oui-httpd/rpc/plugins usr/share/gl-validator.d/momo.lua usr/share/gl-download.d/momo usr/share/oui/menu.d/momo.json usr/share/momo-ui/schema.json www/views/gl-sdk4-ui-momo.common.js; do
    if [ -e "/$path" ]; then
        mkdir -p "$backup/$(dirname "$path")"
        cp -p "/$path" "$backup/$path"
    fi
    mkdir -p "/$(dirname "$path")"
    cp "files/$path" "/$path"
    chmod 644 "/$path"
done
if ! nginx -t; then
    echo "nginx validation failed; backup: $backup" >&2
    exit 1
fi
nginx -s reload
echo "Installed Momo UI. Backup: $backup"
echo 'Open http://192.168.8.1/#/momo (refresh the admin panel).'
