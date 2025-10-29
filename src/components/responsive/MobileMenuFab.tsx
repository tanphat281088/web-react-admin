/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/components/responsive/MobileMenuFab.tsx */

import { useEffect, useState } from "react";
import { Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { openMobileMenu } from "./MobileSiderDrawer";

export default function MobileMenuFab() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Theo dõi thay đổi kích thước (mobile / không mobile)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else (mq as any).addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else (mq as any).removeListener(onChange);
    };
  }, []);

  // Ẩn FAB khi có modal của AntD đang mở (tránh che UI trong modal)
  useEffect(() => {
    const hasOpenModal = () =>
      !!document.querySelector(".ant-modal-wrap:not([aria-hidden='true']) .ant-modal");
    setModalOpen(hasOpenModal());
    const mo = new MutationObserver(() => setModalOpen(hasOpenModal()));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  if (!isMobile || modalOpen) return null;

  // Đặt FAB thấp xuống một chút để không đè tiêu đề/toolbar
  const topOffset = "calc(var(--header-h-mobile, 64px) + 16px)";

  return (
    <div
      className="phg-fab"
      style={{
        position: "fixed",
        left: 12,
        top: topOffset,
        zIndex: 1100,
      }}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        aria-label="Open menu"
        icon={<MenuOutlined />}
        onClick={() => openMobileMenu()}
        style={{
          width: 48,
          height: 48,
          boxShadow: "0 4px 12px rgba(0,0,0,.15)",
        }}
      />
    </div>
  );
}
