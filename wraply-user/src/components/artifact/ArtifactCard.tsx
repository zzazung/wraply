import ArtifactDownload from "./ArtifactDownload";
import ArtifactQR from "./ArtifactQR";

import type { Artifact } from "@/types/artifact";

import { formatFileSize } from "@/utils/formatDate";

interface Props{
  artifact:Artifact;
}

export default function ArtifactCard({ artifact }:Props){

  return(

    <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">

      <div className="space-y-1">

        <div className="font-medium">

          {artifact.platform === "android" ? "Android APK" : "iOS IPA"}

        </div>

        <div className="text-sm text-muted-foreground">

          파일 크기 {formatFileSize(artifact.size)}

        </div>

      </div>

      <div className="flex items-center gap-3">

        <ArtifactDownload artifact={artifact} />

        <ArtifactQR artifact={artifact} />

      </div>

    </div>

  );

}