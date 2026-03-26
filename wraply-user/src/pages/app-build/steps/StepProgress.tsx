import { useBuildStore } from "@/stores/buildStore";

import * as jobState from "@wraply/shared/job/jobState";

const { STATES, getProgress } = jobState;

const STEPS = [
  { key:STATES.QUEUED, label:"대기 중" },
  { key:STATES.PREPARING, label:"빌드 환경 준비" },
  { key:STATES.PATCHING, label:"앱 설정 적용" },
  { key:STATES.BUILDING, label:"앱 빌드" },
  { key:STATES.SIGNING, label:"서명" },
  { key:STATES.UPLOADING, label:"업로드" },
  { key:STATES.FINISHED, label:"완료" }
];

function getIndex(status:string){

  if (status === STATES.FAILED){
    return STEPS.length - 1;
  }

  const idx = STEPS.findIndex(s=>s.key === status);

  if (idx === -1){
    return 0;
  }

  return idx;

}

export default function StepProgress(){

  const status = useBuildStore(s=>s.status);

  const progress = getProgress(status || STATES.QUEUED);

  const currentIndex = getIndex(status);

  return(

    <div className="max-w-xl mx-auto space-y-6 text-center">

      <h1 className="text-xl font-semibold">

				{status === STATES.FAILED && "빌드 실패"}
				{status === STATES.FINISHED && "빌드 완료"}
				{status !== STATES.FAILED && status !== STATES.FINISHED && "앱 빌드 중"}

			</h1>

			<div className="w-full bg-gray-200 h-2 rounded">

				<div
						className="bg-blue-500 h-2 rounded transition-all"
						style={{ width:`${progress}%` }}
				/>

			</div>

			<div className="text-sm text-gray-500">
				{status}
			</div>

			<div className="text-xs text-gray-400 text-right">
				{progress}%
			</div>

      <div className="space-y-4 text-left">

        {STEPS.map((step,i)=>{

          const done = i < currentIndex;
          const active = i === currentIndex;

          return(

            <div key={step.key} className="flex items-center gap-3">

              <div className={`
                w-4 h-4 rounded-full
                ${
                  status === STATES.FAILED && active
                    ? "bg-red-500"
                    : done
                    ? "bg-green-500"
                    : active
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-200"
                }
              `}/>

              <div className={`
                ${
                  done
                    ? "text-gray-800"
                    : active
                    ? "text-black"
                    : "text-gray-400"
                }
              `}>
                {step.label}
              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}