import api from "./api";

import type { Build } from "@/types/build";
import type { BuildListResponse } from "@/types/build";

/* 프로젝트 빌드 목록 */

export async function fetchProjectBuilds(
  projectId:string
):Promise<Build[]>{

  const res = await api.get<BuildListResponse>(
    `/projects/${projectId}/builds`
  );

  return res.data.items;

}

/* Job 상세 */

export async function getJob(
  jobId:string
):Promise<Build>{

  const res = await api.get<Build>(`/jobs/${jobId}`);

  return res.data;

}

/* 🔥 빌드 요청 (createJob으로 통일) */

export interface CreateJobPayload{

  projectId:string;

  platform:"android"|"ios";

  appName:string;

  packageName:string;

  url:string;

  scheme?:string | null;

}

export async function createJob(
  payload:CreateJobPayload
){

  const res = await api.post("/jobs", payload);

  return res.data; // { success, jobId }

}

/* 최근 빌드 */

export async function fetchRecentBuilds(){

  const res = await api.get("/jobs");

  return res.data.items;

}