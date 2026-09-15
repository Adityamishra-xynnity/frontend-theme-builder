
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar />

      <div className="flex">

        <Sidebar />

        <main className="flex-1 min-w-0 p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

