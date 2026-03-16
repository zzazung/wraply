import { Navigate, Route } from "react-router-dom";

import DashboardPage from "@/pages/dashboard/DashboardPage";

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

  </>

);