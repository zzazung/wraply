import type { Project } from "@/types/project";

export default function ProjectHeader({

  project

}:{

  project:Project;

}){
  // console.log(JSON.stringify(project));

  return(

    <div className="bg-card border border-border rounded-lg p-6 space-y-3">

      <div className="text-xl font-semibold">

        {project.name}

      </div>

      <div className="text-sm text-muted-foreground">

        {project.serviceUrl}

      </div>

      <div className="text-xs text-muted-foreground">

        패키지명: {project.packageName}

      </div>

    </div>

  );

}