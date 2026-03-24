// src/services/agent.ts

export async function runAgent(payload:{
  goal:string;
  context:any;
}){

  const raw = localStorage.getItem("wraply_auth");

  const token = raw ? JSON.parse(raw).token : null;

  const res = await fetch("/api/agent",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": `Bearer ${token}` // 🔥 핵심
    },
    body:JSON.stringify(payload)
  });

  return res.json(); // { jobId }
}