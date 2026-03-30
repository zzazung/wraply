// src/pages/app-build/steps/StepAdvanced.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepAdvanced(){

  const enableKakao = useAppBuildStore(s=>s.enableKakao);
  const kakaoKey = useAppBuildStore(s=>s.kakaoKey);
  const set = useAppBuildStore(s=>s.set);

  return(

    <div className="max-w-md mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        고급 설정
      </h1>

      {/* 카카오 로그인 */}
      <div className="space-y-3">

        <label className="flex items-center gap-2 text-sm">

          <input
            type="checkbox"
            checked={enableKakao}
            onChange={e=>{
                const checked = e.target.checked;

                set("enableKakao", checked);

                if (!checked){
                    set("kakaoKey", "");
                }
            }}
          />

          카카오 로그인 사용

        </label>

        {enableKakao && (

          <input
            value={kakaoKey}
            onChange={e=>set("kakaoKey", e.target.value.trim())}
            placeholder="Kakao App Key"
            className="
              w-full border rounded-md px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />

        )}

      </div>

    </div>

  );

}