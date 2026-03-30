// src/pages/app-build/steps/StepBasic.tsx

import { useMemo } from "react";
import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepBasic(){

  const appName = useAppBuildStore(s=>s.appName);
  const url = useAppBuildStore(s=>s.url);
  const set = useAppBuildStore(s=>s.set);

  /* --------------------------------
     validation
  -------------------------------- */

  const isUrlValid = useMemo(()=>{

    if (!url) return true;

    try{
      new URL(url);
      return true;
    }catch{
      return false;
    }

  },[url]);

  return(

    <div className="max-w-md mx-auto space-y-6">

      <h1 className="text-xl font-semibold text-center">
        기본 설정
      </h1>

      {/* 앱 이름 */}
      <div className="space-y-2">

        <label className="text-sm text-gray-600">
          앱 이름
        </label>

        <input
          value={appName}
          onChange={e=>set("appName", e.target.value.trimStart())}
          placeholder="예: Wraply"
          className="
            w-full border rounded-md px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />

      </div>

      {/* URL */}
      <div className="space-y-2">

        <label className="text-sm text-gray-600">
          서비스 URL
        </label>

        <input
          value={url}
          onChange={e=>set("url", e.target.value.trim())}
          placeholder="https://example.com"
          className={`
            w-full border rounded-md px-3 py-2
            focus:outline-none focus:ring-2
            ${isUrlValid
              ? "focus:ring-blue-500"
              : "border-red-500 focus:ring-red-500"
            }
          `}
        />

        {!isUrlValid && (
          <p className="text-xs text-red-500">
            올바른 URL을 입력해주세요
          </p>
        )}

      </div>

    </div>

  );

}