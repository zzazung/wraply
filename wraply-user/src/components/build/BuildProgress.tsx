import type { Build } from "@/types/build";

import { getBuildProgress } from "@/utils/buildProgress";

interface Props{
  build?:Build;
}

export default function BuildProgress({ build }:Props){

  if(!build) return null;

  const progress = getBuildProgress(build.status);

  return(

    <div className="bg-card border border-border rounded-lg p-6">

      <div className="flex justify-between text-sm mb-3">

        <span className="font-medium">

          빌드 진행률

        </span>

        <span className="text-muted-foreground">

          {progress}%

        </span>

      </div>

      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">

        <div
          className="
          h-full
          bg-primary
          transition-all
          duration-500
          "
          style={{

            width:`${progress}%`

          }}
        />

      </div>

    </div>

  );

}