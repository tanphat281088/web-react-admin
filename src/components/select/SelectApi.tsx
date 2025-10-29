/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Select, type SelectProps } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import type { CSSProperties } from "react";
import { getDataSelect } from "../../services/getData.api";

export interface SelectApiProps extends Omit<SelectProps, "onChange"> {
  filter?: any;
  path: string;
  reload?: boolean;
  style?: CSSProperties;
  onChange?: (
    value: any,
    option: DefaultOptionType | DefaultOptionType[] | undefined
  ) => void;

  /** ⬇️ Tuỳ chọn: chỉ set true khi bạn MUỐN tự controlled `value` */
  forceControlledValue?: boolean;
}

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 30;

const SelectApi = ({
  mode,
  path,
  filter,
  placeholder,
  disabled,
  reload,
  value, // vẫn nhận nhưng KHÔNG tự forward
  style,
  onChange,
  forceControlledValue = false,
  getPopupContainer,
  dropdownMatchSelectWidth,
  popupClassName,
  ...restProps
}: SelectApiProps) => {
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
            const label =
              item.name ??
              item.label ??
              [item.ma_khach_hang, item.ten_khach_hang, item.so_dien_thoai]
                .filter(Boolean)
                .join(" - ");
            const val = item.id ?? item.value;
            return { ...item, value: typeof val === "number" ? val : String(val), label };
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

  const handleChange = (val: any, opt: any) => onChange?.(val, opt);

  const handleSearch = (kw: string) => {
    keywordRef.current = kw;
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => fetchOptions(kw), DEBOUNCE_MS);
  };

  const handleDropdownVisible = (open: boolean) => {
    if (open) handleSearch(keywordRef.current || "");
  };

  const selectProps: SelectProps = {
    options,
    placeholder,
    mode,
    showSearch: true,
    allowClear: true,
    size: "small",
    onChange: handleChange,
    disabled,
    style,
    onSearch: handleSearch,
    filterOption: false,
    optionFilterProp: "label",
    loading,
    onDropdownVisibleChange: handleDropdownVisible,
    notFoundContent: loading ? "Đang tìm..." : "Không có dữ liệu",
    getPopupContainer:
      getPopupContainer ||
      ((node) => (node && node.closest(".ant-modal")) || document.body),
    dropdownMatchSelectWidth: dropdownMatchSelectWidth ?? false,
    popupClassName: popupClassName ?? "phg-dd",
    ...restProps,
  };

  if (forceControlledValue) {
    // Chỉ khi bạn muốn TỰ kiểm soát state (ít dùng trong Form.Item)
    selectProps.value = value;
  }
  // 🚫 Mặc định KHÔNG set selectProps.value để tránh “controlled hai nơi”

  return <Select {...selectProps} />;
};

export default SelectApi;
