/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/components/responsive/MobileActionBar.tsx */

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button, Space } from "antd";

/**
 * Thanh hành động cố định đáy màn hình, chỉ hiển thị khi mobile (<= breakpoint).
 * Gắn ở "parent page" (không cần sửa file form). Ví dụ:
 *
 * <MobileActionBar
 *   primaryLabel="Lưu"
 *   onPrimary={() => form.submit()}
 *   secondaryLabel="Đồng bộ"
 *   onSecondary={handleResync}
 * />
 */

type Props = {
  /** Nhãn và handler của nút chính (thường là Lưu) */
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;

  /** Nút phụ (tùy chọn) */
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryLoading?: boolean;
  secondaryDisabled?: boolean;

  /** Nút phụ thứ 2 (tùy chọn) */
  extraLabel?: string;
  onExtra?: () => void;
  extraLoading?: boolean;
  extraDisabled?: boolean;

  /** Node tùy biến bên trái (ví dụ: tổng tiền) */
  leftNode?: ReactNode;

  /** Breakpoint tối đa coi là mobile (px) */
  breakpoint?: number;

  /** Ẩn bar tạm thời (ví dụ đang xem dialog overlay) */
  hidden?: boolean;
};

export default function MobileActionBar({
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  secondaryLoading,
  secondaryDisabled,
  extraLabel,
  onExtra,
  extraLoading,
  extraDisabled,
  leftNode,
  breakpoint = 768,
  hidden,
}: Props) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else (mq as any).addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else (mq as any).removeListener(onChange);
    };
  }, [breakpoint]);

  const show = useMemo(() => isMobile && !hidden, [isMobile, hidden]);
  if (!show) return null;

  // Safe area iOS: env(safe-area-inset-*) fallback 0
  const bottomSafeArea = "calc(env(safe-area-inset-bottom, 0px) + 12px)";

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100, // cao hơn content, dưới Drawer mask (mask ~ 1100-1300 tùy antd)
        background: "#ffffff",
        boxShadow: "0 -4px 12px rgba(0,0,0,.08)",
        padding: "10px 12px",
        paddingBottom: bottomSafeArea,
      }}
      // Chặn click xuyên qua
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Trái: node tùy biến (ví dụ tổng tiền) */}
        <div style={{ minWidth: 0, overflow: "hidden" }}>{leftNode}</div>

        {/* Phải: các nút hành động */}
        <Space.Compact block>
          {extraLabel ? (
            <Button
              size="large"
              onClick={onExtra}
              loading={extraLoading}
              disabled={extraDisabled}
            >
              {extraLabel}
            </Button>
          ) : null}

          {secondaryLabel ? (
            <Button
              size="large"
              onClick={onSecondary}
              loading={secondaryLoading}
              disabled={secondaryDisabled}
            >
              {secondaryLabel}
            </Button>
          ) : null}

          <Button
            type="primary"
            size="large"
            onClick={onPrimary}
            loading={primaryLoading}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
}
