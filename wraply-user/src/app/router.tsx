import { Routes, Route } from "react-router-dom";

import { publicRoutes } from "./routes/publicRoutes";
import { protectedRoutes } from "./routes/protectedRoutes";

import { EntryRoute } from "./routes/EntryRoute";

export default function Router(){

  return(

    <Routes>

      {/* 기본 진입 */}
      <Route path="/" element={<EntryRoute />} />

      {/* public */}
      {publicRoutes}

      {/* protected */}
      {protectedRoutes}

      {/* fallback */}
      <Route path="*" element={<EntryRoute />} />

    </Routes>

  );

}