import { Outlet } from "react-router-dom";
import MobileBottomNav from "./MobileBottomNav";
import DesktopSidebar from "./DesktopSidebar";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <DesktopSidebar />

      <main className="app-content">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}