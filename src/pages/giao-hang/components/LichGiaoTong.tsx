/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  DatePicker,
  Flex,
  message,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import axios from "../../../configs/axios";
import { API_ROUTE_CONFIG } from "../../../configs/api-route-config";

// ==== FullCalendar
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
};

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: -1 },
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

const formatDateTime = (iso?: string | null) =>
  iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "";

// ==== màu cho event calendar theo trạng thái (bám màu AntD)
const statusToEventColor = (st: 0 | 1 | 2 | 3): string => {
  switch (st) {
    case 2:
      return "#52c41a"; // success
    case 1:
      return "#1677ff"; // blue
    case 3:
      return "#ff4d4f"; // error
    default:
      return "#13c2c2"; // processing-ish (cyan)
  }
};

type ViewMode = "table" | "week" | "month";

export default function LichGiaoTong() {
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("week"),
    dayjs().endOf("week"),
  ]);

  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ====== BẢNG
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DonHangRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // ====== LỊCH
  const [calLoading, setCalLoading] = useState(false);
  const [calRows, setCalRows] = useState<DonHangRow[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);

  // ==== FETCH: BẢNG
  const fetchTableData = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: perPage, page: Math.max(1, page) };
      if (range?.[0]) params.from = range[0].format("YYYY-MM-DD");
      if (range?.[1]) params.to = range[1].format("YYYY-MM-DD");
      if (status != null) params.status = status;

      const resp = await axios.get(API_ROUTE_CONFIG.GIAO_HANG_LICH_TONG, { params });
      const payload = resp?.data;
      let pag: Paginated<DonHangRow> | undefined;

      if (payload && payload.success && payload.data) {
        pag = payload.data as Paginated<DonHangRow>;
      } else if (
        payload &&
        typeof payload.current_page !== "undefined" &&
        Array.isArray(payload.data)
      ) {
        pag = payload as Paginated<DonHangRow>;
      }

      if (pag) {
        const data = Array.isArray(pag.data) ? pag.data : [];
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
      message.error("Không tải được Lịch giao tổng (bảng)");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // ==== FETCH: LỊCH (KHÔNG PHÂN TRANG)
  const fetchCalendarData = async (from: Dayjs, to: Dayjs) => {
    try {
      setCalLoading(true);
      const params: any = {
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        per_page: 10000, // hoặc mode=all nếu backend hỗ trợ
        page: 1,
      };
      if (status != null) params.status = status;

      const resp = await axios.get(API_ROUTE_CONFIG.GIAO_HANG_LICH_TONG, { params });
      const payload = resp?.data;
      // hỗ trợ cả 2 dạng
      const dataBlock: DonHangRow[] =
        (payload?.success && Array.isArray(payload?.data?.data) && payload.data.data) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.rows) && payload.rows) ||
        [];

      setCalRows(dataBlock);
    } catch {
      message.error("Không tải được dữ liệu lịch (tuần/tháng)");
      setCalRows([]);
    } finally {
      setCalLoading(false);
    }
  };

  // Đồng bộ fetch theo viewMode
  useEffect(() => {
    if (viewMode === "table") {
      fetchTableData();
    } else {
      fetchCalendarData(range[0], range[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, range, page, perPage, viewMode]);

  // Gom theo ngày (hiển thị nhãn nhanh khi ở chế độ Bảng)
  const countsByDate = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const d = dayjs(r.nguoi_nhan_thoi_gian).format("YYYY-MM-DD");
      m.set(d, (m.get(d) || 0) + 1);
    });
    return m;
  }, [rows]);

  const columns: ColumnsType<DonHangRow> = [
    {
      title: "Ngày–giờ nhận",
      dataIndex: "nguoi_nhan_thoi_gian",
      key: "nguoi_nhan_thoi_gian",
      width: 170,
      render: (iso: string) => formatDateTime(iso),
      sorter: (a, b) =>
        dayjs(a.nguoi_nhan_thoi_gian).valueOf() - dayjs(b.nguoi_nhan_thoi_gian).valueOf(),
    },
    {
      title: "Mã đơn",
      dataIndex: "ma_don_hang",
      key: "ma_don_hang",
      width: 120,
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v}</Text>
          {isSapGiao(r.nguoi_nhan_thoi_gian, r.trang_thai_don_hang) && (
            <Tag color="gold">Sắp giao ≤ 60’</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Người nhận",
      dataIndex: "nguoi_nhan_ten",
      key: "nguoi_nhan_ten",
      width: 180,
      render: (v?: string | null) => v || "-",
    },
    {
      title: "SĐT",
      dataIndex: "nguoi_nhan_sdt",
      key: "nguoi_nhan_sdt",
      width: 140,
      render: (v?: string | null) => v || "-",
    },
    {
      title: "Địa chỉ giao",
      dataIndex: "dia_chi_giao_hang",
      key: "dia_chi_giao_hang",
      ellipsis: true,
      render: (v?: string | null) => v || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai_don_hang",
      key: "trang_thai_don_hang",
      width: 140,
      render: (st: number) => (
        <Tag color={STATUS_TAG[st]?.color}>{STATUS_TAG[st]?.label ?? "-"}</Tag>
      ),
    },
  ];

  // ==== Build events cho Calendar
  const calendarEvents = useMemo(
    () =>
      (calRows || []).map((r) => ({
        id: String(r.id),
        title: `${r.ma_don_hang}${r.nguoi_nhan_ten ? " • " + r.nguoi_nhan_ten : ""}`,
        start: r.nguoi_nhan_thoi_gian, // ISO
        end: r.nguoi_nhan_thoi_gian, // đơn có 1 thời điểm; nếu có khung giờ có thể +duration
        backgroundColor: statusToEventColor(r.trang_thai_don_hang),
        borderColor: statusToEventColor(r.trang_thai_don_hang),
        extendedProps: {
          sdt: r.nguoi_nhan_sdt,
          address: r.dia_chi_giao_hang,
          status: r.trang_thai_don_hang,
        },
      })),
    [calRows]
  );

  // Khi người dùng đổi tháng/tuần trên calendar → đồng bộ RangePicker & refetch
  const handleDatesSet = (arg: { start: Date; end: Date }) => {
    const newFrom = dayjs(arg.start);
    const newTo = dayjs(arg.end).subtract(1, "day"); // FC end exclusive
    // Chỉ cập nhật khi khác để tránh loop
    if (
      !newFrom.isSame(range[0], "day") ||
      !newTo.isSame(range[1], "day")
    ) {
      setRange([newFrom, newTo]);
    }
  };

  // Click một event → mở chi tiết (placeholder)
  const handleEventClick = (info: any) => {
    const id = info?.event?.id;
    const ma = info?.event?.title || "";
    const addr = info?.event?.extendedProps?.address;
    const sdt = info?.event?.extendedProps?.sdt;
    const st = info?.event?.extendedProps?.status as 0 | 1 | 2 | 3;

    message.info(
      <>
        <div><b>{ma}</b></div>
        <div>{addr || "-"}</div>
        <div>SĐT: {sdt || "-"}</div>
        <div>Trạng thái: {STATUS_TAG[st]?.label}</div>
      </>,
      3
    );

    // TODO: Điều hướng tới trang chi tiết đơn (nếu có):
    // navigate(`/admin/don-hang/${id}`);
  };

  // Chuyển view calendar
  const currentCalendarView =
    viewMode === "week" ? "timeGridWeek" : viewMode === "month" ? "dayGridMonth" : undefined;

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Flex justify="space-between" align="center">
        <Title level={4} style={{ margin: 0 }}>
          Lịch giao tổng
        </Title>

        <Space wrap>
          {/* Chọn chế độ hiển thị */}
          <Segmented<ViewMode>
            options={[
              { label: "Bảng", value: "table" },
              { label: "Tuần", value: "week" },
              { label: "Tháng", value: "month" },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
          />

          {/* RangePicker luôn dùng được để nhảy nhanh khoảng thời gian */}
          <RangePicker
            value={range}
            onChange={(vals) => {
              if (vals && vals[0] && vals[1]) setRange([vals[0], vals[1]]);
              setPage(1);
            }}
            format="DD/MM/YYYY"
          />

          <Select<number>
            style={{ width: 200 }}
            placeholder="Trạng thái"
            value={status ?? -1}
            onChange={(v) => {
              setStatus(v === -1 ? undefined : v);
              setPage?.(1);
            }}
            options={STATUS_OPTIONS}
            allowClear
            onClear={() => {
              setStatus(undefined);
              setPage?.(1);
            }}
          />
        </Space>
      </Flex>

      {/* ======= VIEW: CALENDAR (TUẦN / THÁNG) ======= */}
      {currentCalendarView && (
        <Card bodyStyle={{ padding: 8 }} loading={calLoading}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
            <Space>
              <Tooltip title="Hôm nay">
                <Button
                  onClick={() => {
                    const api = calendarRef.current?.getApi();
                    api?.today();
                  }}
                  size="small"
                >
                  Hôm nay
                </Button>
              </Tooltip>
              <Button
                size="small"
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  api?.prev();
                }}
              >
                Trước
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  api?.next();
                }}
              >
                Sau
              </Button>
            </Space>

            <Text type="secondary">
              {range[0].format("DD/MM/YYYY")} — {range[1].format("DD/MM/YYYY")}
            </Text>
          </Flex>

          <FullCalendar
            ref={calendarRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentCalendarView}
            headerToolbar={false}
            locale="vi"               // cần dayjs vi nếu muốn format rộng hơn
            firstDay={1}             // Thứ 2 đầu tuần
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            height="auto"
            events={calendarEvents}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            nowIndicator
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            // Render nội dung event gọn gàng
            eventContent={(arg) => {
              const timeText = arg.timeText ? `${arg.timeText} ` : "";
              return (
                <div style={{ fontSize: 12, lineHeight: 1.25 }}>
                  <b>{timeText}</b>
                  <span>{arg.event.title}</span>
                </div>
              );
            }}
          />
        </Card>
      )}

      {/* ======= VIEW: BẢNG ======= */}
      {viewMode === "table" && (
        <>
          {/* Nhãn đếm theo ngày (tham khảo nhanh) */}
          <Card>
            <Flex wrap gap={12}>
              {[...countsByDate.entries()].map(([d, c]) => (
                <Tag key={d} color="blue">
                  {dayjs(d).format("DD/MM")} : {c} đơn
                </Tag>
              ))}
              {countsByDate.size === 0 && (
                <Text type="secondary">Không có đơn trong khoảng đã chọn.</Text>
              )}
            </Flex>
          </Card>

          {/* Bảng chi tiết */}
          <Card bodyStyle={{ padding: 12 }}>
            <Table<DonHangRow>
              rowKey="id"
              size="middle"
              loading={loading}
              dataSource={rows}
              columns={columns}
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
        </>
      )}
    </Space>
  );
}
