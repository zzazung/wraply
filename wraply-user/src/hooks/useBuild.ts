import { useEffect } from "react";

import { useBuildStore } from "@/stores/buildStore";

import { getJob } from "@/services/builds";

export default function useBuild(jobId:string){

  const build = useBuildStore((s)=>s.builds[jobId]);

  const updateBuild = useBuildStore((s)=>s.updateBuild);

  useEffect(()=>{

    async function load(){

      const job = await getJob(jobId);

      updateBuild(job);

    }

    load();

  },[jobId]);

  return build;

}