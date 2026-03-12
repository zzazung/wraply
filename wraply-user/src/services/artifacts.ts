import api from "./api";

import type { Artifact } from "@/types/artifact";

import type { ApiListResponse } from "@/types/api";

export async function fetchArtifacts(jobId:string):Promise<Artifact[]>{

  const res = await api.get<ApiListResponse<Artifact>>(
    `/jobs/${jobId}/artifacts`
  );

  return res.data.items;

}

export async function fetchArtifact(artifactId:string):Promise<Artifact>{

  const res = await api.get<Artifact>(
    `/artifacts/${artifactId}`
  );

  return res.data;

}