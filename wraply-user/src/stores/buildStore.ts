import { create } from "zustand";

import type { Build } from "@/types/build";

interface BuildState{

  builds:Record<string,Build>;

  updateBuild:(build:Build)=>void;

}

export const useBuildStore = create<BuildState>((set)=>({

  builds:{},

  updateBuild:(build)=>set((state)=>({

    builds:{

      ...state.builds,

      [build.jobId]:build

    }

  }))

}));