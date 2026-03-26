import { Route } from "react-router-dom";

import ProjectPage from "@/pages/projects/ProjectPage";
import ProjectCreatePage from "@/pages/projects/ProjectCreatePage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";

export const projectRoutes = (

  <Route path="/projects">

    {/* 프로젝트 목록 */}
    <Route index element={<ProjectPage />} />

    {/* 프로젝트 생성 */}
    <Route path="new" element={<ProjectCreatePage />} />

    {/* 프로젝트 상세 */}
    <Route path=":projectId" element={<ProjectDetailPage />} />

  </Route>

);