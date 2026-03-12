import { Outlet } from "react-router-dom";

export default function InstallLayout(){

  return(

    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">

      <div className="w-full max-w-lg">

        <Outlet />

      </div>

    </div>

  );

}