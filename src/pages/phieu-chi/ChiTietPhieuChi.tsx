import { EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import FormPhieuChi from "./FormPhieuChi";
import { Button, Form, Modal } from "antd";
import { useDispatch } from "react-redux";
import { getDataById } from "../../services/getData.api";
import { setReload } from "../../redux/slices/main.slice";
import { putData } from "../../services/updateData";
import dayjs from "dayjs";

const ChiTietPhieuChi = ({
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

    const [chiTietPhieuChi, setChiTietPhieuChi] = useState<any>([]);

    const normalizeDates = (obj: Record<string, any>) => {
        Object.keys(obj).forEach((key) => {
            if (obj[key]) {
                if (
                    /ngay_|_ngay/.test(key) ||
                    /ngay/.test(key) ||
                    /thoi_gian|_thoi/.test(key) ||
                    /birthday/.test(key)
                ) {
                    obj[key] = dayjs(obj[key], "YYYY-MM-DD");
                }
            }
        });
        return obj;
    };

    const inferCategoryParentCode = (data: any) => {
        // Nếu API chưa trả category_parent_code mà có category_id,
        // ta gợi ý CHA theo Mức A để Select danh mục con còn có dữ liệu hiển thị.
        if (!data?.category_parent_code && data?.category_id) {
            if (data?.loai_phieu_chi === 1 || data?.loai_phieu_chi === 2 || data?.loai_phieu_chi === 4) {
                data.category_parent_code = "COGS"; // chi NVL trực tiếp
            }
            // Loại 3 (Chi khác): không suy đoán để tránh sai — user đã chọn ở lúc tạo.
        }
        return data;
    };

    const showModal = async () => {
        setIsModalOpen(true);
        setIsLoading(true);

        const data = await getDataById(id, path);
        const normalized = normalizeDates({ ...data });
        const withParent = inferCategoryParentCode(normalized);

        form.setFieldsValue({
            ...withParent,
        });

        setIsLoading(false);

        if (withParent.loai_phieu_chi == 2 || withParent.loai_phieu_chi == 4) {
            setChiTietPhieuChi(withParent.chi_tiet_phieu_chi);
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
        await putData(path, id, values, closeModel);
        setIsSubmitting(false);
    };

    return (
        <>
            <Button
                onClick={showModal}
                type="primary"
                size="small"
                title={`Chi tiết ${title}`}
                icon={<EyeOutlined />}
            />
            <Modal
                title={`Chi tiết ${title}`}
                open={isModalOpen}
                onCancel={handleCancel}
                maskClosable={false}
                centered
                width={1000}
                loading={isLoading}
                footer={[
                    <Button
                        key="submit"
                        form={`formSuaPhieuChi-${id}`}
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={isSubmitting}
                    >
                        Lưu
                    </Button>,
                ]}
            >
                <Form
                    id={`formSuaPhieuChi-${id}`}
                    form={form}
                    layout="vertical"
                    onFinish={onUpdate}
                >
                    <FormPhieuChi
                        form={form}
                        isDetail={true}
                        chiTietPhieuChi={chiTietPhieuChi}
                    />
                </Form>
            </Modal>
        </>
    );
};

export default ChiTietPhieuChi;
