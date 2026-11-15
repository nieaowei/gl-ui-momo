include $(TOPDIR)/rules.mk

PKG_NAME:=gl-ui-momo
PKG_VERSION:=2026.10.14
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0+

include $(INCLUDE_DIR)/package.mk

define Package/gl-ui-momo
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Native GL.iNet SDK4 interface for Momo
  URL:=https://github.com/nieaowei/gl-ui-momo
  DEPENDS:=+gl-sdk4-ui-core +gl-oui-rpc +momo +libuci-lua +luci-lib-nixio +luci-lib-ip +curl
  PKGARCH:=all
endef

define Build/Compile
endef

define Package/gl-ui-momo/install
	$(CP) ./files/* $(1)/
endef

define Package/gl-ui-momo/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || { nginx -t && nginx -s reload; }
exit 0
endef

define Package/gl-ui-momo/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || { nginx -t && nginx -s reload; }
exit 0
endef

$(eval $(call BuildPackage,gl-ui-momo))
