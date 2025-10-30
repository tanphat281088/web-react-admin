/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { User } from "../../types/user.type";
import useColumnSearch from "../../hooks/useColumnSearch";
import { getListData } from "../../services/getData.api";
import {
  createFilterQueryFromArray,
  formatVietnameseCurrency,
} from "../../utils/utils";
import { Col, Row, Space, Tag, Flex, Button } from "antd";
import SuaQuanLyBanHang from "./SuaQuanLyBanHang";
import Delete from "../../components/Delete";
import { useDispatch, useSelector } from "react-redux";
import CustomTable from "../../components/CustomTable";
import type { RootState } from "../../redux/store";
import { usePagination } from "../../hooks/usePagination";
import type { Actions } from "../../types/main.type";
import ExportTableToExcel from "../../components/ExportTableToExcel";
import {
  OPTIONS_TRANG_THAI_THANH_TOAN,
  OPTIONS_TRANG_THAI_XUAT_KHO,
} from "../../utils/constant";
import dayjs from "dayjs";
import ChiTietQuanLyBanHang from "./ChiTietQuanLyBanHang";
import InHoaDon from "../../components/InHoaDon";

/** ✅ Dùng chung options với Form để đảm bảo đồng nhất */
import { donHangTrangThaiSelect } from "../../configs/select-config";

/** ✅ Card view cho mobile */
import CardList from "../../components/responsive/CardList";

/** Helper: map trạng thái → màu Tag */
const DON_HANG_STATUS_COLOR: Record<number, string> = {
  0: "default", // Chưa giao
  1: "blue", // Đang giao
  2: "green", // Đã giao
  3: "red", // Đã hủy
};

const DanhSachQuanLyBanHang = ({
  path,
  permission,
  title,
}: {
  path: string;
  permission: Actions;
  title: string;
}) => {
  const dispatch = useDispatch();
  const isReload = useSelector((state: RootState) => state.main.isReload);

  const [danhSach, setDanhSach] = useState<
    { data: User[]; total: number } | undefined
  >({ data: [], total: 0 });

  const { filter, handlePageChange, handleLimitChange } = usePagination({
    page: 1,
    limit: 20,
  });

  const { inputSearch, query, dateSearch, selectSearchWithOutApi } =
    useColumnSearch();

  const [isLoading, setIsLoading] = useState(false);

  const getDanhSach = async () => {
    setIsLoading(true);
    const params = { ...filter, ...createFilterQueryFromArray(query) };
    const danhSach = await getListData(path, params);
    if (danhSach) {
      setIsLoading(false);
    }
    setDanhSach(danhSach);
  };

  const defaultColumns: any = [
    {
      title: "STT",
      dataIndex: "index",
      width: 80,
      render: (_text: any, _record: any, index: any) => {
        return filter.limit && (filter.page - 1) * filter.limit + index + 1;
      },
    },
    {
      title: "Thao tác",
      dataIndex: "id",
      align: "center",
      render: (id: number, record: any) => {
        return (
          <Space size={0}>
            {permission.show && (
              <ChiTietQuanLyBanHang path={path} id={id} title={title} />
            )}
            {permission.show && (
              <InHoaDon donHangId={id} disabled={!permission.show} />
            )}
            {permission.edit && (
              <SuaQuanLyBanHang path={path} id={id} title={title} />
            )}
            {permission.delete && (
              <Delete path={path} id={id} onShow={getDanhSach} />
            )}
          </Space>
        );
      },
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "ma_don_hang",
      ...inputSearch({
        dataIndex: "ma_don_hang",
        operator: "contain",
        nameColumn: "Mã đơn hàng",
      }),
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngay_tao_don_hang",
      ...dateSearch({
        dataIndex: "ngay_tao_don_hang",
        nameColumn: "Ngày tạo",
      }),
    },

    /** ✅ CỘT “Trạng thái đơn hàng” */
    {
      title: "Trạng thái đơn hàng",
      dataIndex: "trang_thai_don_hang",
      render: (val: number) => {
        const color = DON_HANG_STATUS_COLOR[val as 0 | 1 | 2 | 3] ?? "default";
        const label =
          donHangTrangThaiSelect.find((o) => o.value === val)?.label ?? "Không rõ";
        return <Tag color={color}>{label}</Tag>;
      },
      ...selectSearchWithOutApi({
        dataIndex: "trang_thai_don_hang",
        operator: "equal",
        nameColumn: "Trạng thái đơn hàng",
        options: donHangTrangThaiSelect,
      }),
    },

    {
      title: "Tên khách hàng",
      dataIndex: "ten_khach_hang",
      ...inputSearch({
        dataIndex: "ten_khach_hang",
        operator: "contain",
        nameColumn: "Tên khách hàng",
      }),
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai",
      ...inputSearch({
        dataIndex: "so_dien_thoai",
        operator: "contain",
        nameColumn: "Số điện thoại",
      }),
    },
    {
      title: "Tổng tiền",
      dataIndex: "tong_tien_can_thanh_toan",
      ...inputSearch({
        dataIndex: "tong_tien_can_thanh_toan",
        operator: "contain",
        nameColumn: "Tổng tiền cần thanh toán",
      }),
      render: (tong_tien_can_thanh_toan: number) => {
        return formatVietnameseCurrency(tong_tien_can_thanh_toan);
      },
    },
    {
      title: "Đã thanh toán",
      dataIndex: "so_tien_da_thanh_toan",
      ...inputSearch({
        dataIndex: "so_tien_da_thanh_toan",
        operator: "contain",
        nameColumn: "Tổng tiền đã thanh toán",
      }),
      render: (so_tien_da_thanh_toan: number) => {
        return formatVietnameseCurrency(so_tien_da_thanh_toan);
      },
    },
{
  title: "Trạng thái thanh toán",
  dataIndex: "trang_thai_thanh_toan",
  key: "trang_thai_thanh_toan",
  render: (v: any, row: any) => {
    const st = Number(row?.trang_thai_thanh_toan ?? v ?? 0);
    if (st === 2) return <Tag color="green">Đã hoàn thành</Tag>;
    if (st === 1) return <Tag color="gold">Thanh toán một phần</Tag>;
    return <Tag color="red">Chưa hoàn thành</Tag>;
  },
  ...selectSearchWithOutApi({
    dataIndex: "trang_thai_thanh_toan",
    operator: "equal",
    nameColumn: "Trạng thái thanh toán",
    options: OPTIONS_TRANG_THAI_THANH_TOAN,
  }),
}, // ← cần dấu phẩy này để ngăn cách phần tử trong mảng columns



    {
      title: "Trạng thái xuất kho",
      dataIndex: "trang_thai_xuat_kho",
      render: (trang_thai_xuat_kho: number) => {
        return (
          <Tag
            color={
              trang_thai_xuat_kho === 1
                ? "blue"
                : trang_thai_xuat_kho === 2
                ? "green"
                : "red"
            }
          >
            {trang_thai_xuat_kho === 1
              ? "Đã có xuất kho"
              : trang_thai_xuat_kho === 2
              ? "Đã hoàn thành"
              : "Chưa xuất kho"}
          </Tag>
        );
      },
      ...selectSearchWithOutApi({
        dataIndex: "trang_thai_xuat_kho",
        operator: "equal",
        nameColumn: "Trạng thái xuất kho",
        options: OPTIONS_TRANG_THAI_XUAT_KHO,
      }),
    },
    {
      title: "Người tạo",
      dataIndex: "ten_nguoi_tao",
      ...inputSearch({
        dataIndex: "ten_nguoi_tao",
        operator: "contain",
        nameColumn: "Người tạo",
      }),
    },
    {
      title: "Người cập nhật",
      dataIndex: "ten_nguoi_cap_nhat",
      ...inputSearch({
        dataIndex: "ten_nguoi_cap_nhat",
        operator: "contain",
        nameColumn: "Người cập nhật",
      }),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updated_at",
      ...dateSearch({
        dataIndex: "updated_at",
        nameColumn: "Ngày cập nhật",
      }),
    },
  ];

  useEffect(() => {
    getDanhSach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReload, filter, query]);

  /** ✅ Bảng cũ giữ nguyên để hiển thị cho tablet/desktop */
  const table = (
    <CustomTable
      rowKey="id"
      dataTable={danhSach?.data}
      defaultColumns={defaultColumns}
      filter={filter}
      scroll={{ x: 2200 }}
      handlePageChange={handlePageChange}
      handleLimitChange={handleLimitChange}
      total={danhSach?.total}
      loading={isLoading}
    />
  );

  /** ✅ Card view mapping (4–6 field quan trọng) cho mobile */
  const cardData = (danhSach?.data as any[]) || [];
  const cardActions = (r: any) => (
    <>
      {permission.show && (
        <ChiTietQuanLyBanHang path={path} id={r.id} title={title} />
      )}
      {permission.show && <InHoaDon donHangId={r.id} disabled={!permission.show} />}
      {permission.edit && <SuaQuanLyBanHang path={path} id={r.id} title={title} />}
      {permission.delete && <Delete path={path} id={r.id} onShow={getDanhSach} />}
    </>
  );

  return (
    <Row>
      <Col span={24}>
        <Flex vertical gap={10}>
          <Row justify="end" align="middle" style={{ marginBottom: 5, gap: 10 }}>
            {permission.export && (
              <ExportTableToExcel columns={defaultColumns} path={path} params={{}} />
            )}
          </Row>

          {/* ✅ CardList: Mobile = Card view; Tablet/Desktop = bảng cũ */}
          <CardList
            data={cardData}
            loading={isLoading}
            keyField="id"
            title={(r) => r.ma_don_hang || "Đơn hàng"}
            subtitle={(r) =>
              `${r.ten_khach_hang || "KH vãng lai"} • ${
                r.ngay_tao_don_hang
                  ? dayjs(r.ngay_tao_don_hang).format("DD/MM/YYYY HH:mm")
                  : ""
              }`
            }
            extra={(r) => (
              <span>{formatVietnameseCurrency(r.tong_tien_can_thanh_toan || 0)}</span>
            )}
            fields={[
              { label: "Khách hàng", path: "ten_khach_hang" },
              { label: "SĐT", path: "so_dien_thoai" },
              {
                label: "Trạng thái",
                tag: (r) => {
                  const st = donHangTrangThaiSelect.find(
                    (o) => o.value === r.trang_thai_don_hang
                  );
                  const color =
                    DON_HANG_STATUS_COLOR[(r.trang_thai_don_hang ?? 0) as 0 | 1 | 2 | 3] ||
                    "default";
                  return st ? { text: st.label, color } : null;
                },
              },
              {
                label: "Đã thu",
                render: (r) =>
                  formatVietnameseCurrency(r.so_tien_da_thanh_toan || 0),
              },
            ]}
            actions={cardActions}
          >
            {table}
          </CardList>
        </Flex>
      </Col>
    </Row>
  );
};

export default DanhSachQuanLyBanHang;
