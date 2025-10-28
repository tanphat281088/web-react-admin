/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { attendanceGetAdmin, type AttendanceItem, type AttendanceListResponse } from "../../services/attendance.api";
import axios from "../../configs/axios"; // dùng để load danh sách user nhanh (tái sử dụng axios đã có)
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type UserOption = { label: string; value: number };

export default function ChamCongQuanLy() {
  const { message } = App.useApp();

  // === state filter ===
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  // === data ===
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AttendanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // user options for filter
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const columns: ColumnsType<AttendanceItem> = [
    {
      title: "Nhân viên",
      dataIndex: "user_name",
      key: "user_name",
      render: (v, r) => v || `#${r.user_id}`,
      width: 220,
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (v: AttendanceItem["type"]) =>
        v === "checkin" ? <Tag color="green">Chấm công vào</Tag> : <Tag color="volcano">Chấm công ra</Tag>,
    },
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 120,
      render: (v, r) => v || (r.checked_at ? dayjs(r.checked_at).format("YYYY-MM-DD") : ""),
    },
    {
      title: "Giờ",
      dataIndex: "gio_phut",
      key: "gio_phut",
      width: 100,
      render: (v, r) => v || (r.checked_at ? dayjs(r.checked_at).format("HH:mm") : ""),
    },
    {
      title: "Trong vùng",
      dataIndex: "within",
      key: "within",
      width: 120,
      render: (v: boolean) => (v ? <Tag color="blue">Hợp lệ</Tag> : <Tag color="red">Ngoài vùng</Tag>),
    },
    {
      title: "Khoảng cách (m)",
      dataIndex: "distance_m",
      key: "distance_m",
      width: 140,
    },
    {
      title: "Thiết bị",
      dataIndex: "device_id",
      key: "device_id",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Mô tả",
      dataIndex: "short_desc",
      key: "short_desc",
      ellipsis: true,
    },
  ];

  const params = useMemo(() => {
    const from = range[0].format("YYYY-MM-DD");
    const to = range[1].format("YYYY-MM-DD");
    return { user_id: userId, from, to, page, per_page: perPage };
  }, [userId, range, page, perPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await attendanceGetAdmin(params);
      if (resp?.success) {
        const data = resp.data as AttendanceListResponse;
        setRows(data.items || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // handled globally
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // tái dùng API user list có sẵn: /nguoi-dung (nếu cần có thể thay bằng endpoint options riêng)
      const resp = await axios.get(API_ROUTE_CONFIG.NGUOI_DUNG, {
        params: { page: 1, per_page: 200, q: "" },
      });
      const items = resp?.data?.data?.items || resp?.data?.items || [];
      const opts: UserOption[] = items.map((u: any) => ({
        value: u.id,
        label: u.ho_ten || u.name || u.email || `#${u.id}`,
      }));
      setUsers(opts);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <Flex vertical gap={16}>
      <Title level={3} style={{ margin: 0 }}>
        Chấm công (Quản lý)
      </Title>

      <Card>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text>Nhân viên</Text>
              <Select
                allowClear
                loading={loadingUsers}
                placeholder="-- Tất cả --"
                options={users}
                value={userId}
                onChange={(v) => {
                  setPage(1);
                  setUserId(v);
                }}
                showSearch
                optionFilterProp="label"
              />
            </Space>
          </Col>
          <Col xs={24} md={10} lg={8}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text>Khoảng ngày</Text>
              <RangePicker
                value={range}
                onChange={(v) => {
                  if (!v || v.length !== 2) return;
                  setPage(1);
                  setRange([v[0]!, v[1]!]);
                }}
                allowClear={false}
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col xs={24} md={6} lg={10}>
            <Space style={{ marginTop: 22 }}>
              <Button onClick={() => setPage(1)}>Làm mới</Button>
              <Button type="primary" onClick={fetchData} loading={loading}>
                Tải dữ liệu
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table<AttendanceItem>
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
          }}
        />
      </Card>
    </Flex>
  );
}
