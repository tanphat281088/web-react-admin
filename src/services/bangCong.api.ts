/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "../configs/axios";

export type BangCongItem = {
  id: number;
  user_id: number;
  user_name?: string | null;
  thang: string; // 'YYYY-MM'
  so_ngay_cong: number;
  so_gio_cong: number;
  di_tre_phut: number;
  ve_som_phut: number;
  nghi_phep_ngay: number;
  nghi_phep_gio: number;
  nghi_khong_luong_ngay: number;
  nghi_khong_luong_gio: number;
  lam_them_gio: number;
  locked: boolean;
  computed_at?: string | null;
  ghi_chu?: any;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function timesheetMy(thang?: string) {
  const { data } = await axios.get("/nhan-su/bang-cong/my", { params: { thang } });
  return data as { success: boolean; data: { thang: string; item: BangCongItem | null } };
}

export async function timesheetAdmin(params: { user_id: number; thang?: string }) {
  const { data } = await axios.get("/nhan-su/bang-cong", { params });
  return data as { success: boolean; data: { user_id: number; thang: string; item: BangCongItem | null } };
}

export async function timesheetRecompute(params: { thang?: string; user_id?: number }) {
  const { data } = await axios.post("/nhan-su/bang-cong/recompute", null, { params });
  return data;
}
