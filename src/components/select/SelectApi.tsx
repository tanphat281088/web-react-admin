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
  style: CSSProperties;
  onChange?: (
    value: any,
    option: DefaultOptionType | DefaultOptionType[] | undefined
  ) => void;
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
  value,
  style,
  onChange,
}: SelectApiProps) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
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
      // gửi đa khóa để BE nào cũng hiểu
      keyword: query,
      q: query,
      search: query,
      term: query,
      limit: PAGE_SIZE,
    });

    const list = Array.isArray(data)
      ? data.map((item: any) => {
          // dựng nhãn linh hoạt hơn cho các loại option (đặc biệt Khách hàng)
          const label =
            item.name ??
            item.label ??
            [item.ma_khach_hang, item.ten_khach_hang, item.so_dien_thoai]
              .filter(Boolean)
              .join(" - ");

          return {
            ...item,
            value: item.id ?? item.value,
            label,
          };
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

  return (
    <Select
      options={options}
      placeholder={placeholder}
      mode={mode}
      showSearch
      allowClear
      size="small"
      onChange={handleChange}
      value={value}
      disabled={disabled}
      style={style}
      onSearch={handleSearch}          // remote search
      filterOption={false}             // không lọc cục bộ
      optionFilterProp="label"
      loading={loading}
      onDropdownVisibleChange={handleDropdownVisible}
      notFoundContent={loading ? "Đang tìm..." : "Không có dữ liệu"}
    />
  );
};

export default SelectApi;
