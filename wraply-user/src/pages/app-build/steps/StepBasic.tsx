// src/pages/app-build/steps/StepBasic.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepBasic(){

  const { appName, url, set, next, prev } = useAppBuildStore();

  return(

    <div className="max-w-xl mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        기본 설정
      </h1>

      <input
        value={appName}
        onChange={e=>set("appName", e.target.value)}
        placeholder="앱 이름"
        className="w-full border rounded p-3"
      />

      <input
        value={url}
        onChange={e=>set("url", e.target.value)}
        placeholder="https://example.com"
        className="w-full border rounded p-3"
      />

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