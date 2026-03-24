import { Navigate, Route } from "react-router-dom";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import AgentPlayground from "@/pages/AgentPlayground";

export const dashboardRoutes = (

  <>

    <Route
      path="/"
      element={<Navigate to="/dashboard" replace />}
    />

    <Route
      path="/dashboard"
      element={<DashboardPage />}
    />

    {/* 🔥 Agent 추가 */}

    <Route
      path="/agent"
      element={<AgentPlayground />}
    />

  </>

);