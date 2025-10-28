/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message as antdMessage,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import {
  donTuCreate,
  donTuMyList,
  type DonTuItem,
  type DonTuListResponse,
} from "../../services/donTu.api";

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

export default function DonTuCuaToi() {
  // Filters
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [type, setType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<number | undefined>(undefined);

  // Table
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DonTuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Modal create
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // (Giữ params chỉ để hiển thị/debug; reloadNow sẽ tự build tham số “live”)
  const params = useMemo(() => {
    const from = range[0].format("YYYY-MM-DD");
    const to = range[1].format("YYYY-MM-DD");
    return { from, to, type, status, page, per_page: perPage };
  }, [range, type, status, page, perPage]);

  // ---- RELOAD NGAY (không lệ thuộc closure params) ----
  const reloadNow = async () => {
    setLoading(true);
    try {
      const liveParams = {
        from: range[0].format("YYYY-MM-DD"),
        to: range[1].format("YYYY-MM-DD"),
        type,
        status,
        page,
        per_page: perPage,
      };
      const data: DonTuListResponse = await donTuMyList(liveParams);
      // eslint-disable-next-line no-console
      console.log("MY LIST (liveParams):", liveParams, data);
      setRows(data.items || []);
      setTotal(data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, type, status, page, perPage]);

  // ===== CREATE =====
  const fmt = (d?: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : undefined);

  const onValuesChange = (changed: any) => {
    if ("khoang" in changed && changed.khoang) {
      form.setFieldsValue({ so_gio: undefined });
    }
    if ("so_gio" in changed && changed.so_gio) {
      form.setFieldsValue({ khoang: undefined });
    }
  };

  const onCreate = async () => {
    if (submitting) return;
    try {
      const v = await form.validateFields();
      const payload: any = {
        loai: v.loai,
        ly_do: v.ly_do?.trim() || undefined,
      };

      const hasRange = Array.isArray(v.khoang) && v.khoang.length === 2;
      const hasHours = !!v.so_gio;

      if (hasRange && hasHours) {
        antdMessage.error("Chọn theo ngày HOẶC theo giờ, không đồng thời.");
        return;
      }
      if (hasRange) {
        payload.tu_ngay = fmt(v.khoang[0]);
        payload.den_ngay = fmt(v.khoang[1]);
      } else if (hasHours) {
        payload.so_gio = Number(v.so_gio);
      } else {
        antdMessage.error("Vui lòng chọn khoảng ngày HOẶC nhập số giờ.");
        return;
      }

      setSubmitting(true);
      await donTuCreate(payload);
      antdMessage.success("Đã gửi đơn và chờ duyệt.");
      form.resetFields();
      setOpen(false);
      setPage(1);            // về trang 1 để thấy record mới
      await reloadNow();     // reload theo state hiện tại
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("CREATE LEAVE ERROR:", err?.response?.data || err);
      const data = err?.response?.data;
      if (data?.code === "VALIDATION_ERROR") {
        const first =
          (data.data?.message as string) ||
          (Object.values(data.data || {})[0] as any)?.[0];
        antdMessage.error(first || "Dữ liệu không hợp lệ.");
      } else {
        antdMessage.error(data?.data?.message || data?.code || "Lỗi hệ thống.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<DonTuItem> = [
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
    // ==== SỬA: Cột Lý do — ưu tiên lý do QL khi bị từ chối ====
    {
      title: "Lý do",
      key: "ly_do_display",
      ellipsis: true,
      render: (_, r) => {
        const isRejected = r.trang_thai === 2;
        const text = isRejected
          ? (r.ly_do_tu_choi?.trim() || r.ly_do || "-")
          : (r.ly_do || "-");
        return (
          <span>
            {isRejected && r.ly_do_tu_choi
              ? <em style={{ color: "#cf1322" }}>[Lý do QL] </em>
              : <em style={{ color: "#1677ff" }}>[Lý do NV] </em>}
            {text}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "trang_thai",
      render: (_, r) => (
        <Tag color={STATUS_COLORS[r.trang_thai] || "default"}>
          {r.trang_thai_label}
        </Tag>
      ),
      width: 140,
    },
    { title: "Mô tả", dataIndex: "short_desc", key: "short_desc", ellipsis: true },
    { title: "Gửi lúc", dataIndex: "created_at", key: "created_at", width: 180 },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Đơn từ của tôi
        </Title>
        <Badge count={total} title="Tổng bản ghi trong bộ lọc hiện tại" />
      </Space>

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
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
              onChange={setType}
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
              onChange={setStatus}
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

            <Button
              type="primary"
              size="large"
              onClick={() => setOpen(true)}
              style={{ boxShadow: "0 8px 16px rgba(24,144,255,.25)", fontWeight: 600 }}
            >
              Tạo đơn
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table<DonTuItem>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
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

      <Modal
        title="Tạo đơn từ"
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        okText="Gửi đơn"
        onOk={() => form.submit()}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          onValuesChange={onValuesChange}
        >
          <Form.Item
            name="loai"
            label="Loại đơn"
            rules={[{ required: true, message: "Chọn loại đơn" }]}
          >
            <Select options={LOAI_OPTIONS} placeholder="Chọn loại đơn" />
          </Form.Item>

          <Form.Item
            name="khoang"
            label="Khoảng ngày"
            dependencies={["so_gio"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const hasRange = Array.isArray(value) && value.length === 2;
                  const hasHours = !!getFieldValue("so_gio");
                  if (hasRange && hasHours) {
                    return Promise.reject(
                      new Error("Chọn theo ngày HOẶC theo giờ, không đồng thời.")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <RangePicker
              format="DD/MM/YYYY"
              allowClear
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <Form.Item
            name="so_gio"
            label="Số giờ (nếu là đơn theo giờ)"
            dependencies={["khoang"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const hasRange = Array.isArray(getFieldValue("khoang"));
                  if (hasRange && value) {
                    return Promise.reject(
                      new Error("Chọn theo ngày HOẶC theo giờ, không đồng thời.")
                    );
                  }
                  if (value && (value < 1 || value > 168)) {
                    return Promise.reject(
                      new Error("Số giờ phải từ 1 đến 168.")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={1}
              max={168}
              style={{ width: "100%" }}
              placeholder="Ví dụ: 2"
            />
          </Form.Item>

          <Form.Item name="ly_do" label="Lý do">
            <Input.TextArea autoSize={{ minRows: 3 }} maxLength={5000} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
