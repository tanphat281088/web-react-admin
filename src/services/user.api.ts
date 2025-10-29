/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "../configs/axios";
import { API_ROUTE_CONFIG } from "../configs/api-route-config";

/**
 * Kiểu dữ liệu option cho Antd Select
 */
export type UserOption = {
  value: number;
  label: string;
};

/**
 * Tham số gọi danh sách người dùng
 */
export type UserListParams = {
  q?: string;
  page?: number;
  per_page?: number;
};

/**
 * Kết quả chuẩn hoá trả về từ API người dùng
 */
export type UserListResult = {
  raw: any[];            // mảng phần tử raw như BE trả về
  options: UserOption[]; // mảng option {value,label} dùng cho dropdown
  total?: number;        // nếu API có trả total/pagination
};

/**
 * Chuẩn hoá nhiều format response khác nhau về mảng items.
 * Do interceptor axios đã "flatten", resp có thể có các hình dạng:
 *  - { success, data: { collection: [...] } }
 *  - { collection: [...] }
 *  - { success, data: { items: [...] } }
 *  - { items: [...] }
 *  - Hoặc mảng thẳng []
 */
function extractUsersArray(resp: any): { items: any[]; total?: number } {
  // Thử bóc ra total/pagination nếu có
  const total =
    resp?.pagination?.total ??
    resp?.data?.pagination?.total ??
    resp?.total ??
    resp?.data?.total ??
    undefined;

  // Ưu tiên các key phổ biến
  const candidate =
    resp?.data?.collection ??
    resp?.collection ??
    resp?.data?.items ??
    resp?.items ??
    resp?.data ??
    resp;

  if (Array.isArray(candidate)) {
    return { items: candidate, total };
  }

  if (candidate && Array.isArray(candidate.collection)) {
    return { items: candidate.collection, total };
  }

  if (candidate && Array.isArray(candidate.items)) {
    return { items: candidate.items, total };
  }

  // fallback rỗng
  return { items: [], total };
}

/**
 * Chuẩn hoá label hiển thị (ưu tiên ho_ten > name > email)
 */
function toLabel(u: any): string {
  return u?.ho_ten || u?.name || u?.email || `#${u?.id}`;
}

/**
 * Gọi API danh sách người dùng dùng axios instance (đi qua interceptor để gắn token)
 * và chuẩn hoá kết quả trả về cho dropdown.
 *
 * Ví dụ dùng:
 *   const { options } = await userList({ q: "tuyet", page: 1, per_page: 50 });
 */
export async function userList(params: UserListParams = {}): Promise<UserListResult> {
  const { q = "", page = 1, per_page = 50 } = params;

  const resp: any = await axios.get(API_ROUTE_CONFIG.NGUOI_DUNG, {
    params: { q, page, per_page },
    headers: { Accept: "application/json" },
  });

  const { items, total } = extractUsersArray(resp);

  const options: UserOption[] = (items || [])
    .map((u: any) => ({
      value: Number(u?.id),
      label: toLabel(u),
    }))
    .filter((o) => Number.isFinite(o.value));

  return { raw: items, options, total };
}

/**
 * (Tuỳ chọn) Hàm trả về chỉ mảng options cho nhanh.
 * Dùng khi component chỉ cần options.
 */
export async function userOptions(params: UserListParams = {}): Promise<UserOption[]> {
  const r = await userList(params);
  return r.options;
}
