// src/hooks/useAgentSocket.ts

import { useEffect } from "react";
import { connectWebSocket } from "@/services/websocket";
import { useAgentStore } from "@/stores/agent";

export function useAgentSocket(){

  const {
    jobId,
    addStep,
    appendStream
  } = useAgentStore();

  useEffect(()=>{

    const ws = connectWebSocket((data)=>{

      if(data.jobId !== jobId) return;

      if(data.type === "agent_event"){
        addStep(data);
      }

			if(data.type === "agent_stream"){
				appendStream(data);
			}

    });

    return ()=>ws.close();

  },[jobId]);

}