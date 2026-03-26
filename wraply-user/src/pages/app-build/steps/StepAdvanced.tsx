// src/pages/app-build/steps/StepAdvanced.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepAdvanced(){

  const { enableKakao, kakaoKey, set, prev, next } = useAppBuildStore();

  return(

    <div className="max-w-xl mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        고급 설정
      </h1>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enableKakao}
          onChange={e=>set("enableKakao", e.target.checked)}
        />
        카카오 로그인
      </label>

      {enableKakao && (
        <input
          value={kakaoKey}
          onChange={e=>set("kakaoKey", e.target.value)}
          placeholder="Kakao App Key"
          className="w-full border rounded p-3"
        />
      )}

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