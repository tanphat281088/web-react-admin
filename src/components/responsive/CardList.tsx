/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/components/responsive/CardList.tsx */

import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Space, Tag, Typography, Skeleton, Button, Divider } from "antd";

/** 
 * Helper: lấy giá trị theo path "a.b.c" từ record 
 */
function getByPath(obj: any, path?: string) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export type CardField = {
  label?: string;
  path?: string;                   // Đường dẫn vào record, ví dụ "khach_hang.ten"
  render?: (record: any) => any;   // Tùy biến hiển thị
  bold?: boolean;                  // In đậm giá trị
  tag?: (record: any) => { color?: string; text: string } | null; // Hiển thị Tag thay vì text
};

type Props = {
  /** Dữ liệu để render Card ở mobile */
  data: any[];
  /** loading khi đang fetch */
  loading?: boolean;
  /** Khóa chính (mặc định "id") */
  keyField?: string;

  /** Tiêu đề mỗi card */
  title?: (record: any, index: number) => any;
  /** Phụ đề (nhỏ, xám) */
  subtitle?: (record: any, index: number) => any;
  /** Khu vực extra bên phải header card */
  extra?: (record: any, index: number) => any;

  /** Danh sách field hiển thị (4–6 là đẹp cho mobile) */
  fields: CardField[];

  /** Hành động bên dưới card (Xem/Sửa/…) */
  actions?: (record: any, index: number) => any;

  /** Click toàn bộ card */
  onCardClick?: (record: any, index: number) => void;

  /** Nội dung bảng cũ (Table…) → hiển thị ở tablet/desktop */
  children: any;

  /** Breakpoint px để coi như mobile (mặc định 768) */
  breakpoint?: number;

  /** Khi rỗng */
  emptyText?: string;
};

/**
 * CardList
 * - Mobile (<= breakpoint): render danh sách Card
 * - Tablet/Desktop: render children (bảng cũ)
 */
export default function CardList({
  data,
  loading,
  keyField = "id",
  title,
  subtitle,
  extra,
  fields,
  actions,
  onCardClick,
  children,
  breakpoint = 768,
  emptyText = "Không có dữ liệu",
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

  // Desktop/tablet → trả lại bảng cũ
  if (!isMobile) return children;

  // Mobile → hiển thị dạng Card
  if (loading) {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </Space>
    );
  }

  if (!data || data.length === 0) {
    return <Empty description={emptyText} style={{ padding: "24px 0" }} />;
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {data.map((record, index) => {
        const key = record?.[keyField] ?? `${index}`;
        const headerTitle = title ? title(record, index) : undefined;
        const headerSubtitle = subtitle ? subtitle(record, index) : undefined;
        const headerExtra = extra ? extra(record, index) : undefined;
        const cardActions = actions ? actions(record, index) : null;

        return (
          <Card
            key={key}
            hoverable={!!onCardClick}
            onClick={() => onCardClick?.(record, index)}
            style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}
            bodyStyle={{ padding: 12 }}
            headStyle={{ padding: "12px 16px" }}
            title={
              headerTitle ? (
                <Space direction="vertical" size={0} style={{ width: "100%" }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {headerTitle}
                  </Typography.Text>
                  {headerSubtitle ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {headerSubtitle}
                    </Typography.Text>
                  ) : null}
                </Space>
              ) : undefined
            }
            extra={headerExtra}
          >
            {/* Fields */}
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map((f, i) => {
                const value =
                  typeof f.render === "function"
                    ? f.render(record)
                    : getByPath(record, f.path);

                const tagObj = f.tag?.(record);

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    {f.label ? (
                      <Typography.Text type="secondary">{f.label}</Typography.Text>
                    ) : (
                      <span />
                    )}
                    <div style={{ textAlign: "right" }}>
                      {tagObj ? (
                        <Tag color={tagObj.color || "default"}>{tagObj.text}</Tag>
                      ) : f.bold ? (
                        <Typography.Text strong>{value ?? "-"}</Typography.Text>
                      ) : (
                        <Typography.Text>{value ?? "-"}</Typography.Text>
                      )}
                    </div>
                  </div>
                );
              })}
            </Space>

            {/* Actions */}
            {cardActions ? (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <div
                  onClick={(e) => e.stopPropagation()} // tránh click toàn card
                  style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
                >
                  {cardActions}
                </div>
              </>
            ) : null}
          </Card>
        );
      })}
    </Space>
  );
}
