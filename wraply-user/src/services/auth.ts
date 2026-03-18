import api from "./api";

export async function register(payload:{
  email:string;
  password:string;
}){

  const res = await api.post("/auth/register", payload);

  return res.data;

}

export async function login(payload:{
  email:string;
  password:string;
}){

  const res = await api.post("/auth/login", payload);

  return res.data;

}