// src/services/workflows.ts

import api from "./api";

export async function startWorkflowApi({
  projectId,
  workflow
}:{
  projectId:string;
  workflow:any[];
}){

  const res = await api.post("/workflows/run", {
    projectId,
    workflow
  });

  return res.data;

}

export async function fetchWorkflow(workflowId:string){

  const res = await api.get(`/workflows/${workflowId}`);

  return res.data;

}
