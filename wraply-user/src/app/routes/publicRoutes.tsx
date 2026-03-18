import { Route } from "react-router-dom";

import GuestGuard from "@/components/auth/GuestGuard";
import AuthLayout from "@/components/layout/AuthLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

import { installRoutes } from "./installRoutes";

export const publicRoutes = (

  <>

    <Route element={<GuestGuard />}>

      <Route element={<AuthLayout />}>

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

      </Route>

    </Route>

    {installRoutes}

  </>

);