import api from "./api";

import type { Build } from "@/types/build";

/* 🔥 transform (핵심) */

function transformBuild(b:any):Build{

  return {
    jobId: b.job_id,
    projectId: b.project_id,
    appName: b.app_name,
    platform: b.platform,
    packageName: b.package_name,
    url: b.url,
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    finishedAt: b.finished_at,
    error: b.error
  };

}

/* 프로젝트 빌드 목록 */

export async function fetchProjectBuilds(
  projectId:string
):Promise<Build[]>{

  const res = await api.get(`/projects/${projectId}/builds`);

  return res.data.items.map(transformBuild);

}

/* Job 상세 */

export async function getJob(
  jobId:string
):Promise<Build>{

  const res = await api.get(`/jobs/${jobId}`);

  return transformBuild(res.data);

}

/* 🔥 빌드 요청 */

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

export async function fetchRecentBuilds():Promise<Build[]>{

  const res = await api.get("/jobs");

  return res.data.items.map(transformBuild);

}

export async function fetchJobLogs(jobId:string):Promise<string[]>{

  const res = await api.get(`/jobs/${jobId}/log`, {
    responseType: "text" // 🔥 중요
  });

  const text = res.data;

  return text.split("\n").filter(Boolean);

}

export async function fetchArtifacts(jobId:string){

  const res = await api.get(`/jobs/${jobId}/artifacts`);

  return res.data.items;

}
