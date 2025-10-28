/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Card, Col, DatePicker, Flex, Row, Segmented, Spin, Statistic, Typography, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { formatter } from "../../utils/utils";

const { RangePicker } = DatePicker;

type TongHopResp = {
  success: boolean;
  message: string;
  data: {
    from: string;
    to: string;
    tong_thu: number;
    tong_chi: number;
    chenh_lech: number;
  };
};

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "https://api.phgfloral.com/api";
const ENDPOINT = `${API_BASE}/thu-chi/bao-cao/tong-hop`;

const BaoCaoThuChi = () => {
  const [preset, setPreset] = useState<"week" | "month" | "custom">("week");
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TongHopResp["data"] | null>(null);

  useEffect(() => {
    if (preset === "week") {
      const from = dayjs().startOf("week");
      const to = dayjs().endOf("week");
      setRange([from, to]);
    } else if (preset === "month") {
      const from = dayjs().startOf("month");
      const to = dayjs().endOf("month");
      setRange([from, to]);
    }
  }, [preset]);

  const fetchData = async (params: { preset?: string; from?: string; to?: string }) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params.preset) qs.set("preset", params.preset);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      const resp = await fetch(`${ENDPOINT}?${qs.toString()}`, { method: "GET" });
      const json: TongHopResp = await resp.json();
      setData(json?.success ? json.data : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preset === "week") fetchData({ preset: "week" });
    if (preset === "month") fetchData({ preset: "month" });
  }, [preset]);

  const onApplyCustom = () => {
    if (!range) return;
    const [from, to] = range;
    fetchData({ from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") });
  };

  const displayFrom = useMemo(() => (data?.from ? dayjs(data.from).format("DD/MM/YYYY") : "-"), [data]);
  const displayTo = useMemo(() => (data?.to ? dayjs(data.to).format("DD/MM/YYYY") : "-"), [data]);

  return (
    <Flex vertical gap={12} className="bc-thuchi">
      <Typography.Title level={3} style={{ marginBottom: 0 }}>
        Báo cáo thu chi
      </Typography.Title>

      <Card>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="none">
            <Segmented
              value={preset}
              onChange={(val) => setPreset(val as any)}
              options={[
                { label: "Tuần này", value: "week" },
                { label: "Tháng này", value: "month" },
                { label: "Tùy chọn", value: "custom" },
              ]}
            />
          </Col>
          <Col flex="auto" />
          <Col flex="none">
            {preset === "custom" && (
              <Flex align="center" gap={8}>
                <RangePicker value={range as any} onChange={(val) => setRange(val as any)} format="DD/MM/YYYY" />
                <Button type="primary" onClick={onApplyCustom}>Áp dụng</Button>
              </Flex>
            )}
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Card><Statistic title={`Tổng thu (${displayFrom} → ${displayTo})`} value={`${formatter(data?.tong_thu || 0)} đ`} /></Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card><Statistic title={`Tổng chi (${displayFrom} → ${displayTo})`} value={`${formatter(data?.tong_chi || 0)} đ`} /></Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card><Statistic title={`Chênh lệch (${displayFrom} → ${displayTo})`} value={`${formatter(data?.chenh_lech || 0)} đ`} /></Card>
          </Col>
        </Row>
      </Spin>
    </Flex>
  );
};

export default BaoCaoThuChi;
