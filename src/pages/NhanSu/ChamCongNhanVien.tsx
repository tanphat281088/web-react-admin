/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  attendanceCheckin,
  attendanceCheckout,
  attendanceGetMy,
  type AttendanceItem,
} from "../../services/attendance.api";

const getRespError = (resp: any) =>
  (resp && (resp.message || resp?.data?.message || resp?.extra?.code || resp?.code)) ||
  "Lỗi không xác định.";


const { Title, Text } = Typography;

type GeoState = {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  error?: string | null;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ Geolocation."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

export default function ChamCongNhanVien() {
  const { message, modal, notification } = App.useApp();

  const [geo, setGeo] = useState<GeoState>({ lat: null, lng: null, accuracy: null, error: null });
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [submitting, setSubmitting] = useState<"in" | "out" | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [rows, setRows] = useState<AttendanceItem[]>([]);

  const range = useMemo(() => {
    const to = dayjs().format("YYYY-MM-DD");
    const from = dayjs().subtract(30, "day").format("YYYY-MM-DD");
    return { from, to };
  }, []);

  const columns: ColumnsType<AttendanceItem> = [
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 110,
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

  const fetchGeo = async () => {
    setLoadingGeo(true);
    try {
      const pos = await getCurrentPosition();
      setGeo({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
        error: null,
      });
    } catch (err: any) {
      const msg =
        err?.message ||
        (err?.code === 1
          ? "Bạn đã từ chối quyền vị trí."
          : err?.code === 2
          ? "Không lấy được vị trí."
          : "Lỗi vị trí không xác định.");
      setGeo((g) => ({ ...g, error: msg }));
      message.error(msg);
    } finally {
      setLoadingGeo(false);
    }
  };

  const fetchMy = async () => {
    setLoadingTable(true);
    try {
      const resp = await attendanceGetMy(range);
      if (resp?.success) {
        setRows(resp.data.items || []);
      }
    } catch {
      // handled globally
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    // lấy vị trí & lịch sử khi mở trang
    fetchGeo();
    fetchMy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabledAction = useMemo(() => {
    return loadingGeo || submitting !== null || geo.lat === null || geo.lng === null;
  }, [loadingGeo, submitting, geo.lat, geo.lng]);

  const onCheckIn = async () => {
    if (geo.lat == null || geo.lng == null) {
      message.warning("Chưa có vị trí, vui lòng thử lại.");
      return;
    }
    setSubmitting("in");
    try {
      const resp = await attendanceCheckin({
        lat: geo.lat,
        lng: geo.lng,
        accuracy_m: geo.accuracy ?? undefined,
        device_id: "WEB",
      });
if (resp.success) {
  message.success("Chấm công vào thành công!");
  await fetchMy();
} else {
  notification.error({
    message: "Không thể Chấm công vào",
    description: getRespError(resp),
  });
}

    } catch {
      // handled
    } finally {
      setSubmitting(null);
    }
  };

  const onCheckOut = async () => {
    if (geo.lat == null || geo.lng == null) {
      message.warning("Chưa có vị trí, vui lòng thử lại.");
      return;
    }
    setSubmitting("out");
    try {
      const resp = await attendanceCheckout({
        lat: geo.lat,
        lng: geo.lng,
        accuracy_m: geo.accuracy ?? undefined,
        device_id: "WEB",
      });
if (resp.success) {
  message.success("Chấm công ra thành công!");
  await fetchMy();
} else {
  notification.error({
    message: "Không thể Chấm công ra",
    description: getRespError(resp),
  });
}

    } catch {
      // handled
    } finally {
      setSubmitting(null);
    }
  };

  const todayHas = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const ins = rows.find((r) => r.type === "checkin" && (r.ngay || dayjs(r.checked_at).format("YYYY-MM-DD")) === today);
    const outs = rows.find(
      (r) => r.type === "checkout" && (r.ngay || dayjs(r.checked_at).format("YYYY-MM-DD")) === today
    );
    return { ins: !!ins, outs: !!outs };
  }, [rows]);

  return (
    <Flex vertical gap={16}>
      <Title level={3} style={{ margin: 0 }}>
        Chấm công (Nhân viên)
      </Title>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Vị trí hiện tại">
                {loadingGeo ? (
                  <Space>
                    <Spin size="small" /> Đang lấy vị trí…
                  </Space>
                ) : geo.error ? (
                  <Text type="danger">{geo.error}</Text>
                ) : geo.lat && geo.lng ? (
                  <Space direction="vertical" size={2}>
                    <Text>
                      Lat: <Text code>{geo.lat.toFixed(6)}</Text> &nbsp;Lng: <Text code>{geo.lng.toFixed(6)}</Text>
                    </Text>
                    {Number.isFinite(geo.accuracy) && (
                      <Text type="secondary">Độ chính xác ~ {geo.accuracy} m</Text>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary">Chưa có vị trí.</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Khoảng thời gian">
                {dayjs(range.from).format("DD/MM/YYYY")} → {dayjs(range.to).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái hôm nay">
                <Space>
                  <Tag color={todayHas.ins ? "green" : "default"}>
                    {todayHas.ins ? "ĐÃ chấm công vào" : "CHƯA chấm công vào"}
                  </Tag>
                  <Tag color={todayHas.outs ? "volcano" : "default"}>
                    {todayHas.outs ? "ĐÃ chấm công ra" : "CHƯA chấm công ra"}
                  </Tag>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Flex vertical gap={8} align="flex-start">
              <Space wrap>
                <Button onClick={fetchGeo} loading={loadingGeo}>
                  Lấy lại vị trí
                </Button>
                <Button
                  type="primary"
                  disabled={disabledAction || todayHas.ins}
                  loading={submitting === "in"}
                  onClick={onCheckIn}
                >
                  Chấm công vào
                </Button>
                <Button
                  danger
                  disabled={disabledAction || !todayHas.ins || todayHas.outs}
                  loading={submitting === "out"}
                  onClick={onCheckOut}
                >
                  Chấm công ra
                </Button>
              </Space>
              <Alert
                type="info"
                showIcon
                message="Lưu ý"
                description="Chỉ cho phép chấm công tại cửa hàng PHG Floral & Decor (100 Nguyễn Minh Hoàng). Nếu ở ngoài vùng, hệ thống sẽ từ chối nhé anh em."
              />
            </Flex>
          </Col>
        </Row>
      </Card>

      <Card>
        <Flex justify="space-between" align="center">
          <Title level={4} style={{ margin: 0 }}>
            Lịch sử 30 ngày gần nhất
          </Title>
          <Space>
            <Button onClick={fetchMy} loading={loadingTable}>
              Làm mới
            </Button>
          </Space>
        </Flex>
        <Divider style={{ margin: "12px 0" }} />
        <Table<AttendanceItem>
          rowKey="id"
          size="middle"
          loading={loadingTable}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Flex>
  );
}
