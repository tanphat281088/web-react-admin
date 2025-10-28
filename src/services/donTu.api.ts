/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "../configs/axios";

/** =========================
 *  Types - Items & Responses
 *  ========================= */
export type DonTuItem = {
  id: number;
  user_id: number;
  loai: string;
  loai_label: string;
  tu_ngay?: string | null;            // 'YYYY-MM-DD' hoặc null
  den_ngay?: string | null;           // 'YYYY-MM-DD' hoặc null
  so_gio?: number | null;
  ly_do?: string | null;              // lý do NV khi tạo đơn
  ly_do_tu_choi?: string | null;      // <<< NEW: lý do QL khi từ chối
  trang_thai: number;                 // 0=pending,1=approved,2=rejected,3=canceled
  trang_thai_label: string;
  approver_id?: number | null;
  approver_name?: string | null;      // chỉ xuất hiện ở adminIndex
  approved_at?: string | null;        // ISO datetime
  attachments?: any[] | null;
  short_desc: string;
  created_at?: string | null;         // ISO datetime
  user_name?: string | null;          // chỉ xuất hiện ở adminIndex
};

export type DonTuPagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
};

export type DonTuListResponse = {
  filter: any;
  pagination: { total: number; per_page: number; current_page: number; last_page: number; has_more: boolean };
  items: DonTuItem[];
};

export type ApiEnvelope<T = any> = {
  success: boolean;
  code: string;
  data: T;
};

export type DonTuCreateInput = {
  loai: string;
  /** Chọn theo ngày: truyền tu_ngay / den_ngay (YYYY-MM-DD) */
  tu_ngay?: string | null;
  den_ngay?: string | null;
  /** Chọn theo giờ: truyền so_gio (1..168) */
  so_gio?: number | null;
  ly_do?: string | null;
  attachments?: any[] | null;
};

/** =========================
 *  Helpers - Chuẩn hoá payload
 *  ========================= */
function normalizeCreatePayload(input: DonTuCreateInput): DonTuCreateInput {
  const payload: DonTuCreateInput = {
    loai: input.loai,
    ly_do: input.ly_do?.trim() || undefined,
    attachments: input.attachments ?? undefined,
  };

  const hasDayRange = !!(input.tu_ngay || input.den_ngay);
  const hasHours = typeof input.so_gio === "number" && !Number.isNaN(input.so_gio);

  if (hasDayRange && hasHours) {
    // Ưu tiên NGÀY
    payload.tu_ngay = input.tu_ngay || undefined;
    payload.den_ngay = input.den_ngay || undefined;
    payload.so_gio = undefined;
  } else if (hasDayRange) {
    payload.tu_ngay = input.tu_ngay || undefined;
    payload.den_ngay = input.den_ngay || undefined;
  } else if (hasHours) {
    payload.so_gio = input.so_gio!;
  }

  return payload;
}

/** =========================
 *  API calls
 *  ========================= */
export async function donTuCreate(input: DonTuCreateInput): Promise<ApiEnvelope<{ item: DonTuItem; notice?: string }>> {
  // Chuẩn hoá để tránh gửi đồng thời ngày + giờ
  const payload = normalizeCreatePayload(input);
  const { data } = await axios.post("/nhan-su/don-tu", payload);
  return data as ApiEnvelope<{ item: DonTuItem; notice?: string }>;
}

// TRẢ THẲNG data (không trả envelope) — GIỮ NGUYÊN để không mất danh sách
export async function donTuMyList(params: {
  from?: string; to?: string; type?: string; status?: number; page?: number; per_page?: number;
}): Promise<DonTuListResponse> {
  const res = await axios.get("/nhan-su/don-tu/my", { params });
  const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
  return data as DonTuListResponse;
}

export async function donTuAdminList(params: {
  user_id?: number; from?: string; to?: string; type?: string; status?: number; page?: number; per_page?: number;
}): Promise<DonTuListResponse> {
  const res = await axios.get("/nhan-su/don-tu", { params });
  const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
  return data as DonTuListResponse;
}

/** ====== Actions (DUYỆT / TỪ CHỐI / HỦY) ====== */
// Gửi body rỗng {} để đảm bảo Content-Type application/json
export async function donTuApprove(id: number): Promise<ApiEnvelope<{ item: DonTuItem }>> {
  try {
    const { data } = await axios.patch(`/nhan-su/don-tu/${id}/approve`, {}); // <-- quan trọng
    return data as ApiEnvelope<{ item: DonTuItem }>;
  } catch (e: any) {
    // Log lỗi BE để thấy message/validation (giúp debug nhanh)
    // eslint-disable-next-line no-console
    console.error("[donTuApprove] error =", e?.response?.data || e);
    throw e;
  }
}

export async function donTuReject(id: number, ly_do?: string): Promise<ApiEnvelope<{ item: DonTuItem }>> {
  try {
    // Gửi union key để tương thích nhiều BE khác nhau
    const payload = {
      ly_do: ly_do ?? "",            // NV/legacy
      ly_do_tu_choi: ly_do ?? "",    // <<< NEW: ưu tiên BE đọc lý do QL từ khóa này
      ghi_chu: ly_do ?? "",          // fallback cho BE cũ
    };
    const { data } = await axios.patch(`/nhan-su/don-tu/${id}/reject`, payload);
    return data as ApiEnvelope<{ item: DonTuItem }>;
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[donTuReject] error =", e?.response?.data || e);
    throw e;
  }
}

export async function donTuCancel(id: number): Promise<ApiEnvelope<{ item: DonTuItem }>> {
  try {
    const { data } = await axios.patch(`/nhan-su/don-tu/${id}/cancel`, {}); // <-- quan trọng
    return data as ApiEnvelope<{ item: DonTuItem }>;
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[donTuCancel] error =", e?.response?.data || e);
    throw e;
  }
}

export async function donTuList(params: { user_id?: number; from?: string; to?: string; status?: string }) {
  const { data } = await axios.get("/nhan-su/don-tu", { params });
  return data;
}
