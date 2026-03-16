import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "@/components/layout/PageHeader";
import BuildHeader from "@/components/build/BuildHeader";
import BuildProgress from "@/components/build/BuildProgress";
import BuildTimeline from "@/components/build/BuildTimeline";
import BuildLogViewer from "@/components/build/BuildLogViewer";
import BuildArtifacts from "@/components/build/BuildArtifacts";

import { getJob } from "@/services/builds";
import { fetchProject } from "@/services/projects";

import type { BuildJob } from "@/types/build";
import type { Project } from "@/types/project";

export default function BuildDetailPage(){

  const { jobId } = useParams();

  const [job,setJob] = useState<BuildJob | null>(null);
  const [project,setProject] = useState<Project | null>(null);

  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);

  async function load(isPolling=false){

    if(!jobId) return;

    try{

      if(!isPolling){

        setLoading(true);

      }

      const jobData = await getJob(jobId);

      setJob(jobData);

      if(jobData?.project_id && !project){

        const projectData = await fetchProject(jobData.project_id);

        setProject(projectData);

      }

    }catch(e){

      setError("빌드 정보를 불러오지 못했습니다.");

    }finally{

      if(!isPolling){

        setLoading(false);

      }

    }

  }

  useEffect(()=>{

    load(false);

    const timer = setInterval(()=>{

      load(true);

    },5000);

    return ()=>clearInterval(timer);

  },[jobId]);

  if(loading){

    return(

      <div className="text-muted-foreground">

        빌드 정보를 불러오는 중입니다...

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

  if(!job){

    return(

      <div className="text-muted-foreground">

        빌드 정보를 찾을 수 없습니다.

      </div>

    );

  }

  return(

    <div className="space-y-6">

      <PageHeader
        title="빌드 상세"
        breadcrumbs={[
          { label:"프로젝트", href:"/projects" },

          ...(project
            ? [{ label:project.name, href:`/projects/${project.id}` }]
            : []),

          { label:"빌드 상세" }
        ]}
      />

      <BuildHeader
        job={job}
        project={project ?? undefined}
      />

      <BuildProgress build={job} />

      <BuildTimeline build={job} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BuildLogViewer jobId={job.id} />

        <BuildArtifacts jobId={job.id} />

      </div>

    </div>

  );

}