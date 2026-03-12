import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import BuildHeader from "@/components/build/BuildHeader";
import BuildProgress from "@/components/build/BuildProgress";
import BuildTimeline from "@/components/build/BuildTimeline";
import BuildLogViewer from "@/components/build/BuildLogViewer";
import BuildArtifacts from "@/components/build/BuildArtifacts";

import { getJob } from "@/services/builds";
import type { BuildJob } from "@/types/build";

export default function BuildDetailPage(){

  const { jobId } = useParams();

  const [job,setJob] = useState<BuildJob | null>(null);

  const [loading,setLoading] = useState(true);

  const [error,setError] = useState<string | null>(null);

  async function load(){

    if(!jobId) return;

    try{

      setLoading(true);

      const data = await getJob(jobId);

      setJob(data);

    }catch(e){

      setError("빌드 정보를 불러오지 못했습니다.");

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    load();

    const timer = setInterval(load,5000);

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

      <BuildHeader job={job} />

      <BuildProgress job={job} />

      <BuildTimeline job={job} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BuildLogViewer jobId={job.id} />

        <BuildArtifacts jobId={job.id} />

      </div>

    </div>

  );

}