let ws:WebSocket | null = null;

type Handler = (data:any)=>void;

const handlers = new Set<Handler>();

function getToken(){

  try{
    const { useAuthStore } = require("@/stores/authStore");
    return useAuthStore.getState().token;
  }catch{
    return null;
  }

}

function createWebSocket(){

  const base = import.meta.env.WS_URL || "ws://localhost:4000/ws";

  const token = getToken();

  const url = token
    ? `${base}?token=${token}`
    : base;

  const socket = new WebSocket(url);

  socket.onopen = ()=>{
    console.log("[WS] connected");
  };

  socket.onmessage = (e)=>{

    try{

      const data = JSON.parse(e.data);

      /* 🔥 모든 handler에게 전달 */

      handlers.forEach(fn=>fn(data));

    }catch(err){

      console.error("[WS parse error]", err);

    }

  };

  socket.onerror = (err)=>{
    console.error("[WS error]", err);
  };

  socket.onclose = ()=>{
    console.warn("[WS closed]");
    ws = null;
  };

  return socket;

}

/* --------------------------------------------------
   public API
-------------------------------------------------- */

export function connectWebSocket(handler:Handler){

  handlers.add(handler);

  if(!ws){
    ws = createWebSocket();
  }

  return ws;

}

export function disconnectWebSocket(handler:Handler){

  handlers.delete(handler);

  if(handlers.size === 0 && ws){
    ws.close();
    ws = null;
  }

}