import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumb from "./Breadcrumb";

export default function AppLayout(){

  return(

    <div className="flex min-h-screen bg-background text-foreground">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Header />

        <main className="flex-1 p-6 space-y-4">

          <Breadcrumb />

          <Outlet />

        </main>

      </div>

    </div>

  );

}