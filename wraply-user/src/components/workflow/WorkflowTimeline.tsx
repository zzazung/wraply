// src/components/workflow/WorkflowTimeline.tsx

interface Step{
  stepIndex:number;
  target:string;
  status:string;
  progress:number;
}

const LABELS:any = {
  ai_content:"AI 콘텐츠 생성",
  android_build:"Android 빌드",
  ios_build:"iOS 빌드"
};

export default function WorkflowTimeline({ steps }:{steps:Step[]}){

  return(

    <div className="space-y-4">

      {steps.map((step,i)=>{

        const isDone = step.status === "finished";
        const isActive = step.status === "building" || step.status === "running";
        const isFailed = step.status === "failed";

        return(

          <div
            key={i}
            className={`
              flex gap-4 p-4 rounded-xl border
              ${isActive ? "border-blue-500 shadow-md" : "border-gray-200"}
            `}
          >

            {/* 상태 아이콘 */}
            <div className={`
              w-8 h-8 flex items-center justify-center rounded-full text-white
              ${isDone ? "bg-green-500" :
                isFailed ? "bg-red-500" :
                isActive ? "bg-blue-500 animate-pulse" :
                "bg-gray-300"}
            `}>
              {i+1}
            </div>

            {/* 내용 */}
            <div className="flex-1">

              <div className="font-medium">
                {LABELS[step.target] || step.target}
              </div>

              <div className="text-sm text-gray-500">
                {step.status}
              </div>

              {/* progress */}
              {isActive && (
                <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">

                  <div
                    className="h-2 bg-blue-500 transition-all"
                    style={{ width:`${step.progress || 10}%` }}
                  />

                </div>
              )}

            </div>

          </div>

        );

      })}

    </div>

  );

}