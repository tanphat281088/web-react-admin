/* Khách hàng vãng lai – danh sách và chuyển đổi */
import { useEffect, useMemo, useState } from "react";
import { Card, Table, Button, Space, Tag, App } from "antd";
import dayjs from "dayjs";
import axios from "../../configs/axios";
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";
import ConvertVangLaiModal from "./ConvertVangLaiModal";

type RowVangLai = {
  ten: string;
  sdt: string;
  dia_chi_gan_nhat?: string;
  so_don: number;
  last_order_at?: string;
};

const KHVangLai = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RowVangLai[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RowVangLai | null>(null);

  // Fallback nếu chưa thêm constants vào API_ROUTE_CONFIG
  const KH_VL = (API_ROUTE_CONFIG as any)?.KHACH_HANG_VANG_LAI ?? "/khach-hang-vang-lai";

  const fetchData = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(KH_VL);
      if ((resp as any)?.success) {
        setRows(resp.data?.collection ?? []);
      } else if ((resp as any)?.data?.success) {
        setRows((resp as any).data.data?.collection ?? []);
      } else {
        // một số axios config bọc khác
        setRows(resp?.data?.collection ?? []);
      }
    } catch (e: any) {
      console.error(e);
      message.error("Không tải được danh sách KH vãng lai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Tên",
        dataIndex: "ten",
        key: "ten",
        ellipsis: true,
      },
      {
        title: "SĐT",
        dataIndex: "sdt",
        key: "sdt",
        render: (v: string) => v || <Tag>không có</Tag>,
      },
      {
        title: "Địa chỉ gần nhất",
        dataIndex: "dia_chi_gan_nhat",
        key: "dia_chi_gan_nhat",
        ellipsis: true,
      },
      {
        title: "Số đơn",
        dataIndex: "so_don",
        key: "so_don",
        width: 100,
        align: "right" as const,
      },
      {
        title: "Lần mua gần nhất",
        dataIndex: "last_order_at",
        key: "last_order_at",
        width: 180,
        render: (v: string) =>
          v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <Tag>—</Tag>,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 220,
        render: (_: any, record: RowVangLai) => (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setSelected(record);
                setOpen(true);
              }}
            >
              Chuyển thành KH hệ thống
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Card title="Khách hàng vãng lai" bordered={false}>
      <Table<RowVangLai>
        rowKey={(r) => `${r.sdt || "NO_PHONE"}_${r.ten}`}
        loading={loading}
        dataSource={rows}
        columns={columns as any}
        pagination={{ pageSize: 10, showTotal: (t) => `${t} bản ghi` }}
      />

      {/* Modal chuyển đổi */}
      <ConvertVangLaiModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        record={selected}
        onConverted={() => fetchData()}
      />
    </Card>
  );
};

export default KHVangLai;
