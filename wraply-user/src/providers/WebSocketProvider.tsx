import { createContext, useEffect, useRef } from "react";
import { useBuildStore } from "@/stores/buildStore";
import { useAuthStore } from "@/stores/authStore";
import { normalizeStatus } from "../utils/buildStatus";

const WSContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }:{ children:React.ReactNode }){

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(true);

  const updateBuild = useBuildStore((s)=>s.updateBuild);
  const appendLog = useBuildStore((s)=>s.appendLog);

  const token = useAuthStore((s)=>s.token);

  useEffect(()=>{

    if (!token) return;

    // 🔥 핵심: 이미 연결되어 있으면 무조건 차단
    if (wsRef.current){
      console.log("⚠️ WS already exists → skip");
      return;
    }

    reconnectRef.current = true;

    function connect(){

      // 🔥 이 조건 하나로 충분
      if (wsRef.current){
        return;
      }

      const ws = new WebSocket(
        `ws://localhost:4000/ws?token=${token}`
      );

      wsRef.current = ws;

      ws.onopen = ()=>{
        console.log("웹소켓 연결됨");
      };

      ws.onmessage = (event)=>{
        try{

          const data = JSON.parse(event.data);

          if (data.type === "status"){

            updateBuild({
              ...data,
              status: normalizeStatus(data.status)
            });

          }

          if (data.type === "log"){

            appendLog({
              jobId: data.jobId,
              message: data.message
            });

          }

        }catch(err){

          console.error("WS parse error", err);

        }

      };

      ws.onclose = ()=>{
        console.log("웹소켓 연결 종료");

        wsRef.current = null;

        if (!reconnectRef.current) return;

        setTimeout(()=>{
          connect();
        },2000);

      };

      ws.onerror = (err)=>{
        console.error("WS error", err);
      };

    }

    connect();

    return ()=>{

      reconnectRef.current = false;

      if (wsRef.current){

        wsRef.current.close();
        wsRef.current = null;

      }

    };

  },[token]);

  return(
    <WSContext.Provider value={wsRef.current}>
      {children}
    </WSContext.Provider>
  );

}