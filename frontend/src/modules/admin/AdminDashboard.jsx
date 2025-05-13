import { useState } from "react";
import SidePanel from "./component/SidePanel";
import DashboardOverview from "./component/DashboardOverview";
import UserManagement from "./component/UserManagement";
import RoleManagement from "./component/RoleManagement";
import SystemConfiguration from "./component/SystemConfiguration";
import PrivacySettings from "./component/PrivacySettings";
import ComplianceMonitoring from "./component/ComplianceMonitoring";

// CSS
import "./styles/AdminDashboard.css";

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [activeModule, setActiveModule] = useState("dashboard");

  const renderMainContent = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UserManagement />;
      case "roles":
        return <RoleManagement />;
      case "config":
        return <SystemConfiguration />;
      case "privacy":
        return <PrivacySettings />;
      case "compliance":
        return <ComplianceMonitoring />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="container-fluid admin-dashboard">
      <div className="row">
        <div className="col-md-3 col-lg-2">
          <div className="side-panel-container">
            <SidePanel
              user={user}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
          </div>
        </div>
        <div className="col-md-9 col-lg-10">
          <div className="main-content-container">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
