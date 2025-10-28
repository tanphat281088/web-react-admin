/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Col, DatePicker, Row, Statistic, Table, Typography, Button, Space, Drawer, Tabs, Tag, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");

import axios from "../../configs/axios";
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";
import { useEffect, useState } from "react";
import { formatter } from "../../utils/utils";
import axiosFile from "../../configs/axios-file";


const { RangePicker } = DatePicker;

// ====== CẬP NHẬT Summary keys để khớp backend mới ======
type Summary = {
  ["01_doanh_thu_ban_hang"]: number;
  ["02_gia_von_hang_ban"]: number;
  ["03_loi_nhuan_gop"]: number;
  ["04_doanh_thu_hd_tai_chinh"]: number;
  ["05_chi_phi_tai_chinh"]: number;
  ["06_chi_phi_ban_hang"]: number;
  ["07_chi_phi_quan_ly_dn"]: number;
  ["08_chi_phi_dau_tu_ccdc"]: number;            // MỚI
  ["09_loi_nhuan_thuan_hd_kd"]: number;          // MỚI
  ["10_chi_phi_khac"]: number;
  ["11_thu_nhap_khac"]: number;                  // MỚI
  ["12_loi_nhuan_khac"]: number;                 // MỚI (12 = 10 − 11)
  ["13_loi_nhuan_truoc_thue"]: number;
};

type DetailResp = {
  params: { from?: string; to?: string; line: number };
  byCategory?: Array<{ parent_name: string; category_name: string; category_code: string; total: number }>;
  byDay?: Record<string, number>;
  rows: Array<any>;
};

// ====== CẬP NHẬT map để hỗ trợ xem chi tiết cho line 8 (CCDC) ======
const LINE_MAP: Record<number, { title: string }> = {
  1:  { title: "01. Doanh thu" },
  2:  { title: "02. Giá vốn" },
  5:  { title: "05. Chi phí tài chính" },
  6:  { title: "06. Chi phí bán hàng" },
  7:  { title: "07. Chi phí QLDN" },
  8:  { title: "08. Chi phí CCDC" },            // MỚI
  10: { title: "10. Chi phí khác" },
};

export default function BaoCaoKQKD() {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sum, setSum] = useState<Summary | null>(null);
  const [series, setSeries] = useState<any[]>([]);

  // Drawer state
  const [open, setOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTitle, setDetailTitle] = useState<string>("");
  const [detail, setDetail] = useState<DetailResp | null>(null);
  const [detailLine, setDetailLine] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { group_by: "month" };
      if (range) {
        params.from = range[0].format("YYYY-MM-DD");
        params.to   = range[1].format("YYYY-MM-DD");
      }
      const res = await axios.get(API_ROUTE_CONFIG.BAO_CAO_KQKD, { params }) as any;
      setSum(res.data.summary);
      setSeries(res.data.series || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (line: number) => {
    setDetailLoading(true);
    try {
      const params: any = { line };
      if (range) {
        params.from = range[0].format("YYYY-MM-DD");
        params.to   = range[1].format("YYYY-MM-DD");
      }
      const res = await axios.get(API_ROUTE_CONFIG.BAO_CAO_KQKD_DETAIL, { params }) as any;
      setDetail(res.data as DetailResp);
    } finally {
      setDetailLoading(false);
    }
  };

const exportFile = async (fmt: "xlsx" | "pdf") => {
  const params: any = { group_by: "month", format: fmt };
  if (range) {
    params.from = range[0].format("YYYY-MM-DD");
    params.to   = range[1].format("YYYY-MM-DD");
  }

  // QUAN TRỌNG: ép Axios giữ nguyên blob, không transform/parse
const res = await axiosFile.get(API_ROUTE_CONFIG.BAO_CAO_KQKD_EXPORT, { params });
const blob = new Blob([res.data], { type: fmt === "pdf"
  ? "application/pdf"
  : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });


  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BaoCao_KQKD_${dayjs().format("YYYYMMDD_HHmmss")}.${fmt}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};


  useEffect(() => { fetchData(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  const openDetail = (line: number) => {
    setDetailLine(line);
    setDetailTitle(LINE_MAP[line]?.title || `Chi tiết (line=${line})`);
    setOpen(true);
    // chỉ fetch detail nếu backend hỗ trợ line đó
    if ([1,2,5,6,7,8,10].includes(line)) {
      fetchDetail(line);
    } else {
      setDetail(null);
    }
  };

  const compositeHint = (left: number, right: number) => (
    <Space>
      <Button onClick={()=>openDetail(left)}>{LINE_MAP[left].title}</Button>
      <Button onClick={()=>openDetail(right)}>{LINE_MAP[right].title}</Button>
    </Space>
  );

  // ====== CẬP NHẬT bộ KPI để hiển thị thêm 04, 08, 09, 11, 12 ======
  const kpiItems = [
    { key: "01", title: "01. Doanh thu",            value: sum?.["01_doanh_thu_ban_hang"] ?? 0, onClick: ()=>openDetail(1)  },
    { key: "02", title: "02. Giá vốn",              value: sum?.["02_gia_von_hang_ban"] ?? 0,   onClick: ()=>openDetail(2)  },
    { key: "03", title: "03. Lợi nhuận gộp",        value: sum?.["03_loi_nhuan_gop"] ?? 0,      onClick: ()=>{ setOpen(true); setDetailTitle("03. Lợi nhuận gộp = 01 − 02"); setDetail(null); setDetailLine(null);} },

    { key: "04", title: "04. DT tài chính",         value: sum?.["04_doanh_thu_hd_tai_chinh"] ?? 0, onClick: ()=>{ setOpen(true); setDetailTitle("04. Doanh thu hoạt động tài chính"); setDetail(null); setDetailLine(null);} },
    { key: "05", title: "05. CP tài chính",         value: sum?.["05_chi_phi_tai_chinh"] ?? 0,  onClick: ()=>openDetail(5)  },
    { key: "06", title: "06. CP bán hàng",          value: sum?.["06_chi_phi_ban_hang"] ?? 0,   onClick: ()=>openDetail(6)  },
    { key: "07", title: "07. CP QLDN",              value: sum?.["07_chi_phi_quan_ly_dn"] ?? 0, onClick: ()=>openDetail(7)  },
    { key: "08", title: "08. CP CCDC",              value: sum?.["08_chi_phi_dau_tu_ccdc"] ?? 0, onClick: ()=>openDetail(8) },

    { key: "09", title: "09. LN thuần HĐKD",        value: sum?.["09_loi_nhuan_thuan_hd_kd"] ?? 0, onClick: ()=>{ setOpen(true); setDetailTitle("09 = 03 + 04 − 05 − 06 − 07 − 08"); setDetail(null); setDetailLine(null);} },
    { key: "10", title: "10. Chi phí khác",         value: sum?.["10_chi_phi_khac"] ?? 0,       onClick: ()=>openDetail(10) },
    { key: "11", title: "11. Thu nhập khác",        value: sum?.["11_thu_nhap_khac"] ?? 0,      onClick: ()=>{ setOpen(true); setDetailTitle("11. Thu nhập khác"); setDetail(null); setDetailLine(null);} },
    { key: "12", title: "12. LN khác (12 = 10 − 11)", value: sum?.["12_loi_nhuan_khac"] ?? 0,   onClick: ()=>{ setOpen(true); setDetailTitle("12 = 10 − 11"); setDetail(null); setDetailLine(null);} },

    { key: "13", title: "13. Lợi nhuận trước thuế", value: sum?.["13_loi_nhuan_truoc_thue"] ?? 0, onClick: ()=>{ setOpen(true); setDetailTitle("13 = 09 + 12"); setDetail(null); setDetailLine(null);} },
  ];

  // ====== CẬP NHẬT cột bảng tháng để bám series mới ======
  const columns = [
    { title: "Kỳ (YYYY-MM)", dataIndex: "ym" },
    { title: "01 Doanh thu", dataIndex: "01", align:"right", render:(v:number)=>formatter(v) },
    { title: "02 Giá vốn",   dataIndex: "02", align:"right", render:(v:number)=>formatter(v) },
    { title: "03 Lợi nhuận gộp", dataIndex: "03", align:"right", render:(v:number)=>formatter(v) },
    { title: "04 DT tài chính",  dataIndex: "04", align:"right", render:(v:number)=>formatter(v) },   // MỚI
    { title: "05 CP TC",     dataIndex: "05", align:"right", render:(v:number)=>formatter(v) },
    { title: "06 CP BH",     dataIndex: "06", align:"right", render:(v:number)=>formatter(v) },
    { title: "07 CP QLDN",   dataIndex: "07", align:"right", render:(v:number)=>formatter(v) },
    { title: "08 CP CCDC",   dataIndex: "08", align:"right", render:(v:number)=>formatter(v) },        // MỚI
    { title: "09 LN thuần",  dataIndex: "09", align:"right", render:(v:number)=>formatter(v) },        // MỚI
    { title: "10 CP khác",   dataIndex: "10", align:"right", render:(v:number)=>formatter(v) },
    { title: "11 TN khác",   dataIndex: "11", align:"right", render:(v:number)=>formatter(v) },        // MỚI
    { title: "12 LN khác",   dataIndex: "12", align:"right", render:(v:number)=>formatter(v) },        // MỚI (12 = 10 − 11)
    { title: "13 LNTT",      dataIndex: "13", align:"right", render:(v:number)=>formatter(v) },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Card>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col><Typography.Title level={4}>Báo cáo KQKD</Typography.Title></Col>
          <Col>
            <Space>
              <ConfigProvider locale={viVN}>
                <RangePicker
                  value={range as any}
                  onChange={(v)=>setRange(v as any)}
                  format="YYYY-MM-DD"
                  placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}   // VIỆT HOÁ
                  allowClear
                />
              </ConfigProvider>

              <Button type="primary" onClick={fetchData} loading={loading}>Xem báo cáo</Button>
              <Button onClick={() => exportFile("xlsx")} loading={loading}>Xuất Excel</Button>
              <Button onClick={() => exportFile("pdf")}  loading={loading}>Xuất PDF</Button>
<Button
  onClick={async () => {
    // gom tham số giống export
    const params: any = { group_by: "month", format: "pdf" };
    if (range) {
      params.from = range[0].format("YYYY-MM-DD");
      params.to   = range[1].format("YYYY-MM-DD");
    }

    // tải bằng axiosFile để mang theo Authorization
    const res = await axiosFile.get(API_ROUTE_CONFIG.BAO_CAO_KQKD_EXPORT, { params });
    const blob = new Blob([res.data], { type: "application/pdf" });

    // mở trong tab mới (không tải về)
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");

    // (tuỳ chọn) thu hồi URL sau vài giây
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }}
>
  Xem PDF
</Button>


            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16,16]}>
        {kpiItems.map((k,i)=>(
          <Col xs={24} sm={12} md={8} lg={6} key={i}>
            <Card hoverable loading={loading} onClick={k.onClick}>
              <Statistic title={k.title} value={formatter(k.value)} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Biến động theo tháng" loading={loading}>
        <Table rowKey="ym" columns={columns as any} dataSource={series} pagination={false} />
      </Card>

      <Drawer
        title={detailTitle}
        open={open}
        width={1000}
        onClose={()=>setOpen(false)}
      >
        {/* KPI tổng hợp (03/04/09/11/12/13) → hiển thị công thức & nút mở cấu phần khi có */}
        {!detail && (detailLine === null) && (
          <Space direction="vertical">
            {detailTitle.startsWith("03") && (
              <>
                <Typography.Paragraph>03 = 01 − 02</Typography.Paragraph>
                {compositeHint(1,2)}
              </>
            )}
            {detailTitle.startsWith("09") && (
              <>
                <Typography.Paragraph>09 = 03 + 04 − 05 − 06 − 07 − 08</Typography.Paragraph>
                <Space>
                  <Button onClick={()=>openDetail(2)}>02</Button>
                  <Button onClick={()=>openDetail(5)}>05</Button>
                  <Button onClick={()=>openDetail(6)}>06</Button>
                  <Button onClick={()=>openDetail(7)}>07</Button>
                  <Button onClick={()=>openDetail(8)}>08</Button>
                </Space>
              </>
            )}
            {detailTitle.startsWith("12") && (
              <Typography.Paragraph>12 = 10 − 11</Typography.Paragraph>
            )}
            {detailTitle.startsWith("13") && (
              <>
                <Typography.Paragraph>13 = 09 + 12</Typography.Paragraph>
                <Space>
                  <Button onClick={()=>{ setOpen(true); setDetailTitle("09 = 03 + 04 − 05 − 06 − 07 − 08"); setDetail(null); setDetailLine(null);} }>09</Button>
                  <Button onClick={()=>{ setOpen(true); setDetailTitle("12 = 10 − 11"); setDetail(null); setDetailLine(null);} }>12</Button>
                </Space>
              </>
            )}
          </Space>
        )}

        {/* KPI đơn (01 / 02 / 05 / 06 / 07 / 08 / 10) — có API detail */}
        {detail && (
          <Tabs
            items={[
              ...(detail.byCategory ? [{
                key: "cat",
                label: "Tổng theo danh mục",
                children: (
                  <Table
                    rowKey={(r)=>`${r.category_name}-${r.category_code}`}
                    loading={detailLoading}
                    columns={[
                      { title: "Nhóm", dataIndex: "parent_name" },
                      { title: "Danh mục", dataIndex: "category_name" },
                      { title: "Tổng tiền", dataIndex: "total", align:"right", render:(v:number)=>formatter(v) },
                    ]}
                    dataSource={detail.byCategory}
                    pagination={false}
                  />
                )
              }] : []),
              ...(detail.byDay ? [{
                key: "day",
                label: "Tổng theo ngày",
                children: (
                  <Table
                    rowKey="ngay"
                    loading={detailLoading}
                    columns={[
                      { title: "Ngày", dataIndex: "ngay" },
                      { title: "Tổng tiền", dataIndex: "total", align:"right", render:(v:number)=>formatter(v) },
                    ]}
                    dataSource={Object.entries(detail.byDay).map(([ngay,total])=>({ngay,total}))}
                    pagination={false}
                  />
                )
              }] : []),
              {
                key: "list",
                label: "Danh sách chứng từ",
                children: (
                  <Table
                    rowKey={(r)=>r.id}
                    loading={detailLoading}
                    columns={[
                      { title: "Mã chứng từ", dataIndex: (detailLine===1?'ma_phieu_thu':'ma_phieu_chi') as any },
                      { title: "Ngày", dataIndex: (detailLine===1?'ngay':'ngay_chi') as any },
                      { title: "Người", dataIndex: (detailLine===1?'nguoi_tra':'nguoi_nhan') as any },

                      ...(detailLine===1 ? [] : [
                        { title: "Danh mục", dataIndex: "category_name" as any },
                      ]),
                      { title: "Số tiền", dataIndex: "so_tien" as any, align:"right", render:(v:number)=>formatter(v) },
                    ]}
                    dataSource={detail.rows}
                    pagination={{ pageSize: 10 }}
                  />
                )
              }
            ]}
          />
        )}
      </Drawer>
    </Space>
  );
}
