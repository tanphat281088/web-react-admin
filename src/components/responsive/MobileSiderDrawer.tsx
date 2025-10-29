/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/components/responsive/MobileSiderDrawer.tsx */

import { useEffect, useMemo, useState } from "react";
import { Drawer, Menu, Tag, theme, Flex, Typography } from "antd";
import useSidebar from "../../hooks/useSidebar";
import { getSidebar } from "../../helpers/sidebarHelper";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { DATA_CONSTANTS } from "../../utils/constant";

/**
 * ========= Cơ chế mở/đóng toàn cục =========
 * Gọi từ bất kỳ đâu (ví dụ: MobileMenuFab) để điều khiển Drawer mà KHÔNG sửa HeaderMain:
 *   openMobileMenu()
 *   closeMobileMenu()
 *   toggleMobileMenu()
 */
const MOBILE_MENU_EVENT = "phg:mobileMenu" as const;

export const openMobileMenu = () =>
  window.dispatchEvent(new CustomEvent(MOBILE_MENU_EVENT, { detail: { open: true } }));

export const closeMobileMenu = () =>
  window.dispatchEvent(new CustomEvent(MOBILE_MENU_EVENT, { detail: { open: false } }));

export const toggleMobileMenu = () =>
  window.dispatchEvent(
    new CustomEvent(MOBILE_MENU_EVENT, { detail: { open: "toggle" } as any })
  );

/**
 * Drawer menu dành cho MOBILE
 * - Mount 1 lần ở cấp app shell
 * - Lấy data menu giống hệt SiderMain (tôn trọng phân quyền)
 */
const MobileSiderDrawer = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { user } = useSelector((state: RootState) => state.auth);
  const { items, openKeys } = useSidebar();

  // Tạo menu theo quyền giống SiderMain
  const sidebar = useMemo(
    () => getSidebar(items, user?.vai_tro?.phan_quyen),
    [items, user?.vai_tro?.phan_quyen]
  );

  const defaultOpenKeys = useMemo(
    () => openKeys.filter((k) => !["profile"].includes(k)),
    [openKeys]
  );

  const [open, setOpen] = useState(false);

  // Lắng nghe sự kiện toàn cục mở/đóng Drawer
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (!detail) return;
      if (detail.open === "toggle") {
        setOpen((prev) => !prev);
      } else {
        setOpen(!!detail.open);
      }
    };
    window.addEventListener(MOBILE_MENU_EVENT, handler as EventListener);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, handler as EventListener);
  }, []);

  // Đóng Drawer khi click item menu
  const handleMenuClick = () => setOpen(false);

  return (
    <Drawer
      open={open}
      placement="left"
      onClose={() => setOpen(false)}
      width={300}
      bodyStyle={{ padding: 0, background: "#001529" }} // đồng nhất theme dark như SiderMain
      maskClosable
      styles={{ header: { display: "none" } }}
    >
      {/* Header/logo giống SiderMain */}
      <Flex
        vertical
        align="center"
        justify="center"
        style={{
          height: 110,
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          margin: "0 16px 16px 16px",
          padding: "0 8px",
          overflow: "hidden",
          background: "#001529",
        }}
      >
        <Typography.Title
          level={2}
          style={{
            color: "#fff",
            fontWeight: "bold",
            margin: "8px 0",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {DATA_CONSTANTS.WEBSITE_NAME}
        </Typography.Title>
        <Tag
          style={{
            fontSize: 14,
            fontWeight: "bold",
            padding: "4px 12px",
            whiteSpace: "nowrap",
          }}
        >
          {import.meta.env.VITE_PANEL_NAME}
        </Tag>
      </Flex>

      {/* Menu mobile (dark / inline) */}
      <Menu
        theme="dark"
        mode="inline"
        defaultOpenKeys={defaultOpenKeys}
        items={sidebar}
        onClick={handleMenuClick}
        style={{
          fontSize: 15,
          borderRight: "none",
          overflowY: "auto",
          maxHeight: "calc(100vh - 140px)",
          background: "#001529",
        }}
      />
    </Drawer>
  );
};

export default MobileSiderDrawer;
