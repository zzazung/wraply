import { Routes } from "react-router-dom";

import { publicRoutes } from "./routes/publicRoutes";
import { protectedRoutes } from "./routes/protectedRoutes";

export default function Router(){

  return(

    <Routes>

      {publicRoutes}

      {protectedRoutes}

    </Routes>

  );

}