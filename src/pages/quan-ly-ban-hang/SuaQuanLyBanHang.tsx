import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import FormQuanLyBanHang from "./FormQuanLyBanHang";
import { Button, Form, Modal } from "antd";
import { useDispatch } from "react-redux";
import { getDataById } from "../../services/getData.api";
import { setReload } from "../../redux/slices/main.slice";
import { putData } from "../../services/updateData";
import dayjs, { Dayjs } from "dayjs";
import { ConfigProvider } from "antd";

/* ✅ Responsive hook để nhận biết mobile */
import { useResponsive } from "../../hooks/useReponsive";
/* ✅ Thanh hành động cố định đáy cho mobile */
import MobileActionBar from "../../components/responsive/MobileActionBar";

const SuaQuanLyBanHang = ({
  path,
  id,
  title,
}: {
  path: string;
  id: number;
  title: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);       // loading khi fetch chi tiết
  const [isSubmitting, setIsSubmitting] = useState(false); // loading khi submit
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  /* ✅ Dùng để điều chỉnh modal trên mobile */
  const { isMobile } = useResponsive();

  /* ✅ PHẠM VI CHỈNH SỬA:
     - 'all'      : Chưa giao → chỉnh mọi thứ
     - 'payment'  : Đang giao / Đã giao nhưng CHƯA thanh toán đủ → chỉ chỉnh thanh toán
     - 'locked'   : Đã giao & Đã thanh toán đủ (hoặc Đã hủy) → khóa toàn bộ
  */
  const [editScope, setEditScope] = useState<'all' | 'payment' | 'locked'>('all');

  const showModal = async () => {
    setIsModalOpen(true);
    setIsLoading(true);

    const data = await getDataById(id, path);

    // Chuẩn hoá các field ngày để bind vào DatePicker
    Object.keys(data || {}).forEach((key) => {
      const val = data[key];
      if (!val) return;

      const looksLikeDateTime =
        /(thoi_gian|_thoi|_at|datetime)/i.test(key) ||
        key === "nguoi_nhan_thoi_gian";

      const looksLikeDateOnly =
        /(ngay_|_ngay|^ngay$|birthday)/i.test(key) &&
        key !== "nguoi_nhan_thoi_gian";

      if (looksLikeDateTime) {
        data[key] = dayjs(val); // giữ cả giờ
      } else if (looksLikeDateOnly) {
        data[key] = dayjs(val, "YYYY-MM-DD");
      }
    });

    // Transform chi_tiet_don_hangs thành format cho FormList
    let danhSachSanPham: any[] = [];
    if (data?.chi_tiet_don_hangs && Array.isArray(data.chi_tiet_don_hangs)) {
      danhSachSanPham = data.chi_tiet_don_hangs.map((item: any) => ({
        san_pham_id: +item.san_pham_id,
        don_vi_tinh_id: +item.don_vi_tinh_id,
        so_luong: item.so_luong,
        don_gia: item.don_gia,
        tong_tien: item.tong_tien,
        loai_gia: item?.loai_gia ?? 1,
      }));
    }

    form.setFieldsValue({
      ...data,
      danh_sach_san_pham: danhSachSanPham,
    });

    /* ✅ XÁC ĐỊNH PHẠM VI CHỈNH SỬA THEO TRẠNG THÁI */
    const st  = Number(data?.trang_thai_don_hang ?? 0);     // 0=Chưa giao,1=Đang giao,2=Đã giao,3=Đã hủy
    const pay = Number(data?.trang_thai_thanh_toan ?? 0);   // 0=Chưa, 1=Một phần, 2=Đã đủ
    if (st === 0) {
      setEditScope('all');
    } else if (st === 1 || st === 2) {
      setEditScope(pay === 2 ? 'locked' : 'payment');
    } else {
      setEditScope('locked');
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onUpdate = async (values: any) => {
    // ✅ Chặn submit nếu bị khóa
    if (editScope === 'locked') {
      console.warn("Đơn đã hoàn tất, không được chỉnh sửa.");
      return;
    }

    setIsSubmitting(true);
    try {
      const closeModel = () => {
        handleCancel();
        dispatch(setReload());
      };

      // Không gửi mã đơn
      const { ma_don_hang, ...rest } = values || {};

      // Format ngày: ngày tạo chỉ cần date; ngày nhận cần cả giờ
      const ngayTao: string | null = values?.ngay_tao_don_hang
        ? dayjs(values.ngay_tao_don_hang).format("YYYY-MM-DD")
        : null;

      const tgNhanRaw: string | Dayjs | null = values?.nguoi_nhan_thoi_gian ?? null;
      const tgNhan: string | null =
        tgNhanRaw
          ? dayjs(tgNhanRaw as any).isValid()
            ? dayjs(tgNhanRaw as any).format("YYYY-MM-DD HH:mm:ss")
            : null
          : null;

      // Không bắt buộc phải đính kèm danh_sach_san_pham khi chỉ sửa thông tin người nhận
      const payload: any = {
        ...rest,
        ngay_tao_don_hang: ngayTao,
        nguoi_nhan_thoi_gian: tgNhan,
        so_tien_da_thanh_toan: values?.so_tien_da_thanh_toan
          ? values.so_tien_da_thanh_toan
          : 0,
      };

      await putData(path, id, payload, closeModel);
    } catch (error) {
      console.error("Error in onUpdate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        size="small"
        title={`Sửa ${title}`}
        icon={<EditOutlined />}
        loading={isLoading}
      />
      <Modal
        title={`Sửa ${title}`}
        open={isModalOpen}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        /* ✅ Responsive: mobile full-width, desktop giữ 1200 như cũ */
        width={isMobile ? "100%" : 1200}
        /* ✅ Body cuộn mượt & padding gọn trên mobile */
        styles={{
          body: {
            maxHeight: isMobile ? "calc(100vh - 140px)" : undefined,
            overflow: "auto",
            padding: isMobile ? 12 : 24,
          },
        }}
        /* ✅ Desktop/Tablet: giữ footer cũ; Mobile: ẩn footer để dùng MobileActionBar */
        footer={
          isMobile
            ? null
            : [
                <Button
                  key="submit"
                  form={`formSuaQuanLyBanHang-${id}`}
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isSubmitting}
                  disabled={editScope === 'locked'}   // ✅ khóa nút Lưu khi locked
                >
                  Lưu
                </Button>,
              ]
        }
      >
        {/* ✅ GÓI BẰNG ConfigProvider để Select/DatePicker vẽ dropdown TRONG modal */}
        {/* ✅ (Rollback) Render dropdown ra body như trước để không bị ăn click */}
        {/* ====== FORM ====== */}
        <Form
          id={`formSuaQuanLyBanHang-${id}`}
          form={form}
          layout="vertical"
          onFinish={onUpdate}
          onFinishFailed={(errorInfo) => {
            console.error("Form validation failed:", errorInfo);
          }}
        >
          {/* ✅ Truyền editScope xuống form để disable field theo quy tắc */}
          <FormQuanLyBanHang form={form} isDetail={false} /* giữ prop cũ */ editScope={editScope as any} />
        </Form>

        {/* ✅ Thanh hành động cố định đáy — CHỈ hiển thị khi mobile */}
        {isMobile && (
          <MobileActionBar
            primaryLabel="Lưu"
            onPrimary={() => editScope !== 'locked' && form.submit()}  // ✅ chặn submit khi locked
            primaryLoading={isSubmitting}
                             // ✅ khóa nút trên mobile
          />
        )}
      </Modal>
    </>
  );
};

export default SuaQuanLyBanHang;
