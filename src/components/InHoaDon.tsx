import React, { useCallback } from "react";
import { Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";

interface InvoicePrintButtonProps {
  donHangId: number;
  disabled?: boolean;
}

const InHoaDon: React.FC<InvoicePrintButtonProps> = ({
  donHangId,
  disabled = false,
}) => {
  // Lấy base web từ biến môi trường API
  // Ví dụ: http://127.0.0.1:8000/api  ->  http://127.0.0.1:8000/
  const API_BASE = (import.meta as any).env?.VITE_API_URL || "";
  const WEB_BASE = String(API_BASE).replace(/\/api\/?$/, "/");

  const handleXemTruoc = useCallback(() => {
    if (!donHangId) return;
    const url = `${WEB_BASE}quan-ly-ban-hang/xem-truoc-hoa-don/${donHangId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [WEB_BASE, donHangId]);

  return (
    <Button
      type="primary"
      icon={<PrinterOutlined />}
      disabled={disabled}
      size="small"
      style={{ marginRight: 5 }}
      onClick={handleXemTruoc}
      title="Xem trước / In hoá đơn"
    />
  );
};

export default InHoaDon;
