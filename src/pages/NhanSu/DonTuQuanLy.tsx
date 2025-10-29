/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  message as antdMessage,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import {
  donTuAdminList,
  donTuApprove,
  donTuReject,
  type DonTuItem,
  type DonTuListResponse,
} from "../../services/donTu.api";
import axios from "../../configs/axios";
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";

/* ====== MỚI: dùng service chung để tải dropdown Users qua axios instance ====== */
import { userOptions, type UserOption as UserOptionSvc } from "../../services/user.api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LOAI_OPTIONS = [
  { label: "Nghỉ phép", value: "nghi_phep" },
  { label: "Nghỉ không lương", value: "khong_luong" },
  { label: "Đi trễ", value: "di_tre" },
  { label: "Về sớm", value: "ve_som" },
  { label: "Làm việc từ xa", value: "lam_viec_tu_xa" },
  { label: "Khác", value: "khac" },
];

const STATUS_COLORS: Record<number, string> = {
  0: "default",
  1: "green",
  2: "red",
  3: "orange",
};

type UserOption = { label: string; value: number };

// THÊM SAU DÒNG: type UserOption = { label: string; value: number };
const ALL_OPTION: UserOption = { value: -1, label: "— Tất cả —" };


// unwrap helper: nhận {success, data:{...}} hoặc trả trực tiếp
const unwrap = <T,>(r: any): T => (r && "data" in r ? (r.data as T) : (r as T));

export default function DonTuQuanLy() {
  // ===== Filters =====
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [type, setType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<number | undefined>(undefined);

  // ===== Table =====
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DonTuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // ===== Users dropdown =====
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ===== Reject modal =====
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  // (Giữ params để tiện debug/hiển thị; reloadNow sẽ tự build “liveParams” từ state)
  const params = useMemo(() => {
    const from = range[0].format("YYYY-MM-DD");
    const to = range[1].format("YYYY-MM-DD");
    return { user_id: userId, from, to, type, status, page, per_page: perPage };
  }, [userId, range, type, status, page, perPage]);

  /* ================== MỚI: Tải users bằng service userOptions ==================
     - Không xoá flow cũ, chỉ thay phần lấy danh sách sang service để đi qua axios + token
     - Không “fallback chỉ có tôi” để tránh che lỗi; nếu rỗng thì báo rõ cho người dùng
  ============================================================================== */
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Giữ call me (nếu muốn) để tương thích các luồng khác — nhưng không dùng để "fallback me"
      await axios.post("/auth/me").catch(() => null);

      const optsSvc: UserOptionSvc[] = await userOptions({ q: "", page: 1, per_page: 50 });
      const mapped: UserOption[] = (optsSvc || []).map((o) => ({ value: o.value, label: o.label }));
setUsers([ALL_OPTION, ...mapped]);

// Auto-chọn nếu chưa có userId: giữ nguyên hành vi (không bắt buộc chọn “Tất cả”)
if (!userId && mapped.length > 0) {
  setUserId(mapped[0].value);
}


      if (!mapped.length) {
        antdMessage.warning("Không có nhân viên để hiển thị. Vui lòng kiểm tra quyền hoặc dữ liệu.");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[DonTuQuanLy] fetchUsers error =", e);
      antdMessage.error("Không tải được danh sách nhân viên.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // ===== Reload list (không phụ thuộc closure) =====
  const reloadNow = async () => {
    setLoading(true);
    try {
      const liveParams = {
        user_id: userId,
        from: range[0].format("YYYY-MM-DD"),
        to: range[1].format("YYYY-MM-DD"),
        type,
        status,
        page,
        per_page: perPage,
      };

      // Gọi API
      const raw = await donTuAdminList(liveParams);

      // === Normalize mọi shape có thể (axiosResponse | direct) ===
      const a: any = (raw && "data" in (raw as any)) ? (raw as any).data : raw;

      // Lấy danh sách items theo các tên thường gặp: items -> rows -> data.items
      const items: DonTuItem[] = (a?.items ?? a?.rows ?? a?.data?.items ?? []) as DonTuItem[];

      // Tổng bản ghi: pagination.total -> data.pagination.total -> total -> số phần tử items
      const totalNum: number = Number(
        a?.pagination?.total ??
        a?.data?.pagination?.total ??
        a?.total ??
        (Array.isArray(items) ? items.length : 0)
      );

      // eslint-disable-next-line no-console
      console.log("ADMIN LIST (liveParams):", liveParams, { total: totalNum, itemsPreview: items?.slice?.(0, 2) });

      setRows(items);
      setTotal(totalNum);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[DonTuQuanLy] reloadNow error =", e);
      antdMessage.error("Không tải được danh sách đơn.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, range, type, status, page, perPage]);

  // ===== Actions =====
  const approve = async (id: number) => {
    try {
      await donTuApprove(id); // services phải PATCH {} (body rỗng) để Content-Type chuẩn
      antdMessage.success("Đã duyệt đơn.");
      setPage(1);
      await reloadNow();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[approve] error =", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.data?.message ||
        e?.message ||
        "Không duyệt được đơn (400).";
      antdMessage.error(msg);
    }
  };

  const reject = async () => {
    if (!rejectId) return;
    try {
      await donTuReject(rejectId, rejectReason?.trim() || ""); // services: PATCH { ly_do: reason }
      antdMessage.success("Đã từ chối đơn.");
      setRejectOpen(false);
      setRejectReason("");
      setRejectId(null);
      setPage(1);
      await reloadNow();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[reject] error =", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.data?.message ||
        e?.message ||
        "Không từ chối được đơn (400).";
      antdMessage.error(msg);
    }
  };

  // ===== Columns =====
  const columns: ColumnsType<DonTuItem> = [
    { title: "Nhân viên", dataIndex: "user_name", key: "user_name", width: 220, ellipsis: true },
    { title: "Loại", dataIndex: "loai_label", key: "loai_label", width: 160 },
    {
      title: "Khoảng thời gian",
      key: "range",
      render: (_, r) =>
        r.tu_ngay || r.den_ngay
          ? `${r.tu_ngay ?? ""} → ${r.den_ngay ?? ""}`
          : r.so_gio
          ? `${r.so_gio} giờ`
          : "-",
      width: 220,
    },
    { title: "Lý do", dataIndex: "ly_do", key: "ly_do", ellipsis: true },
    {
      title: "Trạng thái",
      key: "trang_thai",
      render: (_, r) => (
        <Tag color={STATUS_COLORS[r.trang_thai] || "default"}>{r.trang_thai_label}</Tag>
      ),
      width: 140,
    },
    {
      title: "Người duyệt",
      dataIndex: "approver_name",
      key: "approver_name",
      width: 220,
      ellipsis: true,
    },
    { title: "Mô tả", dataIndex: "short_desc", key: "short_desc", ellipsis: true },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, r) => (
        <Space>
          <Button
            type="primary"
            size="middle"
            disabled={r.trang_thai !== 0}
            onClick={() => approve(r.id)}
          >
            Duyệt
          </Button>
          <Button
            danger
            size="middle"
            disabled={r.trang_thai !== 0}
            onClick={() => {
              setRejectId(r.id);
              setRejectOpen(true);
            }}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Đơn từ (Quản lý)
        </Title>
        <Badge count={total} title="Tổng bản ghi trong bộ lọc hiện tại" />
      </Space>

      {/* ===== Filter Row ===== */}
      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
          {/* Nhân viên */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text style={{ color: "#667085" }}>Nhân viên</Text>
            <Select
              allowClear
              loading={loadingUsers}
              style={{ width: 240 }}
              options={users}
value={userId ?? -1}
onChange={(v) => {
  setPage(1);
  setUserId(v === -1 ? undefined : v);
}}

              showSearch
              optionFilterProp="label"
              placeholder="-- Tất cả --"
              onDropdownVisibleChange={async (open) => {
                if (open && !loadingUsers) {
                  await fetchUsers();
                }
              }}
              onSearch={async (kw) => {
                setLoadingUsers(true);
                try {
const optsSvc = await userOptions({ q: kw, page: 1, per_page: 50 });
setUsers([ALL_OPTION, ...optsSvc.map((o) => ({ value: o.value, label: o.label }))]);

                } finally {
                  setLoadingUsers(false);
                }
              }}
              filterOption={false}
            />
          </div>

          {/* Khoảng ngày */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text style={{ color: "#667085" }}>Khoảng ngày</Text>
            <RangePicker
              value={range}
              onChange={(v) => v && setRange([v[0]!, v[1]!])}
              allowClear={false}
              format="DD/MM/YYYY"
              style={{ width: 260 }}
            />
          </div>

          {/* Loại */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text style={{ color: "#667085" }}>Loại</Text>
            <Select
              allowClear
              style={{ width: 220 }}
              options={LOAI_OPTIONS}
              value={type}
              onChange={(v) => {
                setPage(1);
                setType(v);
              }}
              placeholder="-- Tất cả --"
            />
          </div>

          {/* Trạng thái */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text style={{ color: "#667085" }}>Trạng thái</Text>
            <Select
              allowClear
              style={{ width: 220 }}
              value={status}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
              options={[
                { label: "Chờ duyệt", value: 0 },
                { label: "Đã duyệt", value: 1 },
                { label: "Từ chối", value: 2 },
                { label: "Đã hủy", value: 3 },
              ]}
              placeholder="-- Tất cả --"
            />
          </div>

          {/* Actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Button
              size="large"
              onClick={() => {
                setPage(1);
                reloadNow();
              }}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </Card>

      {/* ===== Table ===== */}
      <Card>
        <Table<DonTuItem>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1100 }}
          pagination={{
            total,
            current: page,
            pageSize: perPage,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setPerPage(s);
            },
            onShowSizeChange: (p, s) => {
              setPage(1);
              setPerPage(s);
            },
          }}
        />
      </Card>

      {/* ===== Reject Modal ===== */}
      <Modal
        title="Nhập lý do từ chối"
        open={rejectOpen}
        onOk={reject}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason("");
          setRejectId(null);
        }}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={5000}
        />
      </Modal>
    </Space>
  );
}
