import { useAuthStore } from "@/stores/authStore";

export type WSMessage =
  | { type:"state"; jobId:string; state:string }
  | { type:"log"; jobId:string; message:string }
  | { type:"artifact"; jobId:string; file:string }
  | { type:"complete"; jobId:string };

export function connectWebSocket(
  onMessage:(event:WSMessage)=>void
){

  const token = useAuthStore.getState().token;

  const base = import.meta.env.WS_URL || "ws://localhost:4000/ws";

  const url = token
    ? `${base}?token=${token}`
    : base;

  const ws = new WebSocket(url);

  ws.onopen = ()=>{
    console.log("[WS] connected");
  };

  ws.onmessage = (e)=>{

    try{

      const data:WSMessage = JSON.parse(e.data);

      onMessage(data);

    }catch(err){

      console.error("[WS parse error]", err);

    }

  };

  ws.onerror = (err)=>{
    console.error("[WS error]", err);
  };

  ws.onclose = ()=>{
    console.warn("[WS closed]");
  };

  return ws;

}