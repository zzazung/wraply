import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BuildRequestModal from "./BuildRequestModal";

export default function BuildLauncher({
  projectId
}:{
  projectId:string;
}){

  const navigate = useNavigate();

  const [open,setOpen] = useState(false);

  function handleCreated(jobId:string){

    navigate(`/builds/${jobId}`);

  }

  return(

    <div className="bg-card border border-border rounded-lg p-6 space-y-4">

      <div className="flex items-center justify-between">

        <div>

          <div className="font-medium">
            새 빌드
          </div>

          <div className="text-sm text-muted-foreground">
            Android 또는 iOS 앱 빌드를 시작합니다.
          </div>

        </div>

        <button
          onClick={()=>setOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 active:scale-95 transition"
        >
          빌드 시작
        </button>

      </div>

      {open && (

        <BuildRequestModal
          projectId={projectId}
          onClose={()=>setOpen(false)}
          onCreated={handleCreated}
        />

      )}

    </div>

  );

}