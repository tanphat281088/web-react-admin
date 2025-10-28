/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { signMakerApi, type SignTemplate } from "../../services/signMaker.api";

const { Title, Text } = Typography;

type PreviewMap = Record<string, string | null>; // template_code -> html(svg) | null

// ====== Lựa chọn Font & Khổ giấy (đã thêm A5/A6/A7) ======
const FONT_OPTIONS = [
  { label: "Montserrat (Sans)", value: "Montserrat, Arial, sans-serif" },
  { label: "Be Vietnam Pro (Sans)", value: '"Be Vietnam Pro", Montserrat, Arial, sans-serif' },
  { label: "Noto Serif (Serif)", value: '"Noto Serif", Merriweather, Georgia, serif' },
  { label: "Dancing Script (Script)", value: '"Dancing Script", "Brush Script MT", cursive' },
];

const PAPER_OPTIONS = [
  { label: "A3 (297×420mm)", value: "A3" },
  { label: "A4 (210×297mm)", value: "A4" },
  { label: "A5 (148×210mm)", value: "A5" },
  { label: "A6 (105×148mm)", value: "A6" },
  { label: "A7 (74×105mm)", value: "A7" },
];

// ====== Việt hoá ======
const shapeVi = (shape: SignTemplate["shape"]) => {
  switch (shape) {
    case "cloud": return "Mây";
    case "heart": return "Trái tim";
    case "oval": return "Oval";
    case "rect": return "Chữ nhật";
    case "roundrect": return "Chữ nhật bo góc";
    case "ribbon": return "Ruy băng";
    default: return shape;
  }
};

const viNameFrom = (tpl: SignTemplate): string => {
  const code = (tpl.code || "").toUpperCase();
  const baseShape = shapeVi(tpl.shape);

  const isL = /(^|[_-])L$/.test(code) || /\sL$/.test(code);
  const isM = /(^|[_-])M$/.test(code) || /\sM$/.test(code);
  const isS = /(^|[_-])S$/.test(code) || /\sS$/.test(code);
  const size = isL ? "Lớn" : isM ? "Trung" : isS ? "Nhỏ" : "";

  // “BRAND”, “_BRAND”, “-BRAND”, hay trong name có “brand”
  const hasBrand = /(^|[_-])BRAND($|[_-])/.test(code) || /BRAND/i.test(tpl.name || "");
  if (hasBrand && size) return `${baseShape} ${size} · Thương hiệu`;
  if (hasBrand) return `${baseShape} · Thương hiệu`;
  if (size) return `${baseShape} ${size}`;
  return tpl.name || baseShape;
};

const Page: React.FC = () => {
  const [form] = Form.useForm();
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [templates, setTemplates] = useState<SignTemplate[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<PreviewMap>({});
  const [exporting, setExporting] = useState(false);

  // ====== Tải templates ======
  useEffect(() => {
    (async () => {
      setLoadingTpl(true);
      try {
        const tpls = await signMakerApi.getTemplates();
        setTemplates(Array.isArray(tpls) ? tpls : []);
        if (!Array.isArray(tpls)) message.error("Không tải được danh sách mẫu (dữ liệu không hợp lệ).");
      } catch (err: any) {
        console.error("Load templates failed:", err);
        message.error(err?.message || "Không tải được danh sách mẫu. Vui lòng kiểm tra kết nối/đăng nhập.");
        setTemplates([]);
      } finally {
        setLoadingTpl(false);
      }
    })();
  }, []);

  // ====== Gom nhóm theo shape ======
  const grouped = useMemo(() => {
    const byShape: Record<string, SignTemplate[]> = {};
    for (const t of templates) (byShape[t.shape] ||= []).push(t);
    Object.keys(byShape).forEach((k) => byShape[k].sort((a, b) => a.code.localeCompare(b.code)));
    return byShape;
  }, [templates]);

  // ====== Preview 1 mẫu ======
  const doPreviewOne = async (template_code: string, text: string, font_family?: string, font_size?: number) => {
    const html = await signMakerApi.preview({ template_code, text, font_family, font_size });
    setPreviewHtml((m) => ({ ...m, [template_code]: html }));
  };

  // ====== Tạo preview ======
  const handlePreview = async () => {
    const text: string = form.getFieldValue("text")?.trim() || "";
    const font_family: string | undefined = form.getFieldValue("font_family") || undefined;
    const font_size: number | undefined = form.getFieldValue("font_size") || undefined;

    if (!text) return message.warning("Bạn vui lòng nhập nội dung tiêu đề trước.");
    if (!selectedCodes.length) return message.warning("Hãy chọn ít nhất 1 mẫu.");

    setPreviewing(true);
    setPreviewHtml({});
    try {
      for (const code of selectedCodes) {
        // eslint-disable-next-line no-await-in-loop
        await doPreviewOne(code, text, font_family, font_size);
      }
      message.success("Đã tạo xem thử.");
    } catch (err: any) {
      console.error("Preview failed:", err);
      message.error(err?.response?.data?.message || err?.message || "Tạo xem thử thất bại.");
    } finally {
      setPreviewing(false);
    }
  };

  // ====== Xuất PDF ======
  const handleExport = async () => {
    const text: string = form.getFieldValue("text")?.trim() || "";
    const paper: "A3" | "A4" | "A5" | "A6" | "A7" = form.getFieldValue("paper") || "A4";
    const font_family: string | undefined = form.getFieldValue("font_family") || undefined;
    const font_size: number | undefined = form.getFieldValue("font_size") || undefined;

    if (!text) return message.warning("Bạn vui lòng nhập nội dung tiêu đề trước.");
    if (!selectedCodes.length) return message.warning("Hãy chọn ít nhất 1 mẫu.");

    setExporting(true);
    try {
      const resp = await signMakerApi.exportPdf({
        text,
        template_codes: selectedCodes,
        paper,
        font_family,
        font_size,
      });
      if (resp?.success && resp?.download_url) {
        message.success("Xuất PDF thành công, đang tải về…");
        window.open(resp.download_url, "_blank");
      } else {
        message.error(resp?.message || "Xuất PDF thất bại.");
      }
    } catch (err: any) {
      console.error("Export PDF failed:", err);
      message.error(
        err?.response?.status === 403
          ? "Bạn chưa được cấp quyền xuất PDF hoặc tính năng đang tắt."
          : err?.response?.data?.message || err?.message || "Xuất PDF thất bại."
      );
    } finally {
      setExporting(false);
    }
  };

  // ====== Chọn nhanh theo shape ======
  const selectByShape = (shape: SignTemplate["shape"]) => {
    const codes = templates.filter((t) => t.shape === shape).map((t) => t.code);
    const merged = Array.from(new Set([...selectedCodes, ...codes]));
    setSelectedCodes(merged);
  };

  // ====== Helpers cho tiêu đề thẻ preview (VI hoá) ======
  const vnTitleByCode = (code: string): { title: string; subtitle?: string } => {
    const tpl = templates.find((t) => t.code === code);
    if (!tpl) return { title: code }; // fallback
    const title = viNameFrom(tpl); // “Chữ nhật bo góc Trung · Thương hiệu”, …
    const subtitle = `${tpl.width_mm}×${tpl.height_mm}mm · lề tràn ${tpl.bleed_mm}mm`;
    return { title, subtitle };
  };

  // ====== Trạng thái nút ======
  const textValue: string = form.getFieldValue("text")?.trim() || "";
  const canPreview = !!textValue && selectedCodes.length > 0 && !previewing;
  const canExport = !!textValue && selectedCodes.length > 0 && !exporting;

  // ====== Render ======
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Title level={3}>Sign Maker — Tạo tiêu đề cho bó hoa/lẵng hoa</Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ paper: "A4", font_family: FONT_OPTIONS[0].value }}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} md={14}>
              <Form.Item
                name="text"
                label="Nội dung tiêu đề (dùng dấu '|' để xuống dòng thủ công)"
                rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
              >
                <Input.TextArea
                  placeholder="VD: Chúc Mừng Sinh Nhật|Em Yêu!"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Form.Item name="paper" label="Khổ giấy PDF">
                    <Select options={PAPER_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="font_size" label="Cỡ chữ (tùy chọn)">
                    <Select
                      allowClear
                      placeholder="Tự căn (Auto-fit)"
                      options={[20, 22, 24, 26, 28, 30, 32, 36, 40, 44].map((v) => ({
                        label: v,
                        value: v,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="font_family" label="Font chữ">
                    <Select options={FONT_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider orientation="left">Chọn mẫu</Divider>

          <Space wrap size="small" style={{ marginBottom: 8 }}>
            <Button
              onClick={() => setSelectedCodes(templates.map((t) => t.code))}
              disabled={loadingTpl || !templates.length}
            >
              Chọn tất cả
            </Button>
            <Button
              onClick={() => setSelectedCodes([])}
              disabled={loadingTpl && !selectedCodes.length}
            >
              Bỏ chọn
            </Button>
            <Text type="secondary">Chọn nhanh theo hình dáng:</Text>
            <Space size={4} wrap>
              <Tag color="purple"   onClick={() => selectByShape("cloud")}     style={{ cursor: "pointer" }}>Mây</Tag>
              <Tag color="magenta"  onClick={() => selectByShape("heart")}     style={{ cursor: "pointer" }}>Trái tim</Tag>
              <Tag color="blue"     onClick={() => selectByShape("oval")}      style={{ cursor: "pointer" }}>Oval</Tag>
              <Tag color="green"    onClick={() => selectByShape("rect")}      style={{ cursor: "pointer" }}>Chữ nhật</Tag>
              <Tag color="geekblue" onClick={() => selectByShape("roundrect")} style={{ cursor: "pointer" }}>Chữ nhật bo góc</Tag>
              <Tag color="volcano"  onClick={() => selectByShape("ribbon")}    style={{ cursor: "pointer" }}>Ruy băng</Tag>
            </Space>
          </Space>

          <Row gutter={[12, 12]}>
            {Object.keys(grouped).map((shape) => (
              <Col span={24} key={shape}>
                <Card size="small" title={<span>Nhóm: {shapeVi(shape as SignTemplate["shape"])}</span>}>
                  <Checkbox.Group
                    style={{ width: "100%" }}
                    value={selectedCodes}
                    onChange={(vals) => setSelectedCodes(vals as string[])}
                  >
                    <Row gutter={[8, 8]}>
                      {grouped[shape].map((tpl) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={tpl.code}>
                          <Checkbox value={tpl.code}>
                            <Space direction="vertical" size={2}>
                              <Text strong>{viNameFrom(tpl)}</Text>
                              <Text type="secondary">
                                {tpl.width_mm}×{tpl.height_mm}mm · lề tràn {tpl.bleed_mm}mm
                              </Text>
                            </Space>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          <Space>
            <Button type="primary" onClick={handlePreview} loading={previewing} disabled={!canPreview}>
              Tạo xem thử
            </Button>
            <Button onClick={handleExport} loading={exporting} disabled={!canExport}>
              Xuất PDF
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Khu vực hiển thị preview */}
      {Object.keys(previewHtml).length > 0 && (
        <>
          <Divider orientation="left">Xem thử</Divider>
          <Row gutter={[12, 12]}>
            {selectedCodes.map((code) => {
              const { title, subtitle } = vnTitleByCode(code);
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={code}>
                  <Card
                    size="small"
                    title={
                      <Space direction="vertical" size={0}>
                        <Text strong>{title}</Text>
                        {subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>}
                        <Space size={6} wrap>
                          <Tag>{code}</Tag>
                          <Tag color="blue">Xem thử</Tag>
                        </Space>
                      </Space>
                    }
                    bodyStyle={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 260,
                      overflow: "hidden",
                    }}
                  >
                    {previewHtml[code] ? (
                      <div
                        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                        // an toàn vì backend chỉ trả SVG/HTML kiểm soát được
                        dangerouslySetInnerHTML={{ __html: previewHtml[code] as string }}
                      />
                    ) : (
                      <Text type="secondary">Đang tạo xem thử…</Text>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </Space>
  );
};

export default Page;
