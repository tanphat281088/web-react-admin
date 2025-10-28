/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { holidayCreate, holidayDelete, holidayList, holidayUpdate, type HolidayItem } from "../../services/holiday.api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function HolidayAdmin() {
  const { message } = App.useApp();

  // filter range
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().startOf("year"), dayjs().endOf("year")]);

  // table
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<HolidayItem[]>([]);

  // modal create
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  // modal edit
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editing, setEditing] = useState<HolidayItem | null>(null);

  const params = useMemo(() => {
    const from = range[0]?.format("YYYY-MM-DD");
    const to = range[1]?.format("YYYY-MM-DD");
    return { from, to };
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await holidayList(params);
      if (resp?.success) {
        setRows(resp.data.items || []);
      }
    } catch (e: any) {
      message.error(e?.message || "Không tải được danh sách ngày lễ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onCreate = async () => {
    try {
      const v = await form.validateFields();
      await holidayCreate({
        ngay: v.ngay.format("YYYY-MM-DD"),
        ten: v.ten || undefined,
        trang_thai: v.trang_thai ?? true,
      });
      message.success("Đã lưu ngày lễ.");
      setOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      /* handled */
    }
  };

  const openEdit = (item: HolidayItem) => {
    setEditing(item);
    editForm.setFieldsValue({
      ten: item.ten,
      trang_thai: item.trang_thai,
    });
    setEditOpen(true);
  };

  const onUpdate = async () => {
    if (!editing) return;
    try {
      const v = await editForm.validateFields();
      await holidayUpdate(editing.id, {
        ten: v.ten ?? undefined,
        trang_thai: v.trang_thai ?? editing.trang_thai,
      });
      message.success("Đã cập nhật.");
      setEditOpen(false);
      setEditing(null);
      fetchData();
    } catch {
      /* handled */
    }
  };

  const onDelete = async (id: number) => {
    try {
      await holidayDelete(id);
      message.success("Đã xoá.");
      fetchData();
    } catch {
      /* handled */
    }
  };

  const columns: ColumnsType<HolidayItem> = [
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 140,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
      sorter: (a, b) => a.ngay.localeCompare(b.ngay),
    },
    { title: "Tên", dataIndex: "ten", key: "ten", ellipsis: true },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      key: "trang_thai",
      width: 140,
      render: (v: boolean) => (v ? <Tag color="green">Áp dụng</Tag> : <Tag color="default">Tắt</Tag>),
      filters: [
        { text: "Áp dụng", value: true },
        { text: "Tắt", value: false },
      ],
      onFilter: (value, record) => String(record.trang_thai) === String(value),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, r) => (
        <Space>
          <Button onClick={() => openEdit(r)}>Sửa</Button>
          <Popconfirm title="Xoá ngày lễ này?" onConfirm={() => onDelete(r.id)}>
            <Button danger>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Title level={3} style={{ margin: 0 }}>Quản trị Ngày Lễ</Title>

      <Card>
        <Space align="end" wrap>
          <Space direction="vertical" size={4}>
            <Text>Khoảng ngày</Text>
            <RangePicker
              value={range}
              onChange={(v) => setRange([v?.[0] ?? null, v?.[1] ?? null])}
              allowClear={false}
              format="DD/MM/YYYY"
            />
          </Space>
          <Button onClick={fetchData} loading={loading}>Làm mới</Button>
          <Button type="primary" onClick={() => setOpen(true)}>Thêm ngày lễ</Button>
        </Space>
      </Card>

      <Card>
        <Table<HolidayItem>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>

      {/* Modal tạo mới */}
      <Modal title="Thêm ngày lễ" open={open} onOk={onCreate} onCancel={() => setOpen(false)} okText="Lưu">
        <Form form={form} layout="vertical">
          <Form.Item name="ngay" label="Ngày" rules={[{ required: true, message: "Chọn ngày" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="ten" label="Tên (tuỳ chọn)">
            <Input placeholder="VD: Tết Dương lịch" />
          </Form.Item>
          <Form.Item name="trang_thai" label="Trạng thái" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Áp dụng" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title={`Sửa ngày lễ ${editing ? dayjs(editing.ngay).format("DD/MM/YYYY") : ""}`}
        open={editOpen}
        onOk={onUpdate}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        okText="Cập nhật"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="ten" label="Tên (tuỳ chọn)">
            <Input placeholder="VD: Quốc khánh (bù)" />
          </Form.Item>
          <Form.Item name="trang_thai" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Áp dụng" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
