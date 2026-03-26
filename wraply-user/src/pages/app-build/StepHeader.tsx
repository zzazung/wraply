// src/pages/app-build/StepHeader.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

const steps = [
  "OS 선택",
  "기본 설정",
  "버전 관리",
  "UX/UI 설정",
  "고급 설정",
  "앱 빌드"
];

export default function StepHeader(){

  const current = useAppBuildStore(s=>s.step);

  return(

    <div className="flex items-center justify-center gap-6 mb-10">

      {steps.map((label,i)=>{

        const idx = i + 1;
        const active = current >= idx;

        return(

          <div key={label} className="flex items-center gap-2">

            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm
              ${active ? "bg-blue-500 text-white" : "bg-gray-200"}
            `}>
              {idx}
            </div>

            <div className={active ? "text-blue-600" : "text-gray-400"}>
              {label}
            </div>

          </div>

        );

      })}

    </div>

  );

}