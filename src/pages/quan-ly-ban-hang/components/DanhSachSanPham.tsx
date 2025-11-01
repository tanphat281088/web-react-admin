/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  Typography,
  type FormInstance,
  Select,
} from "antd";
import { useCallback } from "react";
import SelectFormApi from "../../../components/select/SelectFormApi";
import { API_ROUTE_CONFIG } from "../../../configs/api-route-config";
import { formatter, parser } from "../../../utils/utils";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { getDataSelect } from "../../../services/getData.api";

const LOAI_GIA_OPTIONS = [
  { label: "Đặt ngay", value: 1 },
  { label: "Đặt trước 3 ngày", value: 2 },
] as const;

const DanhSachSanPham = ({
  form,
  isDetail,
}: {
  form: FormInstance;
  isDetail: boolean;
}) => {
  // Watch toàn bộ danh sách sản phẩm để lấy giá trị ở từng dòng
  const danhSachSanPham = Form.useWatch("danh_sach_san_pham", form) || [];

  const handleChangeSanPham = useCallback(
    (name: number) => {
      form.setFieldValue(
        ["danh_sach_san_pham", name, "don_vi_tinh_id"],
        undefined
      );

      // Reset loại giá + SL + giá + tổng tiền
      form.setFieldValue(["danh_sach_san_pham", name, "loai_gia"], undefined);
      form.setFieldValue(["danh_sach_san_pham", name, "so_luong"], undefined);
      form.setFieldValue(["danh_sach_san_pham", name, "don_gia"], undefined);
      form.setFieldValue(["danh_sach_san_pham", name, "tong_tien"], undefined);
    },
    [form]
  );

  const handleGetGiaBanSanPham = useCallback(
    async (
      name: number,
      sanPhamId?: number,
      donViTinhId?: number,
      loaiGia?: number
    ) => {
      form.setFieldValue(["danh_sach_san_pham", name, "don_gia"], undefined);

      if (!sanPhamId || !donViTinhId || !loaiGia) return;

      const response = await getDataSelect(
        API_ROUTE_CONFIG.QUAN_LY_BAN_HANG + `/get-gia-ban-san-pham`,
        {
          san_pham_id: sanPhamId,
          don_vi_tinh_id: donViTinhId,
          loai_gia: loaiGia,
        }
      );

      if (response !== undefined && response !== null) {
        form.setFieldValue(["danh_sach_san_pham", name, "don_gia"], response);
      }
    },
    [form]
  );

  return (
    <>
      <Card>
        <Typography.Title level={4}>Danh sách sản phẩm</Typography.Title>
        <Divider />
        <div
          className="product-list-container"
          style={{
            overflowX: "auto",
            overflowY: "visible",
          }}
        >
          <Form.List name="danh_sach_san_pham">
            {(fields, { add, remove }) => (
              <>
                {/* Header: tổng span = 24 */}
                <Row gutter={[8, 8]} className="product-row" style={{ marginBottom: 16 }}>
                  <Col span={7}>
                    <Typography.Text strong>Tên SP/NVL</Typography.Text>
                  </Col>
                  <Col span={3}>
                    <Typography.Text strong>Đơn vị tính</Typography.Text>
                  </Col>
                  <Col span={3}>
                    <Typography.Text strong>Loại giá</Typography.Text>
                  </Col>
                  <Col span={4}>
                    <Typography.Text strong>Giá bán</Typography.Text>
                  </Col>
                  <Col span={2}>
                    <Typography.Text strong>Số lượng</Typography.Text>
                  </Col>
                  <Col span={3}>
                    <Typography.Text strong>Tổng tiền</Typography.Text>
                  </Col>
                  <Col span={2}>
                    <Typography.Text strong>Thao tác</Typography.Text>
                  </Col>
                </Row>

                {fields.map(({ key, name, ...restField }) => {
                  const sanPhamId = danhSachSanPham?.[name]?.san_pham_id;
                  const donViTinhId = danhSachSanPham?.[name]?.don_vi_tinh_id;

                  return (
                    <Row
                      key={key}
                      gutter={[8, 8]}
                      className="product-row"
                      style={{ marginBottom: 8 }}
                    >
{/* TÊN SP/NVL (7) */}
<Col span={7}>
  <SelectFormApi
    name={[name, "san_pham_id"]}
 
    rules={[{ required: true, message: "Vui lòng chọn sản phẩm!" }]}
    path={`${API_ROUTE_CONFIG.SAN_PHAM}/options`}
    placeholder="Chọn sản phẩm"
    showSearch
    onChange={() => handleChangeSanPham(name)}
    disabled={isDetail}
  />
</Col>


                    {/* ĐƠN VỊ TÍNH (3) */}
<Col span={3}>
  <SelectFormApi
    name={[name, "don_vi_tinh_id"]}
   
    rules={[{ required: true, message: "Vui lòng chọn đơn vị tính!" }]}
    path={
      sanPhamId
        ? `${API_ROUTE_CONFIG.DON_VI_TINH}/options-by-san-pham/${sanPhamId}`
        : ""
    }
    reload={sanPhamId}
    placeholder="Chọn đơn vị tính"
    showSearch
    disabled={isDetail || !sanPhamId}
    onChange={(value) => {
      const loaiGia = danhSachSanPham?.[name]?.loai_gia;
      if (loaiGia) {
        handleGetGiaBanSanPham(
          name,
          danhSachSanPham?.[name]?.san_pham_id,
          value,
          loaiGia
        );
      } else {
        form.setFieldValue(
          ["danh_sach_san_pham", name, "don_gia"],
          undefined
        );
      }
    }}
  />
</Col>


                      {/* LOẠI GIÁ (3) */}
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "loai_gia"]}
                          rules={[
                            { required: true, message: "Vui lòng chọn loại giá!" },
                          ]}
                        >
                          <Select
                            options={LOAI_GIA_OPTIONS as any}
                            placeholder="Chọn loại giá"
                            disabled={isDetail || !sanPhamId || !donViTinhId}
                            onChange={(value) => {
                              handleGetGiaBanSanPham(
                                name,
                                danhSachSanPham?.[name]?.san_pham_id,
                                danhSachSanPham?.[name]?.don_vi_tinh_id,
                                value
                              );
                            }}
                          />
                        </Form.Item>
                      </Col>

                      {/* GIÁ BÁN (don_gia) (4) */}
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "don_gia"]}
                          rules={[
                            { required: true, message: "Vui lòng nhập giá bán!" },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            placeholder="Giá bán"
                            style={{ width: "100%" }}
                            formatter={formatter}
                            parser={parser}
                            addonAfter="đ"
                            disabled // giá auto-fill từ BE
                          />
                        </Form.Item>
                      </Col>

                      {/* SỐ LƯỢNG (2) */}
                      <Col span={2}>
                        <Form.Item
                          {...restField}
                          name={[name, "so_luong"]}
                          rules={[
                            { required: true, message: "Vui lòng nhập số lượng!" },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Số lượng"
                            style={{ width: "100%" }}
                            disabled={isDetail}
                          />
                        </Form.Item>
                      </Col>

                      {/* TỔNG TIỀN (3) – nghe theo don_gia */}
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "tong_tien"]}
                          dependencies={[
                            [name, "so_luong"],
                            [name, "don_gia"], // 👉 đổi sang don_gia
                            [name, "chiet_khau"],
                          ]}
                        >
                          <InputNumber
                            placeholder="Tổng tiền"
                            style={{ width: "100%" }}
                            formatter={formatter}
                            parser={parser}
                            disabled
                            addonAfter="đ"
                          />
                        </Form.Item>
                      </Col>

                      {/* XOÁ (2) */}
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          disabled={isDetail}
                        />
                      </Col>
                    </Row>
                  );
                })}

                {!isDetail && (
                  <Row>
                    <Col span={24}>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Thêm sản phẩm
                      </Button>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </Form.List>
        </div>
      </Card>
    </>
  );
};

export default DanhSachSanPham;
