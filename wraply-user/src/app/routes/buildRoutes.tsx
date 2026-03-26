import { Route } from "react-router-dom";

import BuildCenterPage from "@/pages/builds/BuildCenterPage";
import AppBuildPage from "@/pages/app-build/AppBuildPage";
import BuildHistoryPage from "@/pages/builds/BuildHistoryPage";
import BuildDetailPage from "@/pages/builds/BuildDetailPage";
import BuildPage from "@/pages/builds/BuildPage";

export const buildRoutes = (

  <>

    {/* 🔥 앱 빌드 Wizard */}
    <Route
      path="/app-build"
      element={<AppBuildPage />}
    />

    <Route
      path="/builds"
      element={<BuildCenterPage />}
    />

    <Route
      path="/build-history"
      element={<BuildHistoryPage />}
    />

    <Route
      path="/build-history/:jobId"
      element={<BuildDetailPage />}
    />

    <Route
      path="/builds/:jobId"
      element={<BuildPage />}
    />

  </>

);