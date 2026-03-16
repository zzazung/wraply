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

  const res = await api.get<Build>(

    `/jobs/${jobId}`

  );

  return res.data;

}

/* 빌드 요청 */

export interface BuildRequestPayload{

  platform:"android"|"ios";

  appName:string;

  packageName:string;

  url:string;

  scheme?:string | null;

}

export async function requestBuild(
  projectId:string,
  payload:BuildRequestPayload
){

  const res = await api.post(

    "/jobs",
    {
      projectId,
      ...payload
    }

  );

  return res.data;

}