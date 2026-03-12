import { Route } from "react-router-dom";

import AuthGuard from "@/components/auth/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

import { dashboardRoutes } from "./dashboardRoutes";
import { projectRoutes } from "./projectRoutes";
import { buildRoutes } from "./buildRoutes";
import { accountRoutes } from "./accountRoutes";
import { certificateRoutes } from "./certificateRoutes";

export const protectedRoutes = (

  <Route element={<AuthGuard />}>

    <Route element={<AppLayout />}>

      {dashboardRoutes}

      {projectRoutes}

      {buildRoutes}

      {accountRoutes}

      {certificateRoutes}

    </Route>

  </Route>

);