import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import InstallModal from "@/components/common/InstallModal";

export default function InstallPage(){

  const { artifactId } = useParams<{ artifactId:string }>();

  const [open,setOpen] = useState(true);

  useEffect(()=>{
    setOpen(true);
  },[artifactId]);

  if (!artifactId){
    return (
      <div className="p-10 text-center">
        잘못된 접근입니다
      </div>
    );
  }

  return(

    <div className="min-h-screen flex items-center justify-center">

      {open && (
        <InstallModal
          artifactId={artifactId}
          onClose={()=>setOpen(false)}
        />
      )}

    </div>

  );

}