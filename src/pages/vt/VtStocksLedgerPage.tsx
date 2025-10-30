/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, DatePicker, Input, Select, Space, Table, Tabs, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { vtStocks, vtLedger } from "../../services/vt.api";
import type { JSX } from "react";

export default function VtStocksLedgerPage(): JSX.Element {
  const [active, setActive] = useState<"stocks" | "ledger">("stocks");

  return (
    <Card title="Tồn hiện tại & Sổ kho">
      <Tabs activeKey={active} onChange={(k) => setActive(k as any)} items={[
        { key: "stocks", label: "Tồn hiện tại", children: <StocksTab/> },
        { key: "ledger", label: "Sổ kho", children: <LedgerTab/> },
      ]}/>
    </Card>
  );
}

/** -------- TỒN -------- */
function StocksTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [q, setQ] = useState<string | undefined>();
  const [loai, setLoai] = useState<"ASSET" | "CONSUMABLE" | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await vtStocks({ q, loai, page, per_page: perPage });
      const data = res?.data || {};
      setRows(data.collection || []);
      setTotal(data.total || 0);
    } catch (e:any) { message.error(e.message || "Lỗi tải tồn"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, perPage, loai]);

  const columns: ColumnsType<any> = useMemo(() => [
    { title: "Mã VT", dataIndex: "ma_vt", width: 140, fixed: "left" },
    { title: "Tên VT", dataIndex: "ten_vt", width: 260 },
    { title: "ĐVT", dataIndex: "don_vi_tinh", width: 90 },
    { title: "Loại", dataIndex: "loai", width: 120, render: (v) => v === "ASSET" ? <Tag color="blue">Tài sản</Tag> : <Tag>Tiêu hao</Tag> },
    { title: "Danh mục", dataIndex: "danh_muc_vt", width: 180 },
    { title: "Nhóm", dataIndex: "nhom_vt", width: 180 },
    { title: "Số lượng tồn", dataIndex: "so_luong_ton", width: 130 },
    { title: "Giá trị tồn", dataIndex: "gia_tri_ton", width: 140, render: (v) => v !== null && v !== undefined ? v.toLocaleString() : "-" },
  ], []);

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search placeholder="Tìm mã/tên VT…" allowClear onSearch={setQ as any} style={{ width: 260 }} />
        <Select
          placeholder="Lọc loại"
          allowClear
          value={loai}
          style={{ width: 180 }}
          onChange={(v) => { setLoai(v as any); setPage(1); }}
          options={[{ label: "Tài sản", value: "ASSET" }, { label: "Tiêu hao", value: "CONSUMABLE" }]}
        />
        <Button onClick={() => { setPage(1); fetchData(); }}>Làm mới</Button>
      </Space>

      <Table
        rowKey={(r:any) => `${r.vt_item_id}`}
        size="middle"
        loading={loading}
        dataSource={rows}
        columns={columns}
        scroll={{ x: 1100 }}
        pagination={{ current: page, pageSize: perPage, total, onChange: (p,s)=>{setPage(p); setPerPage(s);} }}
      />
    </>
  );
}

/** -------- SỔ KHO -------- */
function LedgerTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [loai_ct, setLoaiCt] = useState<"OPENING"|"RECEIPT"|"ISSUE"|"ADJUST"|undefined>();
  const [q, setQ] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await vtLedger({ from, to, loai_ct, q, page, per_page: perPage });
      const data = res?.data || {};
      setRows(data.collection || []);
      setTotal(data.total || 0);
    } catch (e:any) { message.error(e.message || "Lỗi tải sổ kho"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, perPage, from, to, loai_ct]);

  const columns: ColumnsType<any> = useMemo(() => [
    { title: "Ngày", dataIndex: "ngay_ct", width: 120, render: (v) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Loại CT", dataIndex: "loai_ct", width: 120, render: (v) => <Tag color={v==="ISSUE"?"red":v==="RECEIPT"?"green":v==="ADJUST"?"orange":"blue"}>{v}</Tag> },
    { title: "Mã VT", dataIndex: ["item","ma_vt"], width: 140 },
    { title: "Tên VT", dataIndex: ["item","ten_vt"], width: 260 },
    { title: "ĐVT", dataIndex: ["item","don_vi_tinh"], width: 90 },
    { title: "SL vào", dataIndex: "so_luong_in", width: 90 },
    { title: "SL ra", dataIndex: "so_luong_out", width: 90 },
    {
  title: "Đơn giá",
  dataIndex: "don_gia",
  width: 140,
  render: (v: any) =>
    v !== null && v !== undefined
      ? `${new Intl.NumberFormat("vi-VN").format(Number(v))} ₫`
      : "-",
},

    { title: "Tham chiếu", dataIndex: "tham_chieu", width: 160 },
    { title: "Ghi chú", dataIndex: "ghi_chu" },
  ], []);

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search placeholder="Tìm theo tham chiếu/ghi chú…" allowClear onSearch={setQ as any} style={{ width: 280 }} />
        <Select
          placeholder="Loại CT"
          allowClear
          value={loai_ct}
          style={{ width: 160 }}
          onChange={(v) => { setLoaiCt(v as any); setPage(1); }}
          options={[
            { label: "OPENING", value: "OPENING" },
            { label: "RECEIPT", value: "RECEIPT" },
            { label: "ISSUE", value: "ISSUE" },
            { label: "ADJUST", value: "ADJUST" }
          ]}
        />
        <DatePicker.RangePicker
          onChange={(v) => { setFrom(v?.[0]?.format("YYYY-MM-DD")); setTo(v?.[1]?.format("YYYY-MM-DD")); setPage(1); }}
          allowEmpty={[true,true]}
        />
        <Button onClick={() => { setPage(1); fetchData(); }}>Làm mới</Button>
      </Space>

      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={rows}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{ current: page, pageSize: perPage, total, onChange: (p,s)=>{setPage(p); setPerPage(s);} }}
      />
    </>
  );
}
