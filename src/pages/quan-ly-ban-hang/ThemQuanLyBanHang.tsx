import { PlusOutlined } from "@ant-design/icons";
import { postData } from "../../services/postData.api";
import { useState } from "react";
import { Button, Form, Modal, Row, message } from "antd";
import FormQuanLyBanHang from "./FormQuanLyBanHang";
import { useDispatch } from "react-redux";
import { clearImageSingle, setReload } from "../../redux/slices/main.slice";
import dayjs from "dayjs";

const ThemQuanLyBanHang = ({
    path,
    title,
}: {
    path: string;
    title: string;
}) => {
    const dispatch = useDispatch();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form] = Form.useForm();

    const showModal = async () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        dispatch(clearImageSingle());
    };

    const onCreate = async (values: any) => {
        setIsLoading(true);
        try {
            // ⚠️ Không gửi ma_don_hang (BE tự sinh theo id)
            const {
                ma_don_hang, // eslint-disable-line @typescript-eslint/no-unused-vars
                ...rest
            } = values || {};

            const payload = {
                ...rest,
                ngay_tao_don_hang: dayjs(values.ngay_tao_don_hang).format("YYYY-MM-DD"),
                so_tien_da_thanh_toan: values.so_tien_da_thanh_toan
                    ? values.so_tien_da_thanh_toan
                    : 0,
            };

            // postData thường trả { success, data, message }
            const closeModel = () => {
                handleCancel();
                dispatch(setReload());
            };

            const resp: any = await postData(path, payload, closeModel);

            // Hiển thị mã đơn hàng do BE tự sinh (nếu có)
            const code = resp?.data?.ma_don_hang;
            if (code) {
                message.success(`Tạo đơn thành công: ${code}`);
            } else {
                message.success(`Tạo đơn thành công`);
            }
        } catch (_e) {
            // postData đã có handleAxiosError; ở đây chỉ đảm bảo loading được tắt
        } finally {
            setIsLoading(false);
        }
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
                            form="formQuanLyBanHang"
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
                    id="formQuanLyBanHang"
                    form={form}
                    layout="vertical"
                    onFinish={onCreate}
                >
                    <FormQuanLyBanHang form={form} />
                </Form>
            </Modal>
        </>
    );
};

export default ThemQuanLyBanHang;
