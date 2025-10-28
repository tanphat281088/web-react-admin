import { Tabs } from "antd";
import BaoCaoKQKD from "./BaoCaoKQKD";

export default function BaoCaoQuanTri() {
  return (
    <Tabs
      defaultActiveKey="kqkd"
      items={[
        { key: "kqkd", label: "Báo cáo KQKD", children: <BaoCaoKQKD /> },
      ]}
    />
  );
}
