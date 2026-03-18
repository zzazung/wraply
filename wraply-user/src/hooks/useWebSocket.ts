import { useEffect } from "react";

import { connectWebSocket } from "@/services/websocket";
import { useBuildStore } from "@/stores/buildStore";

export function useWebSocket(){

  const {
    updateBuildState,
    addArtifact,
    appendLog,
    completeBuild
  } = useBuildStore();

  useEffect(()=>{

    const ws = connectWebSocket((data)=>{

      switch(data.type){

        case "state":
          updateBuildState(data.jobId, data.state);
          break;

        case "artifact":
          addArtifact(data.jobId, data.file);
          break;

        case "log":
          appendLog(data.jobId, data.message);
          break;

        case "complete":
          completeBuild(data.jobId);
          break;

      }

    });

    return ()=>{
      ws.close();
    };

  },[]);

}