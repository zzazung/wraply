import { Route } from "react-router-dom";

import GuestGuard from "@/components/auth/GuestGuard";
import AuthLayout from "@/components/layout/AuthLayout";

import LoginPage from "@/pages/auth/LoginPage";
import { installRoutes } from "./installRoutes";

export const publicRoutes = (

  <>

    <Route element={<GuestGuard />}>

      <Route element={<AuthLayout />}>

        <Route
          path="/login"
          element={<LoginPage />}
        />

      </Route>

    </Route>

    {installRoutes}

  </>

);