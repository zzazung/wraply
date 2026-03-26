import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function AppLayout(){

  return(

    <div className="h-screen flex overflow-hidden bg-background text-foreground">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Header />

        {/* 🔥 핵심: 여기 수정 */}
        <main className="flex-1 overflow-auto">

          <div className="p-6 space-y-4">

            <Outlet />

          </div>

        </main>

      </div>

    </div>

  );

}