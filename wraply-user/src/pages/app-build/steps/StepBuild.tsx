// src/pages/app-build/steps/StepBuild.tsx

import { useState } from "react";

import { createJob } from "@/services/builds";
import { useProjectStore } from "@/stores/projectStore";
import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepBuild(){

  const project = useProjectStore(s=>s.currentProject);

  const {
    buildPayload,
    packageName,   // ✅ 추가
    appName,       // (fallback용)
    set,
    next,
    prev
  } = useAppBuildStore();

  const [loading, setLoading] = useState(false);

  async function handleBuild(){

    if (loading) return;

    if (!project){
      alert("프로젝트를 선택해주세요");
      return;
    }

    try{

      setLoading(true);

      const payload = buildPayload();

      const res = await createJob({
        projectId: project.id,
        ...payload
      });

      set("jobId", res.jobId);
      set("buildStatus", "building");

      next();

    } catch(err){

      console.error(err);
      set("buildStatus","failed");

      alert("빌드 요청 실패");

    } finally{

      setLoading(false);

    }

  }

  /* ---------------- fallback ---------------- */

  function generatePackageName(name?:string){
    if (!name) return "-";
    return `com.wraply.${name.toLowerCase().replace(/\s+/g,"")}`;
  }

  return(

    <div className="max-w-xl mx-auto space-y-8">

      {/* 타이틀 */}
      <div className="text-center space-y-2">

        <h1 className="text-2xl font-semibold">
          앱 빌드
        </h1>

        <p className="text-sm text-gray-500">
          앱 배포에 필요한 정보를 확인하고 빌드를 시작하세요
        </p>

      </div>

      {/* 패키지명 */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          패키지명
        </label>

        <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm">

          {/* ✅ 핵심 수정 */}
          {packageName || generatePackageName(appName)}

        </div>

        <p className="text-xs text-gray-400">
          앱 빌드 시 사용됩니다.
        </p>

      </div>

      {/* 서명 */}
      <div className="space-y-2">

        <label className="text-sm font-medium">
          앱 서명키
        </label>

        <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm">
          앱 서명키 자동 생성
        </div>

        <p className="text-xs text-gray-400">
          안전한 앱 배포를 위해 자동으로 생성 및 관리됩니다.
        </p>

      </div>

      {/* 버튼 */}
      <div className="flex justify-between pt-6">

        <button
          onClick={prev}
          className="px-4 py-2 border rounded-md text-sm"
        >
          ← 이전
        </button>

        <button
          onClick={handleBuild}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
        >
          {loading ? "빌드 중..." : "빌드하기"}
        </button>

      </div>

    </div>

  );

}