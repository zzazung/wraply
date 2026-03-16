import BuildStatusBadge from "@/components/build/BuildStatusBadge";

import type { BuildJob } from "@/types/build";

export default function BuildHeader({

  job

}:{

  job:BuildJob;

}){

  return(

    <div className="bg-card border border-border rounded-lg p-6">

      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm text-muted-foreground mt-1">

            Job ID : {job.id}

          </div>

        </div>

        <BuildStatusBadge status={job.status} />

      </div>

    </div>

  );

}