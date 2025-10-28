/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Typography,
  Button,
  message,
  Select,
  Card,
  Flex,
  Tooltip,
  Modal,
  Input,
  Checkbox,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import axios from "../../../configs/axios";
import { API_ROUTE_CONFIG } from "../../../configs/api-route-config";

const { Text, Title } = Typography;
const { TextArea } = Input;

export type DonHangRow = {
  id: number;
  ma_don_hang: string;
  ten_khach_hang?: string | null;
  dia_chi_giao_hang?: string | null;
  nguoi_nhan_ten?: string | null;
  nguoi_nhan_sdt?: string | null;
  nguoi_nhan_thoi_gian: string; // ISO
  // 0 Chưa giao | 1 Đang giao | 2 Đã giao | 3 Đã hủy
  trang_thai_don_hang: 0 | 1 | 2 | 3;

  // Flags từ BE (optional)
  sms_dang_giao_sent?: boolean;
  sms_da_giao_sent?: boolean;
  sms_dang_giao_failed?: boolean;
  sms_da_giao_failed?: boolean;
};

type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
};

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: undefined },
  { label: "Chưa giao", value: 0 },
  { label: "Đang giao", value: 1 },
  { label: "Đã giao", value: 2 },
  { label: "Đã hủy", value: 3 },
];

const REMIND_MINUTES = 60;

const isSapGiao = (iso: string, status: number) => {
  if (status !== 0 && status !== 1) return false;
  const now = dayjs();
  const dt = dayjs(iso);
  const diff = dt.diff(now, "minute");
  return diff >= 0 && diff <= REMIND_MINUTES;
};

const formatDateTime = (iso?: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "");

// ===== Helper: nội dung SMS mặc định theo mốc =====
const defaultSmsFor = (targetStatus: 1 | 2) => {
  if (targetStatus === 1) {
    return "PHG Floral: Don hang cua Quy khach da hoan thien va dang duoc giao. Vui long giu lien lac de nhan hoa. LH 0949404344.";
  }
  return "PHG Floral: Don hang cua Quy khach da giao thanh cong. Cam on Quy khach da tin tuong PHG Floral! LH 0949404344.";
};

export default function DonHomNayTable() {
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [rows, setRows] = useState<DonHangRow[]>([]);
  const [total, setTotal] = useState(0);

  // loading theo từng đơn khi bấm nút
  const [rowLoadingId, setRowLoadingId] = useState<number | null>(null);

  // ====== Modal SMS state ======
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsModalRecord, setSmsModalRecord] = useState<DonHangRow | null>(null);
  const [smsTargetStatus, setSmsTargetStatus] = useState<1 | 2 | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsConfirm, setSmsConfirm] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    setPage(1);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: perPage, page: Math.max(1, page) };
      if (status !== undefined && status !== null) params.status = status;

      const resp = await axios.get(API_ROUTE_CONFIG.GIAO_HANG_HOM_NAY, { params });

      const payload = resp?.data;
      let pag: Paginated<DonHangRow> | undefined;

if (pag) {
  const data = (Array.isArray(pag.data) ? pag.data : []).map((r: any) => ({
    ...r,
    // ÉP KIỂU CHUẨN để so sánh === số
    trang_thai_don_hang: Number(r.trang_thai_don_hang),
    // ÉP boolean cho các cờ SMS (nếu BE trả 0/1 hoặc "0"/"1")
    sms_dang_giao_sent: !!r.sms_dang_giao_sent,
    sms_da_giao_sent: !!r.sms_da_giao_sent,
    sms_dang_giao_failed: !!r.sms_dang_giao_failed,
    sms_da_giao_failed: !!r.sms_da_giao_failed,
  }));

  const totalCount = Number(pag.total ?? 0);
  setRows(data);
  setTotal(totalCount);

  const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
  if (page > lastPage) setPage(1);
} else {
  setRows([]);
  setTotal(0);
}

    } catch {
      message.error("Không tải được danh sách Đơn hôm nay");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [status, page, perPage]);

  // ====== Submit modal: gọi API notify-and-set-status ======
  const submitSmsAndStatus = async () => {
    if (!smsModalRecord || !smsTargetStatus) return;
    const rec = smsModalRecord;

    const key = `sms-${rec.id}`;
    try {
      setSendingSms(true);
      message.loading({ key, content: "Đang gửi SMS & cập nhật trạng thái...", duration: 0 });

      const resp = await axios.post(API_ROUTE_CONFIG.GIAO_HANG_NOTIFY_AND_STATUS(rec.id), {
        target_status: smsTargetStatus,
        message: smsMessage,
      });

      const ok = resp?.data?.success ?? true;
      const smsSuccess = resp?.data?.data?.sms_success ?? resp?.data?.sms_success ?? false;

      if (ok && smsSuccess) {
        message.success({ key, content: "Đã gửi SMS và cập nhật trạng thái thành công.", duration: 1.6 });
      } else if (ok && !smsSuccess) {
        message.warning({
          key,
          content: "Đã cập nhật trạng thái, nhưng SMS chưa gửi được (có thể do blacklist hoặc lỗi nhà cung cấp).",
          duration: 2.4,
        });
      } else {
        message.error({ key, content: "Yêu cầu thất bại." });
      }
      setSmsModalOpen(false);
      setSmsModalRecord(null);
      setSmsTargetStatus(null);
      setSmsMessage("");
      setSmsConfirm(false);
      fetchData();
    } catch {
      message.warning({
        content: "Đã cập nhật trạng thái, nhưng SMS có thể chưa gửi được.",
      });
      setSmsModalOpen(false);
      setSmsModalRecord(null);
      setSmsTargetStatus(null);
      setSmsMessage("");
      setSmsConfirm(false);
      fetchData();
    } finally {
      setSendingSms(false);
    }
  };

  // ====== Intercept đổi trạng thái ======

  const onChangeTrangThai = async (record: DonHangRow, newStatus: 0 | 1 | 2 | 3) => {
      const curr = Number(record.trang_thai_don_hang);
    // Chỉ bật modal khi từ CHƯA GIAO (0) -> ĐANG GIAO (1) hoặc ĐÃ GIAO (2)
    if (curr === 0 && (newStatus === 1 || newStatus === 2)) {

      setSmsModalRecord(record);
      setSmsTargetStatus(newStatus);
      setSmsMessage(defaultSmsFor(newStatus));
      setSmsConfirm(false);
      setSmsModalOpen(true);
      return;
    }

    // Các case còn lại: dùng PATCH cũ như trước
    const key = `upd-${record.id}`;
    try {
      setRowLoadingId(record.id);
      message.loading({ content: "Đang cập nhật trạng thái...", key, duration: 0 });
      await axios.patch(`${API_ROUTE_CONFIG.GIAO_HANG}/${record.id}/trang-thai`, {
        trang_thai_don_hang: newStatus,
      });
      message.success({ content: "Cập nhật trạng thái thành công", key, duration: 1.2 });
      fetchData();
    } catch {
      message.error({ content: "Cập nhật trạng thái thất bại", key });
    } finally {
      setRowLoadingId(null);
    }
  };

  // ====== Render tags trạng thái SMS trong cột Thao tác ======
  const renderSmsTags = (r: DonHangRow) => {
    const tags: ReactNode[] = [];

    // Tag cho mốc "Đang giao"
    if (r.sms_dang_giao_sent) {
      tags.push(<Tag key="dg-sent" color="blue">SMS “Đang giao” đã gửi</Tag>);
    } else if (r.sms_dang_giao_failed) {
      tags.push(<Tag key="dg-failed" color="warning">SMS “Đang giao” lỗi</Tag>);
    }

    // Tag cho mốc "Đã giao"
    if (r.sms_da_giao_sent) {
      tags.push(<Tag key="dgia-sent" color="success">SMS “Đã giao” đã gửi</Tag>);
    } else if (r.sms_da_giao_failed) {
      tags.push(<Tag key="dgia-failed" color="warning">SMS “Đã giao” lỗi</Tag>);
    }

    if (tags.length === 0) return null;
    return <Space size={4} wrap style={{ marginTop: 6 }}>{tags}</Space>;
  };

  const columns: ColumnsType<DonHangRow> = useMemo(
    () => [
      {
        title: "Mã đơn",
        dataIndex: "ma_don_hang",
        key: "ma_don_hang",
        width: 120,
        render: (val: string, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{val}</Text>
            {isSapGiao(record.nguoi_nhan_thoi_gian, record.trang_thai_don_hang) && (
              <Tag color="gold">Sắp giao ≤ 60’</Tag>
            )}
          </Space>
        ),
      },
      {
        title: "Khách hàng",
        dataIndex: "ten_khach_hang",
        key: "ten_khach_hang",
        ellipsis: true,
        render: (v) => v || "-",
      },
      {
        title: "Người nhận",
        dataIndex: "nguoi_nhan_ten",
        key: "nguoi_nhan_ten",
        width: 180,
        render: (v) => v || "-",
      },
      {
        title: "SĐT nhận",
        dataIndex: "nguoi_nhan_sdt",
        key: "nguoi_nhan_sdt",
        width: 140,
        render: (v) => v || "-",
      },
      {
        title: "Địa chỉ giao",
        dataIndex: "dia_chi_giao_hang",
        key: "dia_chi_giao_hang",
        ellipsis: true,
        render: (v) => v || "-",
      },
      {
        title: "Ngày–giờ nhận",
        dataIndex: "nguoi_nhan_thoi_gian",
        key: "nguoi_nhan_thoi_gian",
        width: 170,
        render: (iso: string) => formatDateTime(iso),
      },
      {
        title: "Trạng thái",
        dataIndex: "trang_thai_don_hang",
        key: "trang_thai_don_hang",
        width: 140,
        render: (st: number) => {
          const map = { 0: "Chưa giao", 1: "Đang giao", 2: "Đã giao", 3: "Đã hủy" } as const;
          const color = st === 2 ? "success" : st === 1 ? "blue" : st === 3 ? "error" : "processing";
          return <Tag color={color}>{(map as any)[st] ?? "—"}</Tag>;
        },
      },
      {
        title: "Thao tác",
        key: "action",
        width: 420,
        render: (_, record) => {
          const busy = rowLoadingId === record.id;
          return (
            <div>
              <Space wrap>
                <Tooltip title="Đặt trạng thái: Chưa giao">
                  <Button
                    size="small"
                    loading={busy}
                    onClick={() => onChangeTrangThai(record, 0)}
                    disabled={busy || record.trang_thai_don_hang === 0}
                  >
                    Chưa giao
                  </Button>
                </Tooltip>
                <Tooltip title="Đặt trạng thái: Đang giao">
                  <Button
                    size="small"
                    loading={busy}
                    onClick={() => onChangeTrangThai(record, 1)}
                    disabled={busy || record.trang_thai_don_hang === 1}
                  >
                    Đang giao
                  </Button>
                </Tooltip>
                <Tooltip title="Đặt trạng thái: Đã giao">
                  <Button
                    size="small"
                    type="primary"
                    loading={busy}
                    onClick={() => onChangeTrangThai(record, 2)}
                    disabled={busy || record.trang_thai_don_hang === 2}
                  >
                    Đã giao
                  </Button>
                </Tooltip>
                <Tooltip title="Đặt trạng thái: Đã hủy">
                  <Button
                    size="small"
                    danger
                    loading={busy}
                    onClick={() => onChangeTrangThai(record, 3)}
                    disabled={busy || record.trang_thai_don_hang === 3}
                  >
                    Đã hủy
                  </Button>
                </Tooltip>
              </Space>

              {/* Tags SMS */}
              {renderSmsTags(record)}
            </div>
          );
        },
      },
    ],
    [rowLoadingId]
  );

  return (
    <>
      <Card bodyStyle={{ padding: 16 }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            Đơn hôm nay
          </Title>
          <Space>
            <Select<number>
              style={{ width: 220 }}
              placeholder="Trạng thái"
              value={status}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
              options={STATUS_OPTIONS}
              allowClear
            />
          </Space>
        </Flex>

        <Table<DonHangRow>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize: perPage,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPerPage(ps);
            },
            showSizeChanger: true,
            showTotal: (t) => `${t} đơn`,
          }}
        />
      </Card>

      {/* Modal gửi SMS */}
      <Modal
        title="Gửi SMS thông báo đến khách hàng"
        open={smsModalOpen}
        onOk={submitSmsAndStatus}
        okText="Gửi & cập nhật trạng thái"
        confirmLoading={sendingSms}
        okButtonProps={{ disabled: !smsConfirm || smsMessage.trim() === "" }}
        onCancel={() => {
          setSmsModalOpen(false);
          setSmsModalRecord(null);
          setSmsTargetStatus(null);
          setSmsMessage("");
          setSmsConfirm(false);
        }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>Khách nhận:</Text> <Text>{smsModalRecord?.nguoi_nhan_ten || "-"}</Text>
          </div>
          <div>
            <Text strong>SĐT nhận:</Text> <Text>{smsModalRecord?.nguoi_nhan_sdt || "-"}</Text>
          </div>
          <div>
            <Text strong>Chuyển trạng thái:</Text>{" "}
            <Tag color={smsTargetStatus === 1 ? "blue" : "success"}>
              {smsTargetStatus === 1 ? "Đang giao" : "Đã giao"}
            </Tag>
          </div>
          <div>
            <Text strong>Nội dung SMS:</Text>
            <TextArea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={480}
              placeholder="Nhập nội dung SMS…"
            />
          </div>
          <Checkbox checked={smsConfirm} onChange={(e) => setSmsConfirm(e.target.checked)}>
            Tôi xác nhận gửi SMS đến khách hàng
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
}
