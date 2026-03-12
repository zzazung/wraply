import { Route } from "react-router-dom";

import InstallPage from "@/pages/install/InstallPage";

export const installRoutes = (

  <Route
    path="/install/:artifactId"
    element={<InstallPage />}
  />

);