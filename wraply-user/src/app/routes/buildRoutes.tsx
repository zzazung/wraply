import { Route } from "react-router-dom";

import BuildCenterPage from "@/pages/builds/BuildCenterPage";
import BuildPage from "@/pages/builds/BuildPage";

export const buildRoutes = (

  <>

    <Route
      path="/builds"
      element={<BuildCenterPage />}
    />

    <Route
      path="/builds/:jobId"
      element={<BuildPage />}
    />

  </>

);