// src/pages/app-build/steps/StepVersion.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepVersion(){

  const versionName = useAppBuildStore(s=>s.versionName);
  const versionCode = useAppBuildStore(s=>s.versionCode);
  const set = useAppBuildStore(s=>s.set);

  return(

    <div className="max-w-md mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        버전 관리
      </h1>

      {/* versionName */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          Version Name
        </label>

        <input
          value={versionName}
          onChange={e=>set("versionName", e.target.value.trim())}
          placeholder="1.0.0"
          className="
            w-full border rounded-md px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />

        <p className="text-xs text-gray-400">
          사용자에게 표시되는 버전입니다
        </p>

      </div>

      {/* versionCode */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          Version Code
        </label>

        <input
          value={versionCode}
          onChange={e=>set("versionCode", e.target.value)}
          placeholder="1"
          className="
            w-full border rounded-md px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />

        <p className="text-xs text-gray-400">
          업데이트 시 증가해야 합니다 (Android 필수)
        </p>

      </div>

      {/* 자동 증가 */}
      <div className="flex justify-end">

        <button
          onClick={()=>set("versionCode", String(Number(versionCode || "0") + 1))}
          className="text-sm text-blue-500"
        >
          + 자동 증가
        </button>

      </div>

    </div>

  );

}