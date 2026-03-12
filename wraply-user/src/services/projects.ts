import api from "./api";

import type { Project } from "@/types/project";
import type { ApiListResponse } from "@/types/api";

export interface CreateProjectPayload {

  name:string;

  serviceUrl:string;

  platform:"android" | "ios";

  packageName:string;

  scheme?:string;

}

export interface ProjectResponse {

  project:Project;

}

export async function createProject(
  payload:CreateProjectPayload
):Promise<Project>{

  const res = await api.post<Project>(

    "/projects",

    payload

  );

  return res.data;

}

export async function fetchProjects():Promise<Project[]>{

  const res = await api.get<ApiListResponse<Project>>("/projects");

  return res.data.items;

}

export async function fetchProject(
  projectId:string
):Promise<Project>{

  const res = await api.get<ProjectResponse>(

    `/projects/${projectId}`

  );

  return res.data;

}

export async function deleteProject(
  projectId:string
):Promise<void>{

  await api.delete(

    `/projects/${projectId}`

  );

}