/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  Divider,
  Flex,
  List,
  message,
  Select,
  Space,
  Tag,
  Typography,
  Pagination
} from "antd";
import dayjs from "dayjs";
import axios from "../../../configs/axios";
import { API_ROUTE_CONFIG } from "../../../configs/api-route-config";



const { Title, Text } = Typography;

export type DonHangRow = {
  id: number;
  ma_don_hang: string;
  ten_khach_hang?: string | null;
  dia_chi_giao_hang?: string | null;
  nguoi_nhan_ten?: string | null;
  nguoi_nhan_sdt?: string | null;
  nguoi_nhan_thoi_gian: string; // ISO
  // 0=Chưa giao | 1=Đang giao | 2=Đã giao | 3=Đã hủy
  trang_thai_don_hang: 0 | 1 | 2 | 3;
};

type LichHomNayGroup = {
  slot: string; // "HH:mm–HH:mm"
  start: string; // ISO
  end: string; // ISO
  items: DonHangRow[];
};

type LichHomNayResp = {
  date: string; // YYYY-MM-DD
  bucket_minutes: number;
  groups: LichHomNayGroup[];
};

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: undefined },
  { label: "Chưa giao", value: 0 },
  { label: "Đang giao", value: 1 },
  { label: "Đã giao", value: 2 },
  { label: "Đã hủy", value: 3 },
];

const STATUS_TAG: Record<number, { color: string; label: string }> = {
  0: { color: "processing", label: "Chưa giao" },
  1: { color: "blue", label: "Đang giao" },
  2: { color: "success", label: "Đã giao" },
  3: { color: "error", label: "Đã hủy" },
};

const REMIND_MINUTES = 60;
const isSapGiao = (iso: string, status: number) => {
  if (status !== 0 && status !== 1) return false;
  const now = dayjs();
  const dt = dayjs(iso);
  const diff = dt.diff(now, "minute");
  return diff >= 0 && diff <= REMIND_MINUTES;
};

/**
 * Timeline “Lịch giao hôm nay”
 */
export default function LichGiaoHomNay() {
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [bucket, setBucket] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<LichHomNayGroup[]>([]);
  const [date, setDate] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ params sạch (chỉ gắn status khi có)
      const params: any = { bucket_minutes: bucket };
      if (status !== undefined && status !== null) params.status = status;

      const resp = await axios.get(API_ROUTE_CONFIG.GIAO_HANG_LICH_HOM_NAY, { params });

      // ✅ Hỗ trợ 2 dạng payload:
      // A) { success: true, data: { date, bucket_minutes, groups } }
      // B) { date, bucket_minutes, groups } (unwrap)
      const payload = resp?.data;
      let dataBlock: LichHomNayResp | undefined;

      if (payload && payload.success && payload.data) {
        dataBlock = payload.data as LichHomNayResp;
      } else if (payload && payload.date && Array.isArray(payload.groups)) {
        dataBlock = payload as LichHomNayResp;
      }

      if (dataBlock) {
        setGroups(dataBlock.groups || []);
        setDate(dataBlock.date || "");
      } else {
        setGroups([]);
        setDate("");
      }
    } catch {
      message.error("Không tải được Lịch giao hôm nay");
      setGroups([]);
      setDate("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, bucket]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Flex justify="space-between" align="center">
        <Title level={4} style={{ margin: 0 }}>
          Lịch giao hôm nay{" "}
          {date && <Text type="secondary">({dayjs(date).format("DD/MM/YYYY")})</Text>}
        </Title>
        <Space>
          <Select<number>
            style={{ width: 220 }}
            placeholder="Trạng thái"
            value={status}
            onChange={(v: number | undefined) => setStatus(v)}
            options={STATUS_OPTIONS}
            allowClear
          />
          <Select<number>
            style={{ width: 180 }}
            value={bucket}
            onChange={(v: number) => setBucket(v)}
            options={[
              { label: "Nhóm 60 phút", value: 60 },
              { label: "Nhóm 30 phút", value: 30 },
              { label: "Nhóm 90 phút", value: 90 },
            ]}
          />
        </Space>
      </Flex>

      <Card loading={loading} bodyStyle={{ padding: 12 }}>
        <List
          dataSource={groups}
          renderItem={(g) => (
            <List.Item key={g.start}>
              <List.Item.Meta
                title={
                  <Space>
                    <Badge status="processing" />
                    <Text strong>{g.slot}</Text>
                    <Text type="secondary">
                      ({dayjs(g.start).format("HH:mm")} – {dayjs(g.end).format("HH:mm")})
                    </Text>
                    <Tag>{g.items?.length || 0} đơn</Tag>
                  </Space>
                }
                description={
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <List
                      dataSource={g.items || []}
                      renderItem={(it) => (
                        <List.Item key={it.id} style={{ padding: "6px 0" }}>
                          <Flex wrap gap={8} align="center">
                            <Tag color="blue">{it.ma_don_hang}</Tag>
                            <Text>
                              <b>{it.nguoi_nhan_ten || "Người nhận"}</b> — {it.nguoi_nhan_sdt || "-"}
                            </Text>
                            <Text type="secondary">{it.dia_chi_giao_hang || "-"}</Text>
                            {isSapGiao(it.nguoi_nhan_thoi_gian, it.trang_thai_don_hang) && (
                              <Tag color="gold">Sắp giao ≤ 60’</Tag>
                            )}
                            <Tag color={STATUS_TAG[it.trang_thai_don_hang]?.color}>
                              {STATUS_TAG[it.trang_thai_don_hang]?.label}
                            </Tag>
                            <Text type="secondary">
                              {dayjs(it.nguoi_nhan_thoi_gian).format("HH:mm")}
                            </Text>
                          </Flex>
                        </List.Item>
                      )}
                    />
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
