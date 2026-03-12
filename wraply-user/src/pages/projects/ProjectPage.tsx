import { useEffect,useState } from "react";

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectCreateModal from "@/components/projects/ProjectCreateModal";

import { fetchProjects } from "@/services/projects";

import type { Project } from "@/types/project";

export default function ProjectPage(){

  const [projects,setProjects] = useState<Project[]>([]);

  const [loading,setLoading] = useState(true);

  const [open,setOpen] = useState(false);

  async function load(){

    try{

      setLoading(true);

      const data = await fetchProjects();

      setProjects(data);

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    load();

  },[]);

  return(

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-semibold">

            프로젝트 관리

          </h1>

          <div className="text-sm text-muted-foreground mt-1">

            모바일 웹을 네이티브 앱으로 빌드합니다.

          </div>

        </div>

        <button
          onClick={()=>setOpen(true)}
          className="
          bg-primary
          text-primary-foreground
          px-4
          py-2
          rounded-md
          hover:opacity-90
          transition
          "
        >

          프로젝트 생성

        </button>

      </div>

      {loading && (

        <div className="text-muted-foreground">

          프로젝트를 불러오는 중입니다...

        </div>

      )}

      {!loading && projects.length === 0 && (

        <div className="bg-card border border-border rounded-lg p-10 text-center space-y-3">

          <div className="text-sm text-muted-foreground">

            아직 생성된 프로젝트가 없습니다.

          </div>

          <button
            onClick={()=>setOpen(true)}
            className="
            bg-primary
            text-primary-foreground
            px-4
            py-2
            rounded-md
            hover:opacity-90
            transition
            "
          >

            첫 프로젝트 만들기

          </button>

        </div>

      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {projects.map(project=>(

          <ProjectCard
            key={project.id}
            project={project}
            onDeleted={load}
          />

        ))}

      </div>

      {open && (

        <ProjectCreateModal
          onClose={()=>setOpen(false)}
          onCreated={load}
        />

      )}

    </div>

  );

}