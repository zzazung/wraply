// src/stores/projectStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Project{
  id:string;
  name:string;
  bundleId?:string;
}

interface ProjectState{

  currentProject:Project | null;
  recentProject:Project | null;

  setCurrentProject:(p:Project)=>void;
  clearCurrentProject:()=>void;

  setRecentProject:(p:Project)=>void;

}

export const useProjectStore = create<ProjectState>()(

  persist(

    (set)=>({

      currentProject:null,
      recentProject:null,

      setCurrentProject:(p)=>set({
        currentProject:p,
        recentProject:p   // 🔥 자동 기억
      }),

      clearCurrentProject:()=>set({
        currentProject:null
      }),

      setRecentProject:(p)=>set({
        recentProject:p
      })

    }),

    {
      name:"recent-project-storage",

      // 🔥 핵심: recent만 persist
      partialize:(state)=>({
        recentProject:state.recentProject
      })

    }

  )

);