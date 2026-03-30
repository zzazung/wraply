// src/providers/WebSocketProvider.tsx

import { createContext, useEffect, useRef, useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { useBuildStore } from "@/stores/buildStore";
import { useAuthStore } from "@/stores/authStore";
import { useAgentStore } from "../stores/agent";
import { normalizeStatus } from "../utils/buildStatus";

const WSContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }:{ children:React.ReactNode }){

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(true);
  const retryRef = useRef(0);

  const [wsState, setWsState] = useState<WebSocket | null>(null);

  const setWorkflowStatus = useWorkflowStore(s=>s.setStatus);
  const updateStep = useWorkflowStore(s=>s.updateStep);
  const addWorkflowLog = useWorkflowStore(s=>s.addLog);
  const currentWorkflowId = useWorkflowStore(s=>s.workflowId);

  const updateBuild = useBuildStore((s)=>s.updateBuild);
  const appendLog = useBuildStore((s)=>s.appendLog);
  const addEvent = useAgentStore(s => s.addEvent);
  const appendStream = useAgentStore(s => s.appendStream);

  const token = useAuthStore((s)=>s.token);

  useEffect(()=>{

    /**
     * 🔥 token 없으면 무조건 종료
     */
    if (!token){

      reconnectRef.current = false;

      if (wsRef.current){
        wsRef.current.close();
        wsRef.current = null;
        setWsState(null);
      }

      return;
    }

    reconnectRef.current = true;

    function connect(){

      /**
       * 🔥 이미 연결되어 있으면 skip (OPEN 상태만)
       */
      if (wsRef.current?.readyState === WebSocket.OPEN){
        return;
      }

      const currentToken = useAuthStore.getState().token;

      if (!currentToken){
        console.warn("[ws] skip connect: no token");
        return;
      }

      const ws = new WebSocket(
        `ws://localhost:4000/ws?token=${currentToken}`
      );

      wsRef.current = ws;
      setWsState(ws);

      ws.onopen = ()=>{
        console.log("✅ 웹소켓 연결됨");
        retryRef.current = 0;
      };

      ws.onmessage = (event)=>{

        try{

          const data = JSON.parse(event.data);

          if (!data.jobId) return;

          console.log("🔥 WS RECEIVE:", data);

          /* ---------------- workflow ---------------- */

          if (data.type === "workflow"){

            // 🔥 현재 workflow만 처리
            if (data.workflowId !== currentWorkflowId) return;

            if (data.event === "STATUS"){
              setWorkflowStatus(data.status);
            }

            if (data.event === "STEP"){
              updateStep(data.step, data.status);
            }

            if (data.event === "LOG"){
              addWorkflowLog({
                message: data.message,
                ts: Date.now()
              });
            }

          }

          /* ---------------- build ---------------- */

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

          /* ---------------- agent ---------------- */

          if (data.type === "agent_event"){

            addEvent(data);

          }

          if (data.type === "agent_stream"){

            appendStream(data);

          }

        }catch(err){

          console.error("❌ WS parse error", err);

        }

      };

      ws.onclose = ()=>{
        console.log("⚠️ 웹소켓 종료");

        wsRef.current = null;
        setWsState(null);

        if (!reconnectRef.current) return;

        /**
         * 🔥 exponential backoff
         */
        const delay = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current++;

        console.log(`[ws] reconnect in ${delay}ms`);

        setTimeout(()=>{
          connect();
        }, delay);

      };

      ws.onerror = (err)=>{
        console.error("❌ WS error", err);
      };

    }

    /**
     * 🔥 기존 연결 강제 종료 후 재연결
     * (token 변경 대응 핵심)
     */
    if (wsRef.current){
      wsRef.current.close();
      wsRef.current = null;
      setWsState(null);
    }

    connect();

    /**
     * 🔥 heartbeat (optional but recommended)
     */
    const interval = setInterval(()=>{
      if (wsRef.current?.readyState === WebSocket.OPEN){
        wsRef.current.send(JSON.stringify({ type:"ping" }));
      }
    }, 30000);

    return ()=>{

      reconnectRef.current = false;

      clearInterval(interval);

      if (wsRef.current){
        wsRef.current.close();
        wsRef.current = null;
        setWsState(null);
      }

    };

  },[token]);

  return(
    <WSContext.Provider value={wsState}>
      {children}
    </WSContext.Provider>
  );

}