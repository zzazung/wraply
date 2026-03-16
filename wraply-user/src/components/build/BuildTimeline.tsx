import type { Build } from "@/types/build";

interface Props{
  build?:Build;
}

interface Step{
  key:string;
  label:string;
}

const STEPS:Step[] = [

  { key:"queued",label:"빌드 대기" },
  { key:"preparing",label:"작업 준비" },
  { key:"building",label:"앱 빌드" },
  { key:"packaging",label:"패키징" },
  { key:"uploading",label:"결과 업로드" }

];

function getStepIndex(status:string){

  const index = STEPS.findIndex(s=>s.key===status);

  if(index === -1){

    if(status === "finished") return STEPS.length - 1;

    if(status === "failed") return STEPS.length - 1;

    if(status === "cancelled") return STEPS.length - 1;

    return 0;

  }

  return index;

}

export default function BuildTimeline({ build }:Props){

  if(!build) return null;

  const stepIndex = getStepIndex(build.status);

  return(

    <div className="bg-card border border-border rounded-lg p-6">

      <div className="text-sm font-semibold mb-5">

        빌드 진행 단계

      </div>

      <div className="space-y-0">

        {STEPS.map((step,index)=>{

          let state:"done"|"active"|"pending"|"error" = "pending";

          if(build.status === "failed" && index === stepIndex){

            state = "error";

          }
          else if(build.status === "cancelled" && index === stepIndex){

            state = "error";

          }
          else if(index < stepIndex){

            state = "done";

          }
          else if(index === stepIndex){

            state = "active";

          }

          if(build.status === "finished"){

            state = "done";

          }

          return(

            <TimelineItem
              key={step.key}
              label={step.label}
              state={state}
              isLast={index === STEPS.length - 1}
            />

          );

        })}

        {build.status === "finished" && (

          <FinishItem label="빌드 완료" />

        )}

        {build.status === "failed" && (

          <FinishItem
            label="빌드 실패"
            color="bg-red-500"
          />

        )}

        {build.status === "cancelled" && (

          <FinishItem
            label="빌드 취소"
            color="bg-gray-500"
          />

        )}

      </div>

    </div>

  );

}

function TimelineItem({

  label,
  state,
  isLast

}:{

  label:string;
  state:"done"|"active"|"pending"|"error";
  isLast:boolean;

}){

  // const height = isLast ? '' : 'h-10';
  const height = 'h-10';

  const dotColor =

    state==="done"
      ? "bg-green-500"

    : state==="active"
      ? "bg-blue-500 animate-pulse"

    : state==="error"
      ? "bg-red-500"

    : "bg-muted";

  const textColor =

    state==="pending"
      ? "text-muted-foreground"

    : "text-foreground";

  return(

    <div className={`flex items-start gap-4 ${height}`}>

      <div className="flex flex-col items-center pt-1">

        <div className={`w-3 h-3 rounded-full ${dotColor}`} />

        {!isLast && (

          <div className="w-px h-7 bg-border" />

        )}

      </div>

      <div className={`text-sm ${textColor}`}>

        {label}

      </div>

    </div>

  );

}

function FinishItem({

  label,
  color="bg-green-600"

}:{

  label:string;
  color?:string;

}){

  return(

    <div className="flex items-start gap-4">

      <div className="flex flex-col items-center pt-1">

        <div className={`w-3 h-3 rounded-full ${color}`} />

      </div>

      <div className="text-sm font-medium">

        {label}

      </div>

    </div>

  );

}