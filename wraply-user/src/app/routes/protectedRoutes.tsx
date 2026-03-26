import { Route } from "react-router-dom";

import AuthGuard from "@/components/auth/AuthGuard";
import ProtectedLayout from "@/layouts/ProtectedLayout";

import { dashboardRoutes } from "./dashboardRoutes";
import { buildRoutes } from "./buildRoutes";
import { accountRoutes } from "./accountRoutes";
import { certificateRoutes } from "./certificateRoutes";

export const protectedRoutes = (

  <Route element={<AuthGuard />}>

    {dashboardRoutes}

    {buildRoutes}

    {accountRoutes}

    {certificateRoutes}

  </Route>

);