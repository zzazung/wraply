// src/store/agent.ts

import { create } from "zustand";

interface Step{
  step:string;
  event:string;
}

interface Log{
  task:string;
  message:string;
}

interface AgentState{

  jobId:string | null;

  steps:Step[];
  logs:Log[];

  setJob:(id:string)=>void;

  addStep:(s:Step)=>void;
  addLog:(l:Log)=>void;

  reset:()=>void;

}

export const useAgentStore = create<AgentState>((set)=>({

  jobId:null,

  steps:[],
  logs:[],

  setJob:(id)=>set({
    jobId:id,
    steps:[],
    logs:[]
  }),

  addStep:(s)=>set(state=>({
    steps:[...state.steps, s]
  })),

  addLog:(l)=>set(state=>({
    logs:[...state.logs, l]
  })),

  reset:()=>set({
    jobId:null,
    steps:[],
    logs:[]
  })

}));