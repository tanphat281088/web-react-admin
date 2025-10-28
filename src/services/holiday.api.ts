/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "../configs/axios";

export type HolidayItem = {
  id: number;
  ngay: string;      // YYYY-MM-DD
  ten?: string | null;
  trang_thai: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function holidayList(params?: { from?: string; to?: string }) {
  const { data } = await axios.get("/nhan-su/holiday", { params });
  return data as { success: boolean; data: { items: HolidayItem[] } };
}

export async function holidayCreate(payload: { ngay: string; ten?: string; trang_thai?: boolean }) {
  const { data } = await axios.post("/nhan-su/holiday", payload);
  return data as { success: boolean; data: { item: HolidayItem } };
}

export async function holidayUpdate(id: number, payload: { ten?: string; trang_thai?: boolean }) {
  const { data } = await axios.patch(`/nhan-su/holiday/${id}`, payload);
  return data as { success: boolean; data: { item: HolidayItem } };
}

export async function holidayDelete(id: number) {
  const { data } = await axios.delete(`/nhan-su/holiday/${id}`);
  return data as { success: boolean };
}
