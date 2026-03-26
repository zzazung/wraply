import { Routes, Route } from "react-router-dom";

import { EntryRoute } from "./routes/EntryRoute";

import PublicLayout from "@/layouts/PublicLayout";
import ProtectedLayout from "@/layouts/ProtectedLayout";

import { publicRoutes } from "./routes/publicRoutes";
import { protectedRoutes } from "./routes/protectedRoutes";

export default function Router(){

  return(

    <Routes>

      {/* 기본 진입 */}
      <Route path="/" element={<EntryRoute />} />

      {/* 🔥 Public (sidebar 없음) */}
      <Route element={<PublicLayout />}>
        {publicRoutes}
      </Route>

      {/* 🔥 Protected (sidebar 있음) */}
      <Route element={<ProtectedLayout />}>
        {protectedRoutes}
      </Route>

      {/* fallback */}
      <Route path="*" element={<EntryRoute />} />

    </Routes>

  );

}