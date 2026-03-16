import { useEffect,useState } from "react";

import PageHeader from "@/components/layout/PageHeader";

import { fetchProjects } from "@/services/projects";

import type { Project } from "@/types/project";

export default function DashboardPage(){

  const [projects,setProjects] = useState<Project[]>([]);

  useEffect(()=>{

    async function load(){

      const data = await fetchProjects();

      setProjects(data);

    }

    load();

  },[]);

  return(

    <div className="space-y-6">

      {/* <h1 className="text-2xl font-semibold">

        대시보드

      </h1> */}

      <PageHeader
        title="대시보드"
      />

      <div
        className="
        grid
        grid-cols-3
        gap-6
        "
      >

        <StatCard
          title="프로젝트"
          value={projects.length}
        />

        <StatCard
          title="빌드 성공률"
          value="92%"
        />

        <StatCard
          title="최근 빌드"
          value="12"
        />

      </div>

    </div>

  );

}

function StatCard({

  title,
  value

}:{

  title:string
  value:string | number

}){

  return(

    <div
      className="
      bg-card
      border
      border-border
      rounded-lg
      p-6
      "
    >

      <div className="text-sm text-muted-foreground">

        {title}

      </div>

      <div className="text-2xl font-semibold mt-2">

        {value}

      </div>

    </div>

  );

}