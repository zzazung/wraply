import { create } from "zustand";

interface AuthState{
  token:string | null;
  user:any;

  setAuth:(data:{
    token:string;
    user:any;
  })=>void;

  logout:()=>void;
}

/**
 * 초기 상태 로드 (localStorage)
 */
function getInitialState(){

  try{

    const stored = localStorage.getItem("wraply_auth");

    if (!stored) return {
      token:null,
      user:null
    };

    return JSON.parse(stored);

  }catch(err){

    console.error("[authStore] parse error", err);

    return {
      token:null,
      user:null
    };

  }

}

export const useAuthStore = create<AuthState>((set)=>({

  ...getInitialState(),

  setAuth:(data)=>{

    const state = {
      token:data.token,
      user:data.user
    };

    localStorage.setItem("wraply_auth", JSON.stringify(state));

    set(state);

  },

  logout:()=>{

    localStorage.removeItem("wraply_auth");

    set({
      token:null,
      user:null
    });

  }

}));