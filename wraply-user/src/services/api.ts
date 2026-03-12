import axios from "axios";

const api = axios.create({

  baseURL:"/api",

  timeout:10000

});

/* 모든 요청에 Authorization 추가 */

api.interceptors.request.use((config)=>{

  config.headers = config.headers ?? {};

  const token = localStorage.getItem("wraply_token") || "dev-user";

  if(token){

    config.headers.Authorization = `Bearer ${token}`;

  }

  return config;

});

export default api;