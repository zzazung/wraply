// src/pages/app-build/steps/StepOS.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepOS(){

  const { os, set, next } = useAppBuildStore();

  return(

    <div className="max-w-2xl mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        OS 선택
      </h1>

      <div className="grid grid-cols-2 gap-4">

        {["android","ios"].map(o=>(
          <div
            key={o}
            onClick={()=>set("os", o)}
            className={`
              border rounded-xl p-6 cursor-pointer text-center
              ${os === o ? "border-blue-500 bg-blue-50" : ""}
            `}
          >
            {o.toUpperCase()}
          </div>
        ))}

      </div>

      {/* 버튼 */}
      <div className="flex justify-end pt-4">

        <button
          onClick={next}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          다음 →
        </button>

      </div>

    </div>

  );

}