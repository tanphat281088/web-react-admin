import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import FormSanPham from "./FormSanPham";
import { Button, Form, Modal, Spin } from "antd"; // + Spin
import { useDispatch, useSelector } from "react-redux";
import { getDataById } from "../../services/getData.api";
import { setImageSingle, setReload } from "../../redux/slices/main.slice";
import { putData } from "../../services/updateData";
import type { RootState } from "../../redux/store";

const SuaSanPham = ({
  path,
  id,
  title,
}: {
  path: string;
  id: number;
  title: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { imageSingle } = useSelector((state: RootState) => state.main);

  const showModal = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    try {
      const data = await getDataById(id, path);

      // an toàn khi không có ảnh
      const firstImagePath = data?.images?.[0]?.path ?? "";
      dispatch(setImageSingle(firstImagePath));

      // an toàn khi không có mảng liên kết
      const dvtIds =
        data?.don_vi_tinhs?.map((item: { value: number }) => item.value) ?? [];
      const nccIds =
        data?.nha_cung_caps?.map((item: { value: number }) => item.value) ?? [];

      // set toàn bộ data (bao gồm gia_dat_truoc_3n) + các field mảng đã chuyển id
      form.setFieldsValue({
        ...data,
        don_vi_tinh_id: dvtIds,
        nha_cung_cap_id: nccIds,
      });
    } catch (e) {
      // vẫn đóng spinner nếu lỗi
      // (axios helper phía bạn sẽ toast lỗi rồi)
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onUpdate = async (values: any) => {
    setIsSubmitting(true);
    const closeModel = () => {
      handleCancel();
      dispatch(setReload());
    };
    await putData(path, id, { ...values, image: imageSingle }, closeModel);
    setIsSubmitting(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        size="small"
        title={`Sửa ${title}`}
        icon={<EditOutlined />}
      />
      <Modal
        title={`Sửa ${title}`}
        open={isModalOpen}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        width={1000}
        destroyOnClose // tránh giữ state cũ
        footer={[
          <Button
            key="submit"
            form={`formSuaSanPham-${id}`}
            type="primary"
            htmlType="submit"
            size="large"
            loading={isSubmitting}
          >
            Lưu
          </Button>,
        ]}
      >
        <Spin spinning={isLoading}>
          <Form
            id={`formSuaSanPham-${id}`}
            form={form}
            layout="vertical"
            onFinish={onUpdate}
          >
            <FormSanPham form={form} />
          </Form>
        </Spin>
      </Modal>
    </>
  );
};

export default SuaSanPham;
