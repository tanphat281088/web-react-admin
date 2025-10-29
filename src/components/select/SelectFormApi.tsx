/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Form, Select, type SelectProps } from "antd";
import type { ReactNode } from "react";
import { getDataSelect } from "../../services/getData.api";
import type { Rule } from "antd/es/form";

interface SelectFormApiProps
  extends Omit<SelectProps, "path" | "filter" | "reload"> {
  name?: string;
  label?: ReactNode;
  rules?: Rule[];
  initialValue?: any;
  path: string;
  filter?: any;
  reload?: boolean | any;

  /** ⬇️ Tuỳ chọn: chỉ đặt true khi bạn MUỐN tự controlled thủ công
   * Mặc định = false để để Form.Item điều khiển giá trị.
   */
  forceControlledValue?: boolean;
}

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 30;

const SelectFormApi = ({
  mode,
  name,
  label,
  rules,
  initialValue,
  path,
  filter,
  placeholder,
  onChange,
  size = "middle",
  disabled,
  reload,
  value, // ⚠️ VẪN nhận prop này để giữ API cũ (nhưng KHÔNG forward khi không cần)
  forceControlledValue = false,
  getPopupContainer,
  dropdownMatchSelectWidth,
  popupClassName,
  ...restProps
}: SelectFormApiProps) => {
  const [options, setOptions] = useState<{ value: string | number; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const keywordRef = useRef<string>("");
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOptions = async (kw: string) => {
    if (!path || path.trim() === "") {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const query = (kw || "").trim();

      const data = await getDataSelect(path, {
        ...(filter || {}),
        keyword: query,
        q: query,
        search: query,
        term: query,
        limit: PAGE_SIZE,
      });

      const list = Array.isArray(data)
        ? data.map((item: any) => {
            const fallbackLabel =
              item.label ??
              item.name ??
              [item.ma_khach_hang, item.ten_khach_hang, item.so_dien_thoai]
                .filter(Boolean)
                .join(" - ");
            // ✅ Đảm bảo value là primitive id thống nhất (number hoặc string)
            const val = item.id ?? item.value;
            return { ...item, value: typeof val === "number" ? val : String(val), label: fallbackLabel };
          })
        : [];

      setOptions(list);
    } catch (e) {
      console.error("Error fetching options:", e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions(keywordRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, path, reload]);

  const handleSearch = (kw: string) => {
    keywordRef.current = kw;
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => fetchOptions(kw), DEBOUNCE_MS);
  };

  const handleDropdownVisible = (open: boolean) => {
    if (open) handleSearch(keywordRef.current || "");
  };

  // ✅ Để Form.Item điều khiển giá trị: KHÔNG forward `value` trừ khi bắt buộc
  // ✅ `onChange` vẫn chuyển tiếp để bạn hook logic phụ (Form vẫn nhận event mặc định)
  const selectProps: SelectProps = {
    options,
    placeholder,
    mode,
    showSearch: true,
    allowClear: true,
    size,
    disabled,
    loading,
    onSearch: handleSearch,
    filterOption: false,
    optionFilterProp: "label",
    onDropdownVisibleChange: handleDropdownVisible,
    notFoundContent: loading ? "Đang tìm..." : "Không có dữ liệu",
    // Neo dropdown vào modal nếu không truyền từ ngoài
    getPopupContainer:
      getPopupContainer ||
      ((node) => (node && node.closest(".ant-modal")) || document.body),
    // Giữ UI linh hoạt trong modal
    dropdownMatchSelectWidth: dropdownMatchSelectWidth ?? false,
    popupClassName: popupClassName ?? "phg-dd",
    ...restProps,
  };

  if (onChange) {
    selectProps.onChange = (v, opt) => onChange(v, opt);
  }
  if (forceControlledValue) {
    // Chỉ trong TH đặc biệt: bạn MUỐN tự controlled `value`
    selectProps.value = value;
  }
  // 🚫 Mặc định KHÔNG set selectProps.value để tránh “controlled hai nơi”

  return (
    <Form.Item name={name} label={label} rules={rules} initialValue={initialValue}>
      <Select {...selectProps} />
    </Form.Item>
  );
};

export default SelectFormApi;
