export const API_ROUTE_CONFIG = {
  UPLOAD_SINGLE: "/upload/single",
  UPLOAD_MULTIPLE: "/upload/multiple",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  PROFILE: "/auth/profile",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_OTP: "/auth/verify-otp",

  CAU_HINH_CHUNG: "/cau-hinh-chung",
  THOI_GIAN_LAM_VIEC: "/thoi-gian-lam-viec",

  NGUOI_DUNG: "/nguoi-dung",
  NGUOI_DUNG_NGUAI_GIO: "/nguoi-dung/ngoai-gio",
  VAI_TRO: "/vai-tro",
  VAI_TRO_OPTIONS: "/vai-tro/options",
  DANH_SACH_PHAN_QUYEN: "/danh-sach-phan-quyen",

  LICH_SU_IMPORT: "/lich-su-import",

  LOAI_KHACH_HANG: "/loai-khach-hang",
  KHACH_HANG: "/khach-hang",

  // ✅ MỚI: Khách hàng vãng lai
  KHACH_HANG_VANG_LAI: "/khach-hang-vang-lai",
  KHACH_HANG_VANG_LAI_CONVERT: "/khach-hang-vang-lai/convert",

  NHA_CUNG_CAP: "/nha-cung-cap",
  DANH_MUC_SAN_PHAM: "/danh-muc-san-pham",
  DON_VI_TINH: "/don-vi-tinh",
  SAN_PHAM: "/san-pham",

  PHIEU_NHAP_KHO: "/phieu-nhap-kho",
  QUAN_LY_TON_KHO: "/quan-ly-ton-kho",
  PHIEU_CHI: "/phieu-chi",
  QUAN_LY_BAN_HANG: "/quan-ly-ban-hang",
  PHIEU_XUAT_KHO: "/phieu-xuat-kho",
  PHIEU_THU: "/phieu-thu",

  CONG_THUC_SAN_XUAT: "/cong-thuc-san-xuat",
  SAN_XUAT: "/san-xuat",

  // ✅ MỚI: Giao hàng
  GIAO_HANG: "/giao-hang",
  GIAO_HANG_HOM_NAY: "/giao-hang/hom-nay",
  GIAO_HANG_LICH_HOM_NAY: "/giao-hang/lich-hom-nay",
  GIAO_HANG_LICH_TONG: "/giao-hang/lich-tong",
  // 🔹 Tiện dụng: route đổi trạng thái cũ (PATCH)
  GIAO_HANG_TRANG_THAI: (id: number) => `/giao-hang/${id}/trang-thai`,
  // 🔹 API mới: gửi SMS + đổi trạng thái (POST)
  GIAO_HANG_NOTIFY_AND_STATUS: (id: number) => `/giao-hang/${id}/notify-and-set-status`,

  // ================================
  // ✅✅ MỚI: NHÂN SỰ (HR)
  // ================================
  NHAN_SU: "/nhan-su",

  // Chấm công (GPS)
  NHAN_SU_CHAM_CONG_CHECKIN: "/nhan-su/cham-cong/checkin",   // POST
  NHAN_SU_CHAM_CONG_CHECKOUT: "/nhan-su/cham-cong/checkout", // POST
  NHAN_SU_CHAM_CONG_ME: "/nhan-su/cham-cong/me",             // GET
  NHAN_SU_CHAM_CONG_ADMIN: "/nhan-su/cham-cong",             // GET

  // 🔹 Đơn từ (xin nghỉ phép)
  NHAN_SU_DON_TU: "/nhan-su/don-tu",               // GET (admin list) / POST (create)
  NHAN_SU_DON_TU_MY: "/nhan-su/don-tu/my",         // GET (đơn của tôi)
  // /nhan-su/don-tu/${id}/approve  (PATCH)
  // /nhan-su/don-tu/${id}/reject   (PATCH)
  // /nhan-su/don-tu/${id}/cancel   (PATCH)

  // 🔹 Bảng công
  NHAN_SU_BANG_CONG: "/nhan-su/bang-cong",                     // GET (admin xem 1 user)
  NHAN_SU_BANG_CONG_MY: "/nhan-su/bang-cong/my",               // GET (của tôi)
  NHAN_SU_BANG_CONG_RECOMPUTE: "/nhan-su/bang-cong/recompute", // POST
  NHAN_SU_BANG_CONG_LOCK: "/nhan-su/bang-cong/lock",           // PATCH
  NHAN_SU_BANG_CONG_UNLOCK: "/nhan-su/bang-cong/unlock",       // PATCH
  NHAN_SU_BANG_CONG_RECOMPUTE_ALL: "/nhan-su/bang-cong/recompute-all", // POST

  // 🔹 Holiday (ngày lễ)
  NHAN_SU_HOLIDAY: "/nhan-su/holiday", // GET/POST; PATCH/DELETE kèm id

  // =================================
  // ✅ NEW: Expense Categories (CHA → CON)
  // =================================
  EXPENSE_CATEGORIES_PARENTS: "/expense-categories/parents", // ✅ NEW
  EXPENSE_CATEGORIES_OPTIONS: (parentCode: string) =>
    `/expense-categories/options?parent_code=${parentCode}`,  // ✅ NEW

  // ========================
  // Báo cáo Quản trị (API)
  // ========================
  BAO_CAO_QUAN_TRI: "/bao-cao-quan-tri",
  BAO_CAO_KQKD: "/bao-cao-quan-tri/kqkd",
  BAO_CAO_KQKD_DETAIL: "/bao-cao-quan-tri/kqkd-detail",
  BAO_CAO_KQKD_EXPORT: "/bao-cao-quan-tri/kqkd-export",

  // ==========================================
  // ✅✅ MỚI: CSKH → Điểm thành viên (API BE)
  // ==========================================
  CSKH_POINTS_EVENTS: "/cskh/points/events", // GET: list biến động (filter)

  CSKH_POINTS_EVENTS_BY_CUSTOMER: (khachHangId: number | string) =>
    `/cskh/points/customers/${khachHangId}/events`, // GET: lịch sử theo KH

  CSKH_POINTS_SEND_ZNS: (eventId: number | string) =>
    `/cskh/points/events/${eventId}/send-zns`, // POST: gửi ZNS 1 lần/biến động
  CSKH_POINTS_RESYNC: "/cskh/points/resync",
} as const;

export const URL_CONSTANTS = {
  LOGIN: "/admin",
  DASHBOARD: "/admin/dashboard",

  NGUOI_DUNG: "/admin/quan-ly-nguoi-dung/nguoi-dung",
  VAI_TRO: "/admin/quan-ly-nguoi-dung/vai-tro",

  FORGOT_PASSWORD: "/admin/forgot-password",
  CAU_HINH_CHUNG: "/admin/thiet-lap-he-thong/cau-hinh-chung",
  THOI_GIAN_LAM_VIEC: "/admin/thiet-lap-he-thong/thoi-gian-lam-viec",
  VERIFY_OTP: "/admin/verify-otp",
  PROFILE: "/admin/profile",
  LICH_SU_IMPORT: "/admin/lich-su-import",

  LOAI_KHACH_HANG: "/admin/quan-ly-khach-hang/loai-khach-hang",
  KHACH_HANG: "/admin/quan-ly-khach-hang/khach-hang",

  // ✅ MỚI: URL trang Khách hàng vãng lai
  KHACH_HANG_VANG_LAI: "/admin/quan-ly-khach-hang/khach-hang-vang-lai",

  NHA_CUNG_CAP: "/admin/quan-ly-san-pham/nha-cung-cap",
  DANH_MUC_SAN_PHAM: "/admin/quan-ly-san-pham/danh-muc-san-pham",
  DON_VI_TINH: "/admin/quan-ly-san-pham/don-vi-tinh",
  SAN_PHAM: "/admin/quan-ly-san-pham/san-pham",

  PHIEU_NHAP_KHO: "/admin/quan-ly-kho/phieu-nhap-kho",
  QUAN_LY_TON_KHO: "/admin/quan-ly-kho/quan-ly-ton-kho",
  PHIEU_CHI: "/admin/quan-ly-thu-chi/phieu-chi",
  QUAN_LY_BAN_HANG: "/admin/quan-ly-ban-hang",
  PHIEU_XUAT_KHO: "/admin/quan-ly-kho/phieu-xuat-kho",
  PHIEU_THU: "/admin/quan-ly-thu-chi/phieu-thu",

  CONG_THUC_SAN_XUAT: "/admin/quan-ly-san-xuat/cong-thuc-san-xuat",
  SAN_XUAT: "/admin/quan-ly-san-xuat/san-xuat",

  // ✅ MỚI: URL trang Quản lý giao hàng
  QUAN_LY_GIAO_HANG: "/admin/quan-ly-giao-hang",

  // =================================
  // ✅✅ MỚI: URL Nhân sự (HR)
  // =================================
  QUAN_LY_NHAN_SU: "/admin/quan-ly-nhan-su",
  NHAN_SU_CHAM_CONG: "/admin/quan-ly-nhan-su/cham-cong",
  NHAN_SU_CHAM_CONG_ADMIN: "/admin/quan-ly-nhan-su/duyet-cham-cong",

  // 🔹 Đơn từ
  NHAN_SU_DON_TU_MY: "/admin/quan-ly-nhan-su/don-tu-cua-toi",
  NHAN_SU_DON_TU_QUAN_LY: "/admin/quan-ly-nhan-su/don-tu",

  // 🔹 Bảng công
  NHAN_SU_BANG_CONG_MY: "/admin/quan-ly-nhan-su/bang-cong-cua-toi",
  NHAN_SU_BANG_CONG_QUAN_LY: "/admin/quan-ly-nhan-su/bang-cong",

  // 🔹 Holiday (ngày lễ)
  NHAN_SU_HOLIDAY: "/admin/quan-ly-nhan-su/holiday",

  // ... cuối nhóm hiện tại:
  // ========================
  // Báo cáo Quản trị
  // ========================
  BAO_CAO_QUAN_TRI: "/admin/bao-cao-quan-tri",
  BAO_CAO_KQKD: "/admin/bao-cao-quan-tri/kqkd",

  // ==========================================
  // ✅✅ MỚI: URL CSKH → Điểm thành viên (FE)
  // ==========================================
  CSKH: "/admin/cham-soc-khach-hang",
  CSKH_POINTS: "/admin/cham-soc-khach-hang/diem-thanh-vien",
} as const;
