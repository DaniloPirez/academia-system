import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Topbar from "./Topbar";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}