import { Route } from "react-router-dom";

import CertificatesPage from "@/pages/certificates/CertificatesPage";

export const certificateRoutes = (

  <Route
    path="/certificates"
    element={<CertificatesPage />}
  />

);