/* src/components/responsive/MobileShell.tsx */

import MobileSiderDrawer from "./MobileSiderDrawer";
import MobileMenuFab from "./MobileMenuFab";

/**
 * Mount 1 lần ở cấp ứng dụng:
 * - Drawer menu cho mobile
 * - Nút nổi mở Drawer (không đụng HeaderMain / SiderMain)
 */
export default function MobileShell() {
  return (
    <>
      <MobileSiderDrawer />
      <MobileMenuFab />
    </>
  );
}
