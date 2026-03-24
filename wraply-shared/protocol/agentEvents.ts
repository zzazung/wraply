// shared/protocol/agentEvents.ts

export type AgentWSMessage =

  | {
      type:"agent_event";
      event:"STEP_START";
      jobId:string;
      step:string;
    }

  | {
      type:"agent_event";
      event:"STEP_DONE";
      jobId:string;
      step:string;
      output:any;
    }

  | {
      type:"agent_event";
      event:"STEP_FAIL";
      jobId:string;
      step:string;
      error:string;
    }

  | {
      type:"agent_event";
      event:"AGENT_DONE";
      jobId:string;
    };