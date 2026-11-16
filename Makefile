include $(TOPDIR)/rules.mk

PKG_NAME:=gl-ui-momo
PKG_VERSION:=2026.10.14
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0+

include $(INCLUDE_DIR)/package.mk

# Build-host tools only; install with npm ci in this package directory.
MOMO_NODE ?= node

define Package/gl-ui-momo
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Native GL.iNet SDK4 interface for Momo
  URL:=https://github.com/nieaowei/gl-ui-momo
  DEPENDS:=+gl-sdk4-ui-core +gl-oui-rpc +momo +libuci-lua +luci-lib-nixio +luci-lib-ip +curl
  PKGARCH:=all
endef

define Build/Compile
	rm -rf $(PKG_BUILD_DIR)/root
	$(MOMO_NODE) $(CURDIR)/scripts/build-assets.cjs $(PKG_BUILD_DIR)/root
	$(MOMO_NODE) $(CURDIR)/scripts/test-ui.cjs $(PKG_BUILD_DIR)/root
endef

define Package/gl-ui-momo/install
	$(CP) $(PKG_BUILD_DIR)/root/* $(1)/
endef

define Package/gl-ui-momo/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || { nginx -t -q && nginx -s reload; }
exit 0
endef

define Package/gl-ui-momo/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || { nginx -t -q && nginx -s reload; }
exit 0
endef

$(eval $(call BuildPackage,gl-ui-momo))
