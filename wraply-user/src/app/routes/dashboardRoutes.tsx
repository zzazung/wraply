import { Route } from "react-router-dom";

import DashboardPage from "@/pages/dashboard/DashboardPage";

export const dashboardRoutes = (

  <Route
    path="/"
    element={<DashboardPage />}
  />

);