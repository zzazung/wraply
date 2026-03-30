// src/stores/appBuildStore.ts

import { create } from "zustand";

/* --------------------------------
   Splash 기본 구조
-------------------------------- */

const defaultSplashConfig = {

  backgroundColor:"#ffffff",
  backgroundFile:null as File | null,

  logoFile:null as File | null,
  logoScale:0.5,

  position:"center",

  offsetX:0,
  offsetY:0

};

/* --------------------------------
   초기 상태
-------------------------------- */

const initialState = {

  step:1,

  platform:null as string | null,

  appName:"",
  url:"",
  packageName:"",

  versionName:"1.0.0",
  versionCode:"1",

  splash:true,
  primaryColor:"#3b82f6",

  showSplash:true,
  showLoading:true,

  iconFile:null as File | null,
  splashFile:null as File | null,
  splashLottieFile:null as File | null,

  splashConfig:{ ...defaultSplashConfig },
  editingSplashConfig:{ ...defaultSplashConfig },

  kakao:null as any,

  buildStatus:"idle",

  jobId:null as string | null

};

function cloneConfig(config){
  return {
    ...config,
    backgroundFile: config.backgroundFile || null,
    logoFile: config.logoFile || null
  };
}

export const useAppBuildStore = create((set, get)=>({

  ...initialState,

  setEditingSplashConfig:(fn)=>
    set(state=>({
      editingSplashConfig: fn(state.editingSplashConfig)
    })),

  /* 모달 열 때 */
  startEditing:()=>
    set(state=>({
      editingSplashConfig: cloneConfig(state.splashConfig)
    })),

  /* 저장 */
  commitEditing:()=>
    set(state=>({
      splashConfig: cloneConfig(state.editingSplashConfig)
    })),

  /* 취소 */
  cancelEditing:()=>
    set(state=>({
      editingSplashConfig: cloneConfig(state.splashConfig)
    })),

  /* --------------------------------
     프로젝트 초기화
  -------------------------------- */

  initFromProject:(project:any)=>set({

    platform: project.platform || null,

    appName: project.name || "",
    url: project.url || "",
    packageName: project.packageName || "",

    versionName: project.settings?.versionName || "1.0.0",
    versionCode: String(project.settings?.versionCode || "1"),

    splash: project.settings?.ui?.splash ?? true,
    primaryColor: project.settings?.ui?.primaryColor || "#3b82f6",

    showSplash: project.settings?.assets?.showSplash ?? true,
    showLoading: project.settings?.assets?.showLoading ?? true,

    iconFile:null,
    splashFile:null,
    splashLottieFile:null,

    splashConfig:{
      ...defaultSplashConfig,
      ...(project.settings?.ui?.splashConfig || {})
    },
    editingSplashConfig:{
      ...defaultSplashConfig,
      ...(project.settings?.ui?.splashConfig || {})
    },

    kakao: project.settings?.features?.kakao || null,

    buildStatus:"idle",
    jobId:null

  }),

  /* --------------------------------
     빌드 설정 복원
  -------------------------------- */

  loadFromBuild:(config:any)=>set({

    step:1,

    platform: config.platform || null,

    appName: config.appName || "",
    url: config.url || "",
    packageName: config.packageName || "",

    versionName: config.versionName || "1.0.0",
    versionCode: String(config.versionCode || "1"),

    splash: config.ui?.splash ?? true,
    primaryColor: config.ui?.primaryColor || "#3b82f6",

    showSplash: config.assets?.showSplash ?? true,
    showLoading: config.assets?.showLoading ?? true,

    iconFile:null,
    splashFile:null,
    splashLottieFile:null,

    splashConfig:{
      ...defaultSplashConfig,
      ...(config.ui?.splashConfig || {})
    },
    editingSplashConfig:{
      ...defaultSplashConfig,
      ...(config?.ui?.splashConfig || {})
    },

    kakao: config.features?.kakao || null,

    buildStatus:"idle",
    jobId:null

  }),

  /* --------------------------------
     공통 setter
  -------------------------------- */

  set:(key:string, value:any)=>set({ [key]:value }),

  /* --------------------------------
     Splash setter
  -------------------------------- */

  setSplashConfig:(fn:(prev:any)=>any)=>
    set(state=>({
      splashConfig: fn(state.splashConfig)
    })),

  /* --------------------------------
     step 제어
  -------------------------------- */

  next:()=>set(state=>({
    step:Math.min(8, state.step + 1)
  })),

  prev:()=>set(state=>({
    step:Math.max(1, state.step - 1)
  })),

  reset:()=>set(()=>({

    ...initialState,

    splashConfig:{ ...defaultSplashConfig },
    editingSplashConfig:{ ...defaultSplashConfig }

  })),

  /* --------------------------------
     다음 가능 여부
  -------------------------------- */

  canNext:()=>{

    const s = get();

    switch(s.step){

      case 1:
        return !!s.platform;

      case 2:
        try{
          new URL(s.url);
          return !!s.appName;
        }catch{
          return false;
        }

      case 3:
        return !!s.versionName && !!s.versionCode;

      case 4:
      case 5:
      case 6:
        return true;

      case 7:
      case 8:
        return false;

      default:
        return false;

    }

  },

  /* --------------------------------
     payload 생성
  -------------------------------- */

  buildPayload:()=>{

    const s = get();

    return {

      platform:s.platform,

      appName:s.appName,
      url:s.url,
      packageName:s.packageName,

      versionName:s.versionName,
      versionCode:s.versionCode,

      ui:{
        splash:s.splash,
        primaryColor:s.primaryColor,
        splashConfig:s.splashConfig
      },

      assets:{
        showSplash:s.showSplash,
        showLoading:s.showLoading,
        icon:s.iconFile,
        splash:s.splashFile,
        lottie:s.splashLottieFile
      },

      features:{
        kakao:s.kakao
      }

    };

  }

}));