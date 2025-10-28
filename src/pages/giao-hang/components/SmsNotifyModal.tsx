/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Modal, Space, Tag, Typography, Input, Checkbox } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

type TargetStatus = 1 | 2; // 1=Đang giao, 2=Đã giao

export type SmsNotifyRecord = {
  id: number;
  nguoi_nhan_ten?: string | null;
  nguoi_nhan_sdt?: string | null;
};

type Props = {
  open: boolean;
  loading?: boolean;
  record: SmsNotifyRecord | null;
  targetStatus: TargetStatus | null;
  initialMessage?: string;
  onSubmit: (message: string) => void;
  onCancel: () => void;
};

const labelForStatus = (st: TargetStatus | null) =>
  st === 1 ? "Đang giao" : st === 2 ? "Đã giao" : "—";
const colorForStatus = (st: TargetStatus | null) =>
  st === 1 ? "blue" : st === 2 ? "success" : "default";

/**
 * Modal gửi SMS thông báo cho khách hàng.
 * - Prefill nội dung tin nhắn qua prop initialMessage
 * - Chỉ bật nút OK khi đã tick xác nhận và có nội dung tin nhắn
 */
export default function SmsNotifyModal({
  open,
  loading = false,
  record,
  targetStatus,
  initialMessage = "",
  onSubmit,
  onCancel,
}: Props) {
  const [message, setMessage] = useState<string>(initialMessage);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Reset nội dung khi mở / thay đổi bản ghi hoặc mốc
  useEffect(() => {
    setMessage(initialMessage);
    setConfirmed(false);
  }, [open, initialMessage, record?.id, targetStatus]);

  return (
    <Modal
      title="Gửi SMS thông báo đến khách hàng"
      open={open}
      onOk={() => onSubmit(message)}
      okText="Gửi & cập nhật trạng thái"
      okButtonProps={{
        disabled: !confirmed || message.trim() === "",
      }}
      confirmLoading={loading}
      onCancel={onCancel}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text strong>Khách nhận:</Text>{" "}
          <Text>{record?.nguoi_nhan_ten || "-"}</Text>
        </div>
        <div>
          <Text strong>SĐT nhận:</Text>{" "}
          <Text>{record?.nguoi_nhan_sdt || "-"}</Text>
        </div>
        <div>
          <Text strong>Chuyển trạng thái:</Text>{" "}
          <Tag color={colorForStatus(targetStatus)}>{labelForStatus(targetStatus)}</Tag>
        </div>

        <div>
          <Text strong>Nội dung SMS:</Text>
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={480}
            placeholder="Nhập nội dung SMS…"
          />
        </div>

        <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
          Tôi xác nhận gửi SMS đến khách hàng
        </Checkbox>
      </Space>
    </Modal>
  );
}
