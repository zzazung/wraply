// src/pages/app-build/steps/StepUI.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepUI(){

  const {
    splash,
    set,
    next,
    prev
  } = useAppBuildStore();

  return(

    <div className="max-w-xl mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        UX / UI 설정
      </h1>

      {/* Splash Screen */}
      <div className="space-y-3">

        <label className="text-sm font-medium">
          Splash Screen
        </label>

        <div className="flex items-center gap-3">

          <button
            onClick={()=>set("splash", true)}
            className={`
              px-4 py-2 rounded border
              ${splash ? "bg-blue-500 text-white" : ""}
            `}
          >
            사용
          </button>

          <button
            onClick={()=>set("splash", false)}
            className={`
              px-4 py-2 rounded border
              ${!splash ? "bg-blue-500 text-white" : ""}
            `}
          >
            사용 안함
          </button>

        </div>

      </div>

      {/* 아이콘 업로드 (Mock) */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          앱 아이콘
        </label>

        <div className="
          w-24 h-24 border rounded-lg
          flex items-center justify-center
          text-xs text-gray-400
          cursor-pointer
          hover:bg-gray-50
        ">
          업로드
        </div>

      </div>

      {/* 테마 색상 */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          Primary Color
        </label>

        <input
          type="color"
          onChange={e=>set("primaryColor", e.target.value)}
          className="w-16 h-10 border rounded"
        />

      </div>

      {/* 버튼 */}
      <div className="flex justify-between pt-4">

        <button onClick={prev}>
          이전
        </button>

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