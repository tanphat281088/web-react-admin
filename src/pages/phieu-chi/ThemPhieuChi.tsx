import { PlusOutlined } from "@ant-design/icons";
import { postData } from "../../services/postData.api";
import { useState } from "react";
import { Button, Form, Modal, Row } from "antd";
import FormPhieuChi from "./FormPhieuChi";
import { useDispatch } from "react-redux";
import { clearImageSingle, setReload } from "../../redux/slices/main.slice";
import dayjs from "dayjs";

const ThemPhieuChi = ({ path, title }: { path: string; title: string }) => {
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const showModal = async () => {
    // Reset sạch trước mỗi lần mở (tránh lưu state cũ)
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    dispatch(clearImageSingle());
  };

  const onCreate = async (values: any) => {
    setIsLoading(true);
    const closeModel = () => {
      handleCancel();
      dispatch(setReload());
    };
    await postData(
      path,
      {
        ...values,
        // chuẩn hoá định dạng ngày
        ngay_chi: dayjs(values.ngay_chi).format("YYYY-MM-DD"),
        // Lưu ý: category_id (nếu có) đã đi kèm trong values từ FormPhieuChi
      },
      closeModel
    );
    setIsLoading(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        title={`Thêm ${title}`}
        icon={<PlusOutlined />}
      >
        Thêm {title}
      </Button>
      <Modal
        title={`Thêm ${title}`}
        open={isModalOpen}
        width={1200}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        footer={[
          <Row justify="end" key="footer">
            <Button
              key="submit"
              form="formPhieuChi"
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
            >
              Lưu
            </Button>
          </Row>,
        ]}
      >
        <Form
          id="formPhieuChi"
          form={form}
          layout="vertical"
          onFinish={onCreate}
        >
          <FormPhieuChi form={form} />
        </Form>
      </Modal>
    </>
  );
};

export default ThemPhieuChi;
