import { useEffect, useState } from "react";

import { useBuildStore } from "@/stores/buildStore";

import {
  getJob,
  fetchRecentBuilds as fetchRecentBuildsApi
} from "@/services/builds";

import type { Build } from "@/types/build";

export function useBuild(jobId?:string){

  const build = useBuildStore((s)=> jobId ? s.builds[jobId] : undefined);
  const buildsMap = useBuildStore((s)=>s.builds);

  const updateBuild = useBuildStore((s)=>s.updateBuild);

  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 단일 build 로드
   */
  useEffect(()=>{

    if (!jobId) return;

    async function load(){

      try{

        const job = await getJob(jobId);

        updateBuild(job);

      }catch(err){

        console.error("[useBuild] getJob error", err);

      }

    }

    load();

  },[jobId]);

  /**
   * 최근 builds 조회 (Dashboard용)
   */
  const fetchRecentBuilds = async () => {

    try{

      setLoading(true);

      const data = await fetchRecentBuildsApi();

      setBuilds(data);

      // store에도 반영 (중요)
      data.forEach(b => updateBuild(b));

    }catch(err){

      console.error("[useBuild] fetchRecentBuilds error", err);

    }finally{

      setLoading(false);

    }

  };

  return {
    build,
    builds,
    loading,
    fetchRecentBuilds
  };

}