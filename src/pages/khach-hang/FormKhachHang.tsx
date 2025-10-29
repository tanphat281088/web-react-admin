/* eslint-disable @typescript-eslint/no-unused-vars */
import { Row, Col, Form, Input, type FormInstance, Select } from "antd";
import { phonePattern } from "../../utils/patterns";

/** Danh sách cố định cho dropdown (không được tự thêm mới) */
const KENH_LIEN_HE_OPTIONS = [
  "Zalo Nana",
  "Facebook",
  "Zalo",
  "Hotline",
  "Website",
  "Tiktok",
  "Khách vãng lai",
  "Khác",
  "Fanpage PHG",
  "CTV Ái Tân",
  "Sự kiện Phát Hoàng Gia",
  "Zalo Hoatyuet",
  "Fanpage Hoatyuet",
  "Facebook Tuyết Võ",
].map((v) => ({ label: v, value: v }));

const FormKhachHang = ({ form }: { form: FormInstance }) => {
  return (
    <Row gutter={[10, 10]}>
      {/* MÃ KH - tự sinh sau khi lưu, chỉ hiển thị đọc */}
      <Col span={12}>
        <Form.Item name="ma_kh" label="Mã KH">
          <Input placeholder="Tự sinh sau khi lưu" disabled />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="ten_khach_hang"
          label="Tên khách hàng"
          rules={[{ required: true, message: "Tên khách hàng không được bỏ trống!" }]}
        >
          <Input placeholder="Nhập tên khách hàng" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            // KHÔNG bắt buộc; chỉ check định dạng nếu có nhập
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email (không bắt buộc)" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="so_dien_thoai"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Số điện thoại không được bỏ trống!" },
            { pattern: phonePattern, message: "Số điện thoại không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>
      </Col>

      {/* Kênh liên hệ: dropdown cố định - BẮT BUỘC */}
      <Col span={12}>
        <Form.Item
          name="kenh_lien_he"
          label="Kênh liên hệ"
          tooltip="Nguồn khách liên hệ (ví dụ: Zalo Nana, Facebook, Hotline...)"
          rules={[
            { required: true, message: "Vui lòng chọn Kênh liên hệ" },
          ]}
        >
          <Select
            placeholder="Chọn kênh liên hệ"
            showSearch
            allowClear={false}
            options={KENH_LIEN_HE_OPTIONS}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Col>

<Col span={24}>
  <Form.Item
    name="dia_chi"
    label="Địa chỉ"
    rules={[]} // không required
  >
    <Input.TextArea rows={3} placeholder="Nhập địa chỉ (không bắt buộc)" />
  </Form.Item>
</Col>


      <Col span={24}>
        <Form.Item name="ghi_chu" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default FormKhachHang;
