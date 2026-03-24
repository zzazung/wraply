import type { Build } from "@/types/build";

interface Props{
  build:Build;
}

interface Step{
  key:string;
  label:string;
  description:string;
}

const STEPS:Step[] = [

  { key:"preparing", label:"빌드 준비", description:"환경을 준비하고 있습니다" },
  { key:"patching", label:"코드 설정", description:"앱 구성을 적용하고 있습니다" },
  { key:"building", label:"앱 빌드", description:"코드를 컴파일하고 있습니다" },
  { key:"signing", label:"서명", description:"앱 서명을 진행 중입니다" },
  { key:"uploading", label:"업로드", description:"결과를 업로드하고 있습니다" }

];

function normalize(status:string){
  return status.trim().toLowerCase();
}

function getStepIndex(status:string){

  const s = normalize(status);

  const idx = STEPS.findIndex(step=>step.key === s);

  if (idx !== -1) return idx;

  // finished / failed → 마지막 단계 기준
  if (s === "finished" || s === "failed"){
    return STEPS.length - 1;
  }

  return 0;

}

export default function BuildTimeline({ build }:Props){

  const status = normalize(build.status);

  const currentIndex = getStepIndex(status);

  const isFinished = status === "finished";
  const isFailed = status === "failed";

  return(

    <div className="space-y-6 text-left">

      {STEPS.map((step, i)=>{

        const isDone = isFinished || i < currentIndex;

        const isActive =
          !isFinished &&
          !isFailed &&
          i === currentIndex;

        const isError =
          isFailed &&
          i === currentIndex;

        return(

          <div key={step.key} className="flex gap-4">

            {/* indicator */}
            <div className="flex flex-col items-center">

              <div
                className={`
                  w-4 h-4 rounded-full transition-all

                  ${isDone ? "bg-green-500" : ""}
                  ${isActive ? "bg-blue-500 animate-pulse ring-4 ring-blue-100" : ""}
                  ${isError ? "bg-red-500 ring-4 ring-red-100" : ""}
                  ${!isDone && !isActive && !isError ? "bg-gray-300" : ""}
                `}
              />

              {i !== STEPS.length - 1 && (
                <div
                  className={`
                    w-[2px] h-10 mt-1
                    ${isDone ? "bg-green-300" : "bg-gray-200"}
                  `}
                />
              )}

            </div>

            {/* content */}
            <div className="flex-1">

              <div className="flex justify-between items-center">

                <div
                  className={`
                    text-sm font-medium

                    ${isError ? "text-red-600" : ""}
                    ${isActive ? "text-blue-600" : ""}
                    ${isDone ? "text-gray-900" : ""}
                    ${!isDone && !isActive && !isError ? "text-gray-400" : ""}
                  `}
                >
                  {step.label}
                </div>

                {/* 상태 텍스트 */}
                <div className="text-xs">

                  {isDone && !isFinished && (
                    <span className="text-gray-400">완료</span>
                  )}

                  {isActive && (
                    <span className="text-blue-500">진행 중</span>
                  )}

                  {isError && (
                    <span className="text-red-500 font-semibold">실패</span>
                  )}

                  {isFinished && i === STEPS.length - 1 && (
                    <span className="text-green-500 font-semibold">
                      완료
                    </span>
                  )}

                </div>

              </div>

              <div className="text-xs text-gray-500 mt-1">
                {step.description}
              </div>

            </div>

          </div>

        );

      })}

      {/* 🔥 실패 메시지 */}
      {isFailed && build.error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-600">
          {build.error}
        </div>
      )}

      {/* 🔥 완료 메시지 */}
      {isFinished && (
        <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-600">
          빌드가 성공적으로 완료되었습니다 🎉
        </div>
      )}

    </div>

  );

}