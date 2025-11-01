/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  type FormInstance,
  Select,
  DatePicker,
  Typography,
  Button,
  Tooltip,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { formatter, parser } from "../../utils/utils";
import SelectFormApi from "../../components/select/SelectFormApi";
import { donHangTrangThaiSelect } from "../../configs/select-config";

// ❌ Bỏ generateMaPhieu vì mã được BE tự sinh
// import { generateMaPhieu } from "../../helpers/funcHelper";
import dayjs from "dayjs";
import {
  OPTIONS_LOAI_KHACH_HANG,
  OPTIONS_LOAI_THANH_TOAN,
} from "../../utils/constant";
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";

/* ✅ FIX import: dùng default import đúng chuẩn */
import DanhSachSanPham from "./components/DanhSachSanPham";

import { useCallback, useEffect, useMemo, useState } from "react";
import { phoneNumberVNPattern } from "../../utils/patterns";

/** ====== BỔ SUNG: Định dạng ngày–giờ chuẩn ====== */
const CLIENT_DATETIME_FORMAT = "DD/MM/YYYY HH:mm";
const SERVER_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
/** =============================================== */

const FormQuanLyBanHang = ({
  form,
  isDetail = false,
}: {
  form: FormInstance;
  isDetail?: boolean;
}) => {
  const loaiKhachHang = Form.useWatch("loai_khach_hang", form);
  const loaiThanhToan = Form.useWatch("loai_thanh_toan", form);

  const [tongTienHang, setTongTienHang] = useState<number>(0);

  // Theo dõi thay đổi trong danh sách sản phẩm
  const danhSachSanPham = Form.useWatch("danh_sach_san_pham", form) || [];

  // ĐƠN GIÁ ĐÃ GỒM VAT → KHÔNG dùng VAT
  const chiPhi = Form.useWatch("chi_phi", form) || 0;
  const giamGia = Form.useWatch("giam_gia", form) || 0;

  // Tổng tiền thanh toán = Tổng hàng - Giảm giá + Chi phí (kẹp ≥ 0)
  const tongTienThanhToan = useMemo(() => {
    const tong = (tongTienHang || 0) - (giamGia || 0) + (chiPhi || 0);
    return Math.max(0, tong);
  }, [tongTienHang, chiPhi, giamGia]);

  // Theo dõi số tiền đã thanh toán để tính "còn lại"
  const soTienDaThanhToan = Form.useWatch("so_tien_da_thanh_toan", form) || 0;

  // Đồng bộ giá trị "đã thanh toán" theo loại thanh toán
  useEffect(() => {
    if (loaiThanhToan === OPTIONS_LOAI_THANH_TOAN[0].value) {
      // 0 = Chưa thanh toán
      form.setFieldsValue({ so_tien_da_thanh_toan: 0 });
    } else if (loaiThanhToan === OPTIONS_LOAI_THANH_TOAN[2].value) {
      // 2 = Thanh toán toàn bộ
      form.setFieldsValue({ so_tien_da_thanh_toan: tongTienThanhToan || 0 });
    }
  }, [loaiThanhToan, tongTienThanhToan, form]);

  // Tính số tiền còn lại (kẹp ≥ 0) — phụ thuộc trực tiếp vào loại thanh toán
  const tongConLai = useMemo(() => {
    if (loaiThanhToan === OPTIONS_LOAI_THANH_TOAN[0].value) {
      // 0 = Chưa thanh toán
      return Math.max(0, tongTienThanhToan || 0);
    }
    if (loaiThanhToan === OPTIONS_LOAI_THANH_TOAN[2].value) {
      // 2 = Thanh toán toàn bộ
      return 0;
    }
    // 1 = Thanh toán một phần
    const remain = (tongTienThanhToan || 0) - (soTienDaThanhToan || 0);
    return Math.max(0, remain);
  }, [loaiThanhToan, tongTienThanhToan, soTienDaThanhToan]);

  // Tính toán tổng tiền cho từng sản phẩm
  const calculatedProducts = useMemo(() => {
    if (!danhSachSanPham || !Array.isArray(danhSachSanPham)) {
      return [];
    }
    return danhSachSanPham.map((item: any, index: number) => {
      if (item && item.so_luong && item.don_gia) {
        const soLuong = Number(item.so_luong) || 0;
        const giaNhap = Number(item.don_gia) || 0;
        const chietKhau = Number(item.chiet_khau) || 0;
        const tongTien = soLuong * giaNhap * (1 - chietKhau / 100);
        return { ...item, tongTien, index };
      }
      return { ...item, tongTien: 0, index };
    });
  }, [danhSachSanPham]);

  // Tính tổng tiền hàng từ calculated products
  const calculatedTongTienHang = useMemo(() => {
    return calculatedProducts.reduce((tong, item) => {
      return tong + (item.tongTien || 0);
    }, 0);
  }, [calculatedProducts]);

  // Update form values khi có thay đổi trong calculations
  const updateFormValues = useCallback(() => {
    calculatedProducts.forEach((item) => {
      const currentTongTien = form.getFieldValue([
        "danh_sach_san_pham",
        item.index,
        "tong_tien",
      ]);
      if (item.tongTien !== currentTongTien) {
        form.setFieldValue(
          ["danh_sach_san_pham", item.index, "tong_tien"],
          item.tongTien
        );
      }
    });
  }, [calculatedProducts, form]);

  // Effect để update form values với debounce nhẹ
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFormValues();
      setTongTienHang(calculatedTongTienHang);
    }, 50);
    return () => clearTimeout(timer);
  }, [updateFormValues, calculatedTongTienHang]);

  // ====== Re-sync phiếu thu theo mã đơn ngay trong form ======
  const webBaseUrl = useMemo(() => {
    // nếu có ENV VITE_WEB_BASE_URL thì dùng; mặc định 8000 là Laravel
    return (import.meta as any).env?.VITE_WEB_BASE_URL ?? "https://api.phgfloral.com";
  }, []);

  const handleResync = async () => {
    const code: string = form.getFieldValue("ma_don_hang");
    if (!code) {
      message.warning("Chưa có mã đơn hàng để đồng bộ.");
      return;
    }
    const url = `${webBaseUrl}/admin/thu-chi/re-sync-by-code/${encodeURIComponent(
      code
    )}`;
    try {
      const resp = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      if (!resp.ok) {
        window.open(url, "_blank");
        message.info("Đã mở tab đồng bộ, vui lòng kiểm tra.");
        return;
      }
      const data = (await resp.json()) as { success?: boolean; message?: string };
      if (data?.success) {
        message.success(data.message || "Đồng bộ phiếu thu thành công.");
      } else {
        message.error(data?.message || "Đồng bộ phiếu thu thất bại.");
      }
    } catch (_e) {
      // Nếu fetch lỗi (CORS, v.v.) → fallback mở tab
      window.open(url, "_blank");
      message.info("Đã mở tab đồng bộ, vui lòng kiểm tra.");
    }
  };

  return (
    <Row gutter={[10, 10]}>
      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="ma_don_hang"
          label="Mã đơn hàng"
          // ❗Không required và không initialValue (BE tự sinh sau khi lưu)
          rules={[]}
        >
          <Input
            placeholder="Tự sinh sau khi lưu"
            // Cho phép xem (read-only) — nếu đang ở màn tạo mới sẽ để trống
            disabled={isDetail}
          />
        </Form.Item>
      </Col>

      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="ngay_tao_don_hang"
          label="Ngày tạo đơn hàng"
          rules={[{ required: true, message: "Ngày tạo đơn hàng không được bỏ trống!" }]}
          initialValue={dayjs()}
        >
          <DatePicker
            placeholder="Nhập ngày tạo đơn hàng"
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabled={isDetail}
            /* ✅ Neo popup trong modal để dễ bấm */
            getPopupContainer={(node) => (node && node.closest(".ant-modal")) || document.body}
          />
        </Form.Item>
      </Col>

<Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
  <Form.Item
    name="loai_khach_hang"
    label="Loại khách hàng"
    rules={[{ required: true, message: "Loại khách hàng không được bỏ trống!" }]}
    initialValue={0}
  >
    <Select
      options={OPTIONS_LOAI_KHACH_HANG}
      placeholder="Chọn loại khách hàng"
      disabled={isDetail}
      /* ⬇️ render dropdown TRONG modal để không bị lớp khác ăn click */
      getPopupContainer={(trigger) =>
        (trigger && trigger.closest(".ant-modal")) || document.body
      }
      dropdownMatchSelectWidth={false}
      popupClassName="phg-dd"   /* để CSS nâng z-index */
    />
  </Form.Item>
</Col>


      {/* ===== TRẠNG THÁI ĐƠN HÀNG (0=Chưa giao,1=Đang giao,2=Đã giao,3=Đã hủy) ===== */}
      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="trang_thai_don_hang"
          label="Trạng thái đơn hàng"
          rules={[]}
          initialValue={0}
        >
          <Select
            options={donHangTrangThaiSelect}
            placeholder="Chọn trạng thái"
            disabled={isDetail}
            /* ✅ Neo popup trong modal để dễ bấm */
            getPopupContainer={(node) => (node && node.closest(".ant-modal")) || document.body}
            dropdownMatchSelectWidth={false}
            popupClassName="phg-dd"   // ⬅️ THÊM DÒNG NÀY
          />
        </Form.Item>
      </Col>

      {loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[0].value && (
        <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
          <SelectFormApi
  name="khach_hang_id"
  label="Khách hàng"
  path={API_ROUTE_CONFIG.KHACH_HANG + "/options"}
  placeholder="Chọn khách hàng"
  rules={[
    {
      required: loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[0].value,
      message: "Khách hàng không được bỏ trống!",
    },
  ]}
  disabled={isDetail}
  /* ⬇️ render dropdown TRONG modal để không bị lớp khác ăn click */
  getPopupContainer={(trigger) =>
    (trigger && trigger.closest(".ant-modal")) || document.body
  }
  dropdownMatchSelectWidth={false}
  popupClassName="phg-dd"
/>

        </Col>
      )}

      {loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[1].value && (
        <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
          <Form.Item
            name="ten_khach_hang"
            label="Tên khách hàng"
            rules={[
              {
                required: loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[1].value,
                message: "Tên khách hàng không được bỏ trống!",
              },
            ]}
          >
            <Input placeholder="Nhập tên khách hàng" disabled={isDetail} />
          </Form.Item>
        </Col>
      )}

      {loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[1].value && (
        <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
          <Form.Item
            name="so_dien_thoai"
            label="Số điện thoại"
            rules={[
              {
                required: loaiKhachHang === OPTIONS_LOAI_KHACH_HANG[1].value,
                message: "Số điện thoại không được bỏ trống!",
              },
              { pattern: phoneNumberVNPattern, message: "Số điện thoại không hợp lệ!" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" disabled={isDetail} />
          </Form.Item>
        </Col>
      )}

      <Col span={16} xs={24} sm={24} md={24} lg={16} xl={16}>
        <Form.Item
          name="dia_chi_giao_hang"
          label="Địa chỉ giao hàng"
          rules={[{ required: true, message: "Địa chỉ giao hàng không được bỏ trống!" }]}
        >
          <Input placeholder="Nhập địa chỉ giao hàng" disabled={isDetail} />
        </Form.Item>
      </Col>

      {/* ===== THÔNG TIN NGƯỜI NHẬN ===== */}
      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="nguoi_nhan_ten"
          label="Tên người nhận"
          rules={[{ max: 191, message: "Tối đa 191 ký tự" }]}
        >
          <Input placeholder="Nhập tên người nhận" disabled={isDetail} />
        </Form.Item>
      </Col>

      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="nguoi_nhan_sdt"
          label="SĐT người nhận"
          rules={[
            { max: 20, message: "Tối đa 20 ký tự" },
            { pattern: phoneNumberVNPattern, message: "Số điện thoại không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại người nhận (0… hoặc +84…)" disabled={isDetail} />
        </Form.Item>
      </Col>

      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="nguoi_nhan_thoi_gian"
          label="Ngày giờ nhận"
          rules={[]}
          /** ===== BỔ SUNG: luôn chuyển giá trị vào thành dayjs (giữ cả giờ) ===== */
          getValueProps={(value) => {
            if (!value) return { value };
            const d =
              typeof value === "string" || typeof value === "number"
                ? dayjs(value)
                : value;
            return { value: d?.isValid?.() ? d : undefined };
          }}
          getValueFromEvent={(value) => value} // giữ nguyên đối tượng dayjs, không tự stringify
        >
          <DatePicker
            placeholder="Chọn ngày giờ nhận"
            style={{ width: "100%" }}
            showTime
            format={CLIENT_DATETIME_FORMAT}
            disabled={isDetail}
            /* ✅ Neo popup trong modal để dễ bấm */
            getPopupContainer={(node) => (node && node.closest(".ant-modal")) || document.body}
          />
        </Form.Item>
      </Col>
      {/* ===== END – THÔNG TIN NGƯỜI NHẬN ===== */}

      <Col span={24} style={{ marginBottom: 20 }}>
        <DanhSachSanPham form={form} isDetail={isDetail} />
      </Col>

      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="giam_gia"
          label="Giảm giá"
          rules={[{ required: true, message: "Giảm giá không được bỏ trống!" }]}
          initialValue={0}
        >
          <InputNumber
            placeholder="Nhập giảm giá"
            disabled={isDetail}
            style={{ width: "100%" }}
            addonAfter="đ"
            formatter={formatter}
            parser={parser}
            min={0}
            inputMode="numeric"
          />
        </Form.Item>
      </Col>

      <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
        <Form.Item
          name="chi_phi"
          label="Chi phí vận chuyển"
          rules={[{ required: true, message: "Chi phí không được bỏ trống!" }]}
          initialValue={0}
        >
          <InputNumber
            placeholder="Nhập chi phí vận chuyển"
            disabled={isDetail}
            style={{ width: "100%" }}
            addonAfter="đ"
            formatter={formatter}
            parser={parser}
            min={0}
            inputMode="numeric"
          />
        </Form.Item>
      </Col>

      {/* Tổng tiền thanh toán (giữ nguyên vị trí) */}
      <Col
        span={5}
        xs={24}
        sm={12}
        md={5}
        lg={5}
        xl={5}
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
      >
        <Typography.Title level={5}>Tổng tiền thanh toán</Typography.Title>
        <Typography.Text style={{ fontSize: 20 }}>
          {formatter(tongTienThanhToan) || 0} đ
        </Typography.Text>
      </Col>

      {/* ======= ĐỔI VỊ TRÍ: đưa "Loại thanh toán" lên trước "Tổng tiền còn lại" ======= */}
<Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
  <Form.Item
    name="loai_thanh_toan"
    label="Loại thanh toán"
    rules={[{ required: true, message: "Loại thanh toán không được bỏ trống!" }]}
    initialValue={0}
  >
    <Select
      options={OPTIONS_LOAI_THANH_TOAN}
      placeholder="Chọn loại thanh toán"
      disabled={isDetail}
      /* ⬇️ render dropdown TRONG modal, tránh lớp khác ăn click */
      getPopupContainer={(trigger) =>
        (trigger && trigger.closest(".ant-modal")) || document.body
      }
      dropdownMatchSelectWidth={false}
      popupClassName="phg-dd"   /* để set z-index “chắc” */
    />
  </Form.Item>
</Col>

      {/* Tổng tiền thanh toán còn lại (giữ nguyên style, chỉ đổi vị trí) */}
      <Col
        span={5}
        xs={24}
        sm={12}
        md={5}
        lg={5}
        xl={5}
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
      >
        <Typography.Title level={5}>Tổng tiền thanh toán còn lại</Typography.Title>
        <Typography.Text style={{ fontSize: 20 }}>
          {formatter(tongConLai) || 0} đ
        </Typography.Text>
      </Col>

      {/* Số tiền đã thanh toán — chỉ hiện khi Thanh toán một phần (value = 1) */}
      {loaiThanhToan === OPTIONS_LOAI_THANH_TOAN[1].value && (
        <Col span={8} xs={24} sm={24} md={24} lg={8} xl={8}>
          <Form.Item
            name="so_tien_da_thanh_toan"
            label="Số tiền đã thanh toán"
            rules={[
              { required: true, message: "Số tiền đã thanh toán không được bỏ trống!" },
              ({ getFieldValue }) => ({
                validator(_, val) {
                  const max = Number(tongTienThanhToan || 0);
                  const num = Number(val || 0);
                  return num >= 0 && num <= max
                    ? Promise.resolve()
                    : Promise.reject(new Error(`Tối đa ${formatter(max)} đ`));
                },
              }),
            ]}
          >
            <InputNumber
              placeholder="Nhập số tiền đã thanh toán"
              disabled={isDetail}
              style={{ width: "100%" }}
              addonAfter="đ"
              formatter={formatter}
              parser={parser}
              min={0}
              inputMode="numeric"
            />
          </Form.Item>
        </Col>
      )}

      {/* Hàng thông tin thanh toán thực tế + nút đồng bộ */}
      <Col span={24}>
        <Row align="middle" gutter={[10, 10]}>
          <Col flex="auto">
            <Typography.Text type="secondary">
              <b>Tổng đã thu (thực tế)</b>: {formatter(soTienDaThanhToan)} đ
            </Typography.Text>
          </Col>
          <Col>
            <Tooltip title="Đồng bộ lại phiếu thu theo mã đơn (server sẽ tự cân)">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResync}
                disabled={!form.getFieldValue("ma_don_hang")}
              >
                Đồng bộ phiếu thu
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </Col>

      <Col span={24}>
        <Form.Item name="ghi_chu" label="Ghi chú">
          <Input.TextArea placeholder="Ghi chú" disabled={isDetail} />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default FormQuanLyBanHang;
