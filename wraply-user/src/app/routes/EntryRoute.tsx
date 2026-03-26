import { Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

export function EntryRoute(){

  const token = useAuthStore((s)=>s.token);

  const project = useProjectStore((s)=>s.currentProject);
  const recent = useProjectStore((s)=>s.recentProject);

  const setProject = useProjectStore((s)=>s.setCurrentProject);

  // 🔥 상태 복구는 effect에서
  useEffect(()=>{
    if (!project && recent){
      setProject(recent);
    }
  },[project, recent]);

  // 로그인 안됨
  if (!token){
    return <Navigate to="/login" replace />;
  }

  // 프로젝트 없음 → projects로
  if (!project && !recent){
    return <Navigate to="/projects" replace />;
  }

  // project 있거나 recent 복구 예정 → dashboard
  return <Navigate to="/dashboard" replace />;

}