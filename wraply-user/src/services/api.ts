import axios from "axios";

import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.API_URL || "http://localhost:4000",
  withCredentials: true
});

/**
 * 요청 인터셉터
 */
api.interceptors.request.use((config)=>{

  const token = useAuthStore.getState().token;

  if (token){
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

/**
 * 응답 인터셉터 (선택)
 */
api.interceptors.response.use(
  (res)=>res,
  (err)=>{

    if (err.response?.status === 401){

      // 토큰 만료 → 로그아웃 처리
      useAuthStore.getState().logout();

      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;