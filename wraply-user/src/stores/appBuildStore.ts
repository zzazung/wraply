// src/stores/appBuildStore.ts

import { create } from "zustand";

const initialState = {
  step:1,

  os:"android",

  appName:"",
  url:"",

  versionName:"1.0.0",
  versionCode:1,

  splash:true,
  primaryColor:"#3b82f6",

  buildStatus:"idle"
};

export const useAppBuildStore = create((set, get)=>({

  ...initialState,

  initFromProject:(project:any)=>set({

    os: project.platform || "android",

    appName: project.name || "",
    url: project.url || "",

    versionName: project.settings?.versionName || "1.0.0",
    versionCode: project.settings?.versionCode || 1,

    splash: project.settings?.splash ?? true,
    primaryColor: project.settings?.primaryColor || "#3b82f6"

  }),

  // 🔥 액션
  set:(key:string, value:any)=>set({ [key]:value }),

  next:()=>set(state=>({ step:state.step + 1 })),
  prev:()=>set(state=>({ step:state.step - 1 })),

  reset:()=>set(initialState),

  // 🔥 검증
  canNext:()=>{

    const s = get();

    if (s.step === 1) return !!s.os;
    if (s.step === 2) return s.appName && s.url;
    if (s.step === 3) return true;
    if (s.step === 4) return true;
    if (s.step === 5) return true;

    return true;

  },

  // 🔥 payload 생성
  buildPayload:()=>{

    const s = get();

    return {
      platform:s.os,
      appName:s.appName,
      url:s.url,
      versionName:s.versionName,
      versionCode:s.versionCode,
      features:{
        kakao:s.enableKakao ? s.kakaoKey : null
      }
    };

  }

}));