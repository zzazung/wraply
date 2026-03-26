import { Navigate, Route } from "react-router-dom";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import AgentChat from "@/pages/AgentChat";
import AgentPlayground from "@/pages/AgentPlayground";

export const dashboardRoutes = (

  <>

    <Route
      path="/dashboard"
      element={<DashboardPage />}
    />

    <Route path="/agent">
      <Route index element={<AgentPlayground />} />
      <Route path="chat" element={<AgentChat />} />
    </Route>

  </>

);