import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "@/components/layout/PageHeader";
import ProjectHeader from "@/components/projects/ProjectHeader";
import BuildLauncher from "@/components/build/BuildLauncher";
import BuildHistoryTable from "@/components/build/BuildHistoryTable";

import { fetchProject } from "@/services/projects";
import { fetchProjectBuilds } from "@/services/builds";

import type { Project } from "@/types/project";
import type { BuildJob } from "@/types/build";

export default function ProjectDetailPage(){

  const { projectId } = useParams();

  const [project,setProject] = useState<Project | null>(null);

  const [builds,setBuilds] = useState<BuildJob[]>([]);

  const [loading,setLoading] = useState(true);

  const [error,setError] = useState<string | null>(null);

  async function load(){

    if(!projectId) return;

    try{

      setLoading(true);

      const p = await fetchProject(projectId);

      const b = await fetchProjectBuilds(projectId);

      setProject(p);

      setBuilds(b);

    }catch(e){

      setError("프로젝트 정보를 불러오지 못했습니다.");

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    load();

  },[projectId]);

  if(loading){

    return(

      <div className="text-muted-foreground">

        프로젝트 정보를 불러오는 중입니다...

      </div>

    );

  }

  if(error){

    return(

      <div className="text-destructive">

        {error}

      </div>

    );

  }

  if(!project){

    return(

      <div className="text-muted-foreground">

        프로젝트를 찾을 수 없습니다.

      </div>

    );

  }

  return(

    <div className="space-y-6">

      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label:"프로젝트", href:"/projects" },
          { label:project.name }
        ]}
      />

      <ProjectHeader project={project} />

      <BuildLauncher projectId={project.id} onBuilt={load} />

      <BuildHistoryTable builds={builds} />

    </div>

  );

}