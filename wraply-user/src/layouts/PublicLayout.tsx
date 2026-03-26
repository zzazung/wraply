import { Outlet } from "react-router-dom";
import PublicHeader from "@/components/layout/PublicHeader";

export default function PublicLayout(){

  return(

    <div className="min-h-screen flex flex-col bg-background">

      <PublicHeader />

      <div className="pt-10 px-8">

        {/* 🔥 핵심 수정 */}
        <div className="w-full max-w-screen-2xl mx-auto">

          <Outlet />

        </div>

      </div>

    </div>

  );

}