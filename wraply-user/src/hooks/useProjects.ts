import { useEffect, useState } from "react";
import { fetchProjects as fetchProjectsApi } from "@/services/projects";

import type { Project } from "@/types/project";

export function useProjects(){

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {

    try{

      setLoading(true);

      const data = await fetchProjectsApi();

      setProjects(data);

    }catch(err){

      console.error("[useProjects] error", err);

    }finally{

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchProjects();

  }, []);

  return {
    projects,
    loading,
    fetchProjects
  };

}