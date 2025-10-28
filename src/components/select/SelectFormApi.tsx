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
  value,
  ...restProps
}: SelectFormApiProps) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const keywordRef = useRef<string>(""); // lưu keyword hiện tại
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
      // gửi đa khóa để BE kiểu nào cũng nhận được search
      keyword: query,
      q: query,
      search: query,
      term: query,
      limit: PAGE_SIZE,
    });

    const list = Array.isArray(data)
      ? data.map((item: any) => {
          // dựng nhãn linh hoạt hơn cho khách hàng
          const fallbackLabel =
            item.label ??
            item.name ??
            [item.ma_khach_hang, item.ten_khach_hang, item.so_dien_thoai]
              .filter(Boolean)
              .join(" - ");

          return {
            ...item,
            value: item.id ?? item.value,
            label: fallbackLabel,
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


  // Reload từ ngoài (filter/path/reload đổi) => gọi lại với keyword đang có
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
    if (open) {
      // load gợi ý ban đầu
      handleSearch(keywordRef.current || "");
    }
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      initialValue={initialValue}
    >
      <Select
        options={options}
        placeholder={placeholder}
        mode={mode}
        onChange={onChange}
        showSearch
        allowClear
        size={size}
        disabled={disabled}
        value={value}
        loading={loading}
        onSearch={handleSearch}            // remote search
        filterOption={false}               // không lọc cục bộ
        optionFilterProp="label"           // highlight theo label
        onDropdownVisibleChange={handleDropdownVisible}
        notFoundContent={loading ? "Đang tìm..." : "Không có dữ liệu"}
        {...restProps}
      />
    </Form.Item>
  );
};

export default SelectFormApi;
