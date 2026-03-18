import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";

export function EntryRoute(){

  const token = useAuthStore((s)=>s.token);

  if (token){
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;

}