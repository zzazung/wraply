import { create } from "zustand";
import type { Build } from "@/types/build";
import { normalizeStatus, STATUS_ORDER } from "../utils/buildStatus";

interface BuildState {

  builds: Record<string, Build>;
  logs: Record<string, string[]>;
  artifacts: Record<string, any[]>;

  updateBuild: (build: Build) => void;
  updateStatus: (jobId: string, status: string) => void;
  appendLog: (jobId: string, log: string) => void;
  setArtifacts:(jobId:string, items:any[])=>void;

}

export function isForwardStatus(prev:string, next:string){

  const prevIdx = STATUS_ORDER.indexOf(prev);
  const nextIdx = STATUS_ORDER.indexOf(next);

  return nextIdx >= prevIdx;

}

export const useBuildStore = create<BuildState>((set) => ({

  builds: {},
  logs: {},
  artifacts: {},

  updateBuild: (build) => set((state) => ({

    builds: {
      ...state.builds,
      [build.jobId]: build
    }

  })),

  updateStatus:(jobId:string, status:string)=>set(state=>{

    const prev = state.builds[jobId];
    if (!prev) return state;

    if (!isForwardStatus(prev.status, status)){
      return state;
    }

    if (prev.status === "finished" || prev.status === "failed"){
      return state;
    }

    return {
      builds:{
        ...state.builds,
        [jobId]:{
          ...prev,
          status: normalizeStatus(status)
        }
      }
    };

  }),

  appendLog: (jobId, log) => set((state) => ({

    logs: {
      ...state.logs,
      [jobId]: [
        ...(state.logs[jobId] || []),
        log
      ]
    }

  })),

  setArtifacts:(jobId, items)=>set((state)=>({
    artifacts:{
      ...state.artifacts,
      [jobId]:items
    }
  }))

}));