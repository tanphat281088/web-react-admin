/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo } from "react";
import { Form, Select, type SelectProps } from "antd";
import type { ReactNode } from "react";
import { getDataSelect } from "../../services/getData.api";
import type { Rule } from "antd/es/form";

/** Kiểu option thống nhất */
type OptionItem = { value: string | number; label: string };

interface SelectFormApiProps
  extends Omit<SelectProps, "path" | "filter" | "reload"> {
  /** Hỗ trợ NamePath của AntD: string | number | (string|number)[] */
  name?: any;
  label?: ReactNode;
  rules?: Rule[];
  initialValue?: any;

  /** Endpoint để lấy options */
  path: string;
  /** Filter thêm khi gọi API */
  filter?: any;
  /** Thay đổi giá trị này để ép fetch lại */
  reload?: boolean | any;

  /** ⬇️ Chỉ đặt true khi muốn controlled bằng tay (mặc định để Form.Item control) */
  forceControlledValue?: boolean;

  /** (MỚI) Ép option.value về number nếu parse được (mặc định false để không ảnh hưởng chỗ khác) */
  coerceValueToNumber?: boolean;

  /** (MỚI) Bơm sẵn option để hiển thị ngay (ví dụ {value: id hiện có, label: tên}) */
  extraOptions?: OptionItem[];
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
  value, // ⚠️ vẫn nhận để tương thích API cũ (chỉ dùng khi forceControlledValue = true)
  forceControlledValue = false,
  coerceValueToNumber = false,      // (MỚI)
  extraOptions,                      // (MỚI)
  getPopupContainer,
  dropdownMatchSelectWidth,
  popupClassName,
  ...restProps
}: SelectFormApiProps) => {
  const [apiOptions, setApiOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const keywordRef = useRef<string>("");
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Chuẩn hoá value theo cờ coerceValueToNumber (an toàn, không bật mặc định) */
  const normalizeValue = (raw: any): string | number => {
    if (coerceValueToNumber) {
      const n = Number(raw);
      return Number.isFinite(n) ? n : String(raw ?? "");
    }
    return typeof raw === "number" ? raw : String(raw ?? "");
  };

  /** Gộp extraOptions (prefill) + apiOptions, loại trùng theo value */
  const mergedOptions: OptionItem[] = useMemo(() => {
    const prefills = (extraOptions ?? []).map((o) => ({
      value: normalizeValue(o.value),
      label: o.label,
    }));
    const fetched = (apiOptions ?? []).map((o) => ({
      value: normalizeValue(o.value),
      label: o.label,
    }));

    const seen = new Set<string | number>();
    const out: OptionItem[] = [];
    for (const arr of [prefills, fetched]) {
      for (const it of arr) {
        const key = it.value;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(it);
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraOptions, apiOptions, coerceValueToNumber]);

  const fetchOptions = async (kw: string) => {
    if (!path || path.trim() === "") {
      setApiOptions([]);
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

      const list: OptionItem[] = Array.isArray(data)
        ? data.map((item: any) => {
            const fallbackLabel =
              item.label ??
              item.name ??
              [item.ma_khach_hang, item.ten_khach_hang, item.so_dien_thoai]
                .filter(Boolean)
                .join(" - ");
            const raw = item.id ?? item.value;
            return {
              // ✅ chuẩn hoá value theo cờ
              value: normalizeValue(raw),
              label: String(fallbackLabel ?? ""),
            };
          })
        : [];

      setApiOptions(list);
    } catch (e) {
      console.error("Error fetching options:", e);
      setApiOptions([]);
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
  const selectProps: SelectProps = {
    options: mergedOptions, // (MỚI) dùng options đã gộp
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
      ((node) => (node && (node.closest(".ant-modal") as HTMLElement)) || document.body),
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
