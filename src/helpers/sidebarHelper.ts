// /* eslint-disable @typescript-eslint/no-explicit-any */
// export const getSidebar = (items: any, phan_quyen: any) => {
//     const phanQuyen = JSON.parse(phan_quyen);

//     const isKeyValid = (key: string): boolean => {
//         return ["dashboard", "lich-su-import"].includes(key);
//     };

//     const checkRole = items.map((item: any) => {
//         if (item.children) {
//             const checkChildren = item.children.filter((child: any) => {
//                 return phanQuyen.some(
//                     (role: any) =>
//                         role.actions.showMenu && role.name === child.key
//                 );
//             });
//             return { ...item, children: checkChildren };
//         } else {
//             if (!isKeyValid(item.key)) {
//                 const data = phanQuyen.filter(
//                     (role: any) =>
//                         role.actions.showMenu && role.name === item.key
//                 );
//                 return data.length > 0 ? item : null;
//             } else {
//                 return item;
//             }
//         }
//     });

//     return checkRole.filter((item: any) =>
//         item?.children ? item.children.length > 0 : item !== null
//     );
// };

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getSidebar = (items: any, phan_quyen: any) => {
  // Nếu null/undefined thì gán mảng rỗng
  if (!phan_quyen) return [];

  let phanQuyen: any[] = [];
  try {
    phanQuyen = JSON.parse(phan_quyen);
  } catch (error) {
    console.error("phan_quyen không hợp lệ:", error, phan_quyen);
    return []; // fallback menu rỗng
  }

  // Top-level luôn hiển thị (giữ nguyên logic gốc)
  const isKeyValid = (key: string): boolean => {
    return ["dashboard", "lich-su-import"].includes(key);
  };

  // ✅ ẨN HẲN các nhóm top-level này (bất kể quyền)
  // -> Ẩn "Quản lý sản xuất" như yêu cầu
  const ALWAYS_HIDE_TOP = ["quan-ly-san-xuat"];

  // ✅ Child whitelist: luôn hiển thị các mục con này
  // -> Dùng để luôn hiện "Báo cáo thu chi"
  // 🔸 BỔ SUNG: "khach-hang-vang-lai" để mục này luôn hiển thị
  // 🔸 ✅ MỚI (tạm để test wiring HR): thêm 2 key chấm công vào whitelist
  const ALWAYS_SHOW_CHILDREN = [
    "bao-cao",
    "bao-cao-kqkd",           // ✅ NEW: luôn hiện tab Báo cáo KQKD
    "khach-hang-vang-lai",
    "nhan-su-cham-cong",        // ✅ MỚI (tạm test)
    "nhan-su-duyet-cham-cong",  // ✅ MỚI (tạm test)
    "diem-thanh-vien",          // << thêm dòng này để luôn hiện menu con
  ];

  // ✅ BỔ SUNG TỐI THIỂU: Alias key menu -> tên module quyền để so khớp showMenu
  // quan-ly-giao-hang sẽ dùng quyền của quan-ly-ban-hang (không đổi permission DB)
  const PERMISSION_ALIAS: Record<string, string> = {
    "quan-ly-giao-hang": "quan-ly-ban-hang",
    // ====== HR (Nhân sự) ======
    "quan-ly-nhan-su": "nhan-su",            // alias parent (an toàn về sau)
    "nhan-su-cham-cong": "nhan-su",
    "nhan-su-duyet-cham-cong": "nhan-su",
    // ✅ BỔ SUNG: các mục HR mới
    "nhan-su-don-tu-cua-toi": "nhan-su",
    "nhan-su-don-tu": "nhan-su",
    "nhan-su-bang-cong-cua-toi": "nhan-su",
    "nhan-su-bang-cong": "nhan-su",
    "nhan-su-holiday": "nhan-su",
     // ====== CSKH (mới) ======
    "cham-soc-khach-hang": "cskh",        // parent menu
    "diem-thanh-vien": "cskh-points",     // child Điểm thành viên
  };

  const checkRole = items.map((item: any) => {
    // Ẩn hoàn toàn nhóm mà bạn không muốn dùng
    if (ALWAYS_HIDE_TOP.includes(item.key)) {
      return null;
    }

    if (item.children) {
      const checkChildren = item.children.filter((child: any) => {
        // Cho phép các child thuộc whitelist luôn hiển thị
        if (ALWAYS_SHOW_CHILDREN.includes(child.key)) return true;

        // So khớp quyền như hiện tại, nhưng có alias nếu cần
        const compareKey = PERMISSION_ALIAS[child.key] ?? child.key;
        return phanQuyen.some(
          (role: any) => role?.actions?.showMenu && role?.name === compareKey
        );
      });
      return { ...item, children: checkChildren };
    } else {
      if (!isKeyValid(item.key)) {
        // So khớp quyền như hiện tại, nhưng có alias nếu cần
        const compareKey = PERMISSION_ALIAS[item.key] ?? item.key;
        const data = phanQuyen.filter(
          (role: any) => role?.actions?.showMenu && role?.name === compareKey
        );
        return data.length > 0 ? item : null;
      } else {
        return item;
      }
    }
  });

  return checkRole.filter((item: any) =>
    item?.children ? item.children.length > 0 : item !== null
  );
};
