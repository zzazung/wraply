// src/stores/workflowStore.ts

import { create } from "zustand";

export type WorkflowStatus =
  | "idle"
  | "queued"
  | "running"
  | "done"
  | "failed";

interface Step{
  step: string;
  status: WorkflowStatus;
}

interface Log{
  message: string;
  ts?: number;
}

interface WorkflowState{

  workflowId: string | null;

  status: WorkflowStatus;

  steps: Step[];
  logs: Log[];

  /* ---------------- actions ---------------- */

  setWorkflow: (id:string)=>void;

  setStatus: (s:WorkflowStatus)=>void;

  setSteps: (steps:Step[])=>void;
  updateStep: (step:string, status:WorkflowStatus)=>void;

  addLog: (log:Log)=>void;

  reset: ()=>void;

}

export const useWorkflowStore = create<WorkflowState>((set)=>({

  workflowId: null,

  status: "idle",

  steps: [],
  logs: [],

  setWorkflow:(id)=>set({
    workflowId:id,
    status:"queued",
    steps:[],
    logs:[]
  }),

  setStatus:(s)=>set({ status:s }),

  setSteps:(steps)=>set({ steps }),

  updateStep:(step,status)=>set(state=>({

    steps: state.steps.map(s=>
      s.step === step ? { ...s, status } : s
    )

  })),

  addLog:(log)=>set(state=>({
    logs:[...state.logs, log]
  })),

  reset:()=>set({
    workflowId:null,
    status:"idle",
    steps:[],
    logs:[]
  })

}));