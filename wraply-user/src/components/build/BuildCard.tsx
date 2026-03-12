import BuildStatusBadge from "./BuildStatusBadge";

interface Props{

  jobId:string;

  platform:string;

  status:"queued"|"running"|"finished"|"failed";

}

export default function BuildCard({

  jobId,
  platform,
  status

}:Props){

  return(

    <div
      className="
      bg-card
      border
      border-border
      rounded-lg
      p-4
      flex
      justify-between
      items-center
      cursor-pointer
      transition
      hover:border-primary/50
      hover:bg-muted
      active:scale-[0.99]
      "
    >

      <div className="space-y-1">

        <div className="font-medium">

          빌드 번호 : {jobId}

        </div>

        <div className="text-sm text-muted-foreground">

          대상 플랫폼 : {platform}

        </div>

      </div>

      <BuildStatusBadge status={status} />

    </div>

  );

}