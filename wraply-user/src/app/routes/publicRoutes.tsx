import { Route } from "react-router-dom";

import GuestGuard from "@/components/auth/GuestGuard";
import AuthLayout from "@/components/layout/AuthLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ProjectPage from "@/pages/projects/ProjectPage";

import { installRoutes } from "./installRoutes";

export const publicRoutes = (

  <>

    {/* 🔐 로그인/회원가입 */}
    <Route element={<GuestGuard />}>

      <Route element={<AuthLayout />}>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

      </Route>

    </Route>

    {/* 🔥 프로젝트 선택 (핵심 추가) */}
    <Route
      path="/projects"
      element={<ProjectPage />}
    />

    {/* install */}
    {installRoutes}

  </>

);