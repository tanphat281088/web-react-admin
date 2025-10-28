import { Col, Flex, Row, Tabs } from "antd";
import Heading from "../../components/heading";
import DanhSachSanPham from "./DanhSachSanPham";
import { API_ROUTE_CONFIG } from "../../configs/api-route-config";
import ThemSanPham from "./ThemSanPham";
import { useResponsive } from "../../hooks/useReponsive";
import usePermission from "../../hooks/usePermission";
import DanhSachNguyenLieu from "./DanhSachNguyenLieu";

const path = API_ROUTE_CONFIG.SAN_PHAM;
const title = "Sản phẩm/Nguyên liệu";

const SanPham = () => {
    const { isMobile } = useResponsive();

    const permission = usePermission(path);

    const items = [
        {
            key: "1",
            label: "Danh sách sản phẩm",
            children: (
                <DanhSachSanPham
                    path={path}
                    permission={permission}
                    title={title}
                />
            ),
        },
        {
            key: "2",
            label: "Danh sách nguyên liệu",
            children: (
                <DanhSachNguyenLieu
                    path={path}
                    permission={permission}
                    title={title}
                />
            ),
        },
    ];

    return (
        <>
            <div>
                <Flex
                    vertical={isMobile}
                    justify={isMobile ? "center" : "space-between"}
                    align={isMobile ? "" : "center"}
                    style={{ marginBottom: isMobile ? 20 : 0 }}
                >
                    <Heading title={title} />
                    <Col
                        span={isMobile ? 24 : 12}
                        style={{
                            display: "flex",
                            justifyContent: isMobile ? "" : "flex-end",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        {/* {permission.export && (
                          <ExportTable
                              columns={columns}
                              path={path}
                              params={query}
                          />
                      )} */}
                        {permission.create && (
                            <ThemSanPham path={path} title={title} />
                        )}
                    </Col>
                </Flex>
                <Row>
                    <Col span={24}>
                        {permission.index && <Tabs type="card" items={items} />}
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default SanPham;
