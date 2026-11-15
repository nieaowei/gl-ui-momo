#!/bin/sh
# Build the architecture-independent UI with the official APKv3 packager.
set -eu
umask 022

package_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output_dir=${1:-"$package_dir/dist"}
mkdir -p "$output_dir"
output_dir=$(CDPATH= cd -- "$output_dir" && pwd)

if [ "${MOMO_APK_NATIVE:-0}" != 1 ]; then
    command -v docker >/dev/null 2>&1 || { echo 'Docker is required (or set MOMO_APK_NATIVE=1 with apk-tools 3 installed).' >&2; exit 1; }
    epoch=${SOURCE_DATE_EPOCH:-$(git -C "$package_dir" log -1 --format=%ct 2>/dev/null || echo 0)}
    image=${MOMO_APK_IMAGE:-alpine:3.23@sha256:ff7f0c727dd796aa36787bfcd9a64bf35a6ce72a73451b3359fde849b6703d63}
    exec docker run --rm --network none \
        --mount "type=bind,src=$package_dir,target=/src,readonly" \
        --mount "type=bind,src=$output_dir,target=/out" \
        --env MOMO_APK_NATIVE=1 --env "SOURCE_DATE_EPOCH=$epoch" \
        "$image" sh /src/scripts/build-apk.sh /out
fi

case "$(apk --version)" in
    'apk-tools 3.'*) ;;
    *) echo 'apk-tools 3 with the mkpkg command is required.' >&2; exit 1 ;;
esac

metadata() {
    awk -v key="$1" 'index($0,key ":=")==1 {sub(/^[^:]+:=/, ""); print; exit}' "$package_dir/Makefile"
}
name=$(metadata PKG_NAME)
version=$(metadata PKG_VERSION)
release=$(metadata PKG_RELEASE)
license=$(metadata PKG_LICENSE)
depends=$(awk '/^[ \t]*DEPENDS:=/ {sub(/^[ \t]*DEPENDS:=/, ""); gsub(/\+/, ""); print; exit}' "$package_dir/Makefile")
case "$depends" in
    *'@'*|*'$'*|*':'*) echo 'Conditional dependencies require the OpenWrt build system.' >&2; exit 1 ;;
esac
[ -n "$name" ] && [ -n "$version" ] && [ -n "$release" ] && [ -n "$depends" ]
export SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH:-0}
case "$SOURCE_DATE_EPOCH" in ''|*[!0-9]*) echo 'Invalid SOURCE_DATE_EPOCH.' >&2; exit 1 ;; esac

build_root=$(mktemp -d)
trap 'rm -rf "$build_root"' EXIT HUP INT TERM
mkdir -p "$build_root/root"
cp -R "$package_dir/files/." "$build_root/root/"
find "$build_root/root" -type d -exec chmod 755 {} +
find "$build_root/root" -type f -exec chmod 644 {} +

hook() {
    awk -v start="define Package/$name/$1" '
        $0==start {inside=1; next}
        inside && $0=="endef" {exit}
        inside {gsub(/\$\$/, "$"); print}
    ' "$package_dir/Makefile" > "$build_root/$1"
    [ -s "$build_root/$1" ] || { echo "Missing $1 hook." >&2; exit 1; }
    sh -n "$build_root/$1"
}
hook postinst
hook postrm

filename="$name-$version-r$release.apk"
# Keep the original root-node layout used by OpenWrt's APK packager.
apk mkpkg --compat 3.0.0_pre1 --compression deflate:9 \
    --info "name:$name" --info "version:$version-r$release" \
    --info 'arch:noarch' --info "license:$license" --info "origin:$name" \
    --info 'description:Native GL.iNet SDK4 interface for Momo with proxy switching' \
    --info 'url:https://github.com/nieaowei/gl-sdk4-ui-momo' \
    --info 'tags:openwrt:section=net' --info "depends:$depends" \
    --script "post-install:$build_root/postinst" \
    --script "post-upgrade:$build_root/postinst" \
    --script "post-deinstall:$build_root/postrm" \
    --files "$build_root/root" --output "$output_dir/$filename"
apk verify --allow-untrusted "$output_dir/$filename"
(cd "$output_dir" && sha256sum "$filename" > "$filename.sha256")
echo "Built $filename (unsigned APKv3, noarch)"
