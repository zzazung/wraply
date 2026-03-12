import { Route } from "react-router-dom";

import BuildCenterPage from "@/pages/builds/BuildCenterPage";
import BuildDetailPage from "@/pages/builds/BuildDetailPage";

export const buildRoutes = (

  <>

    <Route
      path="/builds"
      element={<BuildCenterPage />}
    />

    <Route
      path="/builds/:jobId"
      element={<BuildDetailPage />}
    />

  </>

);