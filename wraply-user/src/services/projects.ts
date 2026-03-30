import api from "./api";

import type { Project } from "@/types/project";
import type { ApiListResponse } from "@/types/api";

function transformProject(p:any):Project{

  const settings = 
    typeof p.settings === "string"
      ? JSON.parse(p.settings)
      : p.settings;

  return {
    id: p.id,
    name: p.name,
    safeName: p.safe_name,
    url: p.url || settings?.url || "",
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };

}

export interface CreateProjectPayload {

  name:string;

  url?:string;

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

  return transformProject(res.data);

}

export async function fetchProjects():Promise<Project[]>{

  const res = await api.get<ApiListResponse<Project>>("/projects");
  // console.log(res);

  // return res.data.items;
  return res.data.items.map(transformProject);

}

export async function fetchProject(
  projectId:string
):Promise<Project>{

  const res = await api.get<ProjectResponse>(

    `/projects/${projectId}`

  );

  return transformProject(res.data);

}

export async function deleteProject(
  projectId:string
):Promise<void>{

  await api.delete(

    `/projects/${projectId}`

  );

}