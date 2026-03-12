import type { Artifact } from "@/types/artifact";

interface Props{
  artifact:Artifact;
}

export default function ArtifactDownload({ artifact }:Props){

  function handleDownload(){

    window.open(

      artifact.downloadUrl,
      "_blank"

    );

  }

  return(

    <button
      onClick={handleDownload}
      className="
      px-4
      py-2
      bg-primary
      text-primary-foreground
      rounded-md
      hover:opacity-90
      active:scale-[0.98]
      transition
      "
    >

      다운로드

    </button>

  );

}