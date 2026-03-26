// src/store/agent.ts

import { create } from "zustand";

/* ---------------- 타입 ---------------- */

interface StepState{
  step:string;
  status:"running" | "done" | "fail";
  output?:any;
  stream?:string;
}

interface AgentJob{
  jobId:string;
  steps:StepState[];
}

interface AgentState{

  jobId:string | null;

  jobs:Record<string,AgentJob>;

  setJob:(id:string)=>void;

  addEvent:(msg:any)=>void;
  appendStream:(msg:any)=>void;

  reset:()=>void;

}

/* ---------------- store ---------------- */

export const useAgentStore = create<AgentState>((set)=>({

  jobId:null,

  jobs:{},

  /* 실행 시작 */

  setJob:(id)=>set({
    jobId:id,
    jobs:{
      [id]:{
        jobId:id,
        steps:[]
      }
    }
  }),

  /* 이벤트 처리 */

  addEvent:(msg)=>set(state=>{

    if (!msg.jobId || msg.jobId === "undefined") return state;

    const prevJob = state.jobs[msg.jobId] || {
      jobId:msg.jobId,
      steps:[]
    };

    let steps = [...prevJob.steps];

    let stepIndex = steps.findIndex(s => s.step === msg.step);

    /* STEP_START */

    if(msg.event === "STEP_START"){

      if (steps.some(s => s.step === msg.step)){
        return state;
      }

      steps = [
        ...steps,
        {
          step:msg.step,
          status:"running"
        }
      ];

    }

    /* STEP_DONE */

    if(msg.event === "STEP_DONE"){

      if (stepIndex === -1){
        steps = [
          ...steps,
          {
            step:msg.step,
            status:"done",
            output:msg.output
          }
        ];
      } else {
        steps = steps.map((s,i)=>
          i === stepIndex
            ? { ...s, status:"done", output:msg.output }
            : s
        );
      }

    }

    /* STEP_FAILED */

    if(msg.event === "STEP_FAILED"){

      if (stepIndex !== -1){
        steps = steps.map((s,i)=>
          i === stepIndex
            ? { ...s, status:"fail" }
            : s
        );
      }

    }

    return {
      jobs:{
        ...state.jobs,
        [msg.jobId]:{
          ...prevJob,
          steps
        }
      }
    };

  }),

  /* streaming */

  appendStream:(msg)=>set(state=>{

    if (!msg.jobId || msg.jobId === "undefined") return state;

    const prevJob = state.jobs[msg.jobId];
    if(!prevJob) return state;

    let hasStep = false;

    const steps = prevJob.steps.map(s => {

      if(s.step !== msg.step) return s;

      hasStep = true;

      return {
        ...s,
        stream:(s.stream || "") + msg.token
      };

    });

    /* step 없으면 자동 생성 (중요) */

    const nextSteps = hasStep
      ? steps
      : [
          ...steps,
          {
            step:msg.step,
            status:"running",
            stream:msg.token
          }
        ];

    return {
      jobs:{
        ...state.jobs,
        [msg.jobId]:{
          ...prevJob,
          steps:nextSteps
        }
      }
    };

  }),

  reset:()=>set({
    jobId:null,
    jobs:{}
  })

}));