/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "../configs/axios";
import type { ApiResponseSuccess } from "../types/index.type";
import { API_ROUTE_CONFIG } from "../configs/api-route-config";
import { handleAxiosError } from "../helpers/axiosHelper";

/** Payload gửi khi checkin/checkout */
export type AttendanceCheckPayload = {
  lat: number;
  lng: number;
  accuracy_m?: number;
  device_id?: string;
};

/** Item chấm công trả về từ API */
export type AttendanceItem = {
  id: number;
  user_id?: number;
  user_name?: string | null;
  type: "checkin" | "checkout";
  checked_at: string | null; // ISO
  lat: number;
  lng: number;
  distance_m: number;
  within: boolean;
  accuracy_m?: number | null;
  device_id?: string | null;
  ip?: string | null;
  ghi_chu?: string | null;
  short_desc?: string | null;
  ngay?: string | null;     // YYYY-MM-DD
  gio_phut?: string | null; // HH:mm
};

/** Kết quả phân trang chung */
export type AttendancePagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
};

/** Response lịch sử (me/admin) */
export type AttendanceListResponse = {
  range?: { from: string; to: string };
  filter?: { user_id: number | null; from: string; to: string };
  pagination: AttendancePagination;
  items: AttendanceItem[];
};

/** CHECK-IN: POST /nhan-su/cham-cong/checkin */
export const attendanceCheckin = async (payload: AttendanceCheckPayload) => {
  try {
    const resp: ApiResponseSuccess<{
      log: {
        id: number;
        desc: string;
        checked_at: string;
        distance_m: number;
        within: boolean;
      };
      workpoint?: { id: number; ten: string; ban_kinh_m: number };
    }> = await axios.post(API_ROUTE_CONFIG.NHAN_SU_CHAM_CONG_CHECKIN, payload);
    return resp;
  } catch (error: any) {
    handleAxiosError(error);
    throw error;
  }
};

/** CHECK-OUT: POST /nhan-su/cham-cong/checkout */
export const attendanceCheckout = async (payload: AttendanceCheckPayload) => {
  try {
    const resp: ApiResponseSuccess<{
      log: {
        id: number;
        desc: string;
        checked_at: string;
        distance_m: number;
        within: boolean;
      };
      workpoint?: { id: number; ten: string; ban_kinh_m: number };
    }> = await axios.post(API_ROUTE_CONFIG.NHAN_SU_CHAM_CONG_CHECKOUT, payload);
    return resp;
  } catch (error: any) {
    handleAxiosError(error);
    throw error;
  }
};

/** ME: GET /nhan-su/cham-cong/me?from=&to=&page=&per_page= */
export const attendanceGetMy = async (params?: {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: number;
  per_page?: number;
}) => {
  try {
    const resp: ApiResponseSuccess<AttendanceListResponse> = await axios.get(
      API_ROUTE_CONFIG.NHAN_SU_CHAM_CONG_ME,
      { params }
    );
    return resp;
  } catch (error: any) {
    handleAxiosError(error);
    throw error;
  }
};

/** ADMIN: GET /nhan-su/cham-cong?user_id=&from=&to=&page=&per_page= */
export const attendanceGetAdmin = async (params?: {
  user_id?: number;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: number;
  per_page?: number;
}) => {
  try {
    const resp: ApiResponseSuccess<AttendanceListResponse> = await axios.get(
      API_ROUTE_CONFIG.NHAN_SU_CHAM_CONG_ADMIN,
      { params }
    );
    return resp;
  } catch (error: any) {
    handleAxiosError(error);
    throw error;
  }
};
