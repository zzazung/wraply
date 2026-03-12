import { createContext,useEffect,useRef } from "react";

import { useBuildStore } from "@/stores/buildStore";

const WSContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }:{ children:React.ReactNode }){

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(true);

  const updateBuild = useBuildStore((s)=>s.updateBuild);
  const appendLog = useBuildStore((s)=>s.appendLog);

  useEffect(()=>{

    let ws:WebSocket;

    function connect(){

      ws = new WebSocket("ws://localhost:4000/ws");

      ws.onopen = ()=>{
        console.log("웹소켓 연결됨");
      };

      ws.onmessage = (event)=>{

        const data = JSON.parse(event.data);

        if(data.type==="build-status"){
          updateBuild(data.payload);
        }

        if(data.type==="build-log"){
          appendLog(data.payload);
        }

      };

      ws.onclose = ()=>{

        console.log("웹소켓 연결 종료");

        if(reconnectRef.current){
          setTimeout(connect,2000);
        }

      };

      ws.onerror = ()=>{
        ws.close();
      };

      wsRef.current = ws;

    }

    connect();

    return ()=>{

      reconnectRef.current = false;

      ws?.close();

    };

  },[]);

  return(
    <WSContext.Provider value={wsRef.current}>
      {children}
    </WSContext.Provider>
  );

}