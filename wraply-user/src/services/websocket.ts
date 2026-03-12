import type { Build } from "@/types/build";

interface BuildEvent{

  type:"build_update";

  payload:Build;

}

export function connectWebSocket(

  onMessage:(event:BuildEvent)=>void

){

  const ws = new WebSocket("ws://localhost:4000/ws");

  ws.onmessage = (e)=>{

    const data = JSON.parse(e.data);

    onMessage(data);

  };

  return ws;

}