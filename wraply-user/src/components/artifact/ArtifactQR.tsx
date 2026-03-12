import { useState } from "react";

import InstallQR from "./InstallQR";

import type { Artifact } from "@/types/artifact";

interface Props{
  artifact:Artifact;
}

export default function ArtifactQR({ artifact }:Props){

  const [open,setOpen] = useState(false);

  return(

    <>

      <button
        onClick={()=>setOpen(true)}
        className="
        px-4
        py-2
        border
        border-border
        rounded-md
        hover:bg-muted
        active:scale-[0.98]
        transition
        "
      >

        QR 설치

      </button>

      {open && (

        <InstallQR
          artifact={artifact}
          onClose={()=>setOpen(false)}
        />

      )}

    </>

  );

}