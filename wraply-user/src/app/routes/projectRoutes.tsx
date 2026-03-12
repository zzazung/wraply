import { Route } from "react-router-dom";

import ProjectPage from "@/pages/projects/ProjectPage";
import ProjectCreatePage from "@/pages/projects/ProjectCreatePage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";

export const projectRoutes = (

  // <>

  //   <Route
  //     path="/projects"
  //     element={<ProjectPage />}
  //   />

  //   <Route
  //     path="/projects/create"
  //     element={<ProjectCreatePage />}
  //   />

  //   <Route
  //     path="/projects/:projectId"
  //     element={<ProjectDetailPage />}
  //   />

  // </>

  <Route path="/projects">

    <Route
      index
      element={<ProjectPage />}
    />

    <Route
      path="create"
      element={<ProjectCreatePage />}
    />

    <Route
      path=":projectId"
      element={<ProjectDetailPage />}
    />

  </Route>

);