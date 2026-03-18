import { useEffect, useState } from "react";

import {
  fetchArtifacts as fetchArtifactsApi,
  getArtifact as getArtifactApi
} from "@/services/artifacts";

import type { Artifact } from "@/types/artifact";

export function useArtifacts(jobId?:string){

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArtifacts = async () => {

    if (!jobId) return;

    try{

      setLoading(true);

      const data = await fetchArtifactsApi(jobId);

      setArtifacts(data);

    }catch(err){

      console.error("[useArtifacts] error", err);

    }finally{

      setLoading(false);

    }

  };

  const getArtifact = async (artifactId:string) => {

    try{

      return await getArtifactApi(artifactId);

    }catch(err){

      console.error("[getArtifact] error", err);
      return null;

    }

  };

  useEffect(() => {

    if (!jobId) return;

    fetchArtifacts();

  }, [jobId]);

  return {
    artifacts,
    loading,
    fetchArtifacts,
    getArtifact
  };

}