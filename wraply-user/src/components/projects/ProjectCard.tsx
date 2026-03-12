import { useNavigate } from "react-router-dom";

import { deleteProject } from "@/services/projects";

import type { Project } from "@/types/project";

export default function ProjectCard({

  project,
  onDeleted

}:{

  project:Project;
  onDeleted:()=>void;

}){
  // console.log(JSON.stringify(project));

  const navigate = useNavigate();

  async function handleDelete(){

    const ok = confirm("프로젝트를 삭제하시겠습니까?");

    if(!ok) return;

    await deleteProject(project.id);

    onDeleted();

  }

  return(

    <div
      className="
      bg-card
      border
      border-border
      rounded-lg
      p-6
      space-y-4
      hover:shadow
      transition
      "
    >

      <div className="flex items-center justify-between">

        <div className="font-medium">

          {project.name}

        </div>

        {/* <div className="text-xs text-muted-foreground">

          {project.platform}

        </div> */}

      </div>

      <div className="text-xs text-muted-foreground break-all">

        {project.serviceUrl}

      </div>

      <div className="flex items-center justify-between pt-2">

        <button
          onClick={() => {

            if(!project?.id) return;

            navigate(`/projects/${project.id}`);

          }}
          className="
          text-primary
          text-sm
          hover:underline
          "
        >
          프로젝트 보기
        </button>

        <button
          onClick={handleDelete}
          className="
          text-destructive
          text-sm
          hover:underline
          "
        >

          삭제

        </button>

      </div>

    </div>

  );

}