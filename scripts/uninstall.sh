#!/bin/sh
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run as root on the router.' >&2; exit 1; }
# Only remove this extension. Momo, subscriptions and all settings are retained.
if [ -f /usr/lib/oui-httpd/rpc/plugins ] && grep -q '^-- Momo UI native package upgrade adapter\.$' /usr/lib/oui-httpd/rpc/plugins; then
    rm -f /usr/lib/oui-httpd/rpc/plugins
fi
rm -f /usr/lib/oui-httpd/rpc/momo /usr/share/gl-validator.d/momo.lua \
    /usr/share/oui/menu.d/momo.json /usr/share/momo-ui/schema.json /usr/share/gl-download.d/momo /www/views/gl-sdk4-ui-momo.common.js
nginx -t && nginx -s reload
echo 'Removed Momo native UI. Refresh the admin panel.'
