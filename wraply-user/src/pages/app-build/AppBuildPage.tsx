// src/pages/app-build/AppBuildPage.tsx

import { useEffect } from "react";

import { useProjectStore } from "@/stores/projectStore";
import { useAppBuildStore } from "@/stores/appBuildStore";

import StepHeader from "./StepHeader";
import StepOS from "./steps/StepOS";
import StepBasic from "./steps/StepBasic";
import StepVersion from "./steps/StepVersion";
import StepUI from "./steps/StepUI";
import StepAdvanced from "./steps/StepAdvanced";
import StepBuild from "./steps/StepBuild";
import StepProgress from "./steps/StepProgress";
import StepDone from "./steps/StepDone";

export default function AppBuildPage(){

  const project = useProjectStore(s=>s.currentProject);
	console.log(project);

  const {
    step,
    next,
    prev,
    reset,
    initFromProject,
    canNext
  } = useAppBuildStore();

  /* --------------------------------
     프로젝트 변경 대응 (🔥 중요)
  -------------------------------- */

  useEffect(()=>{

    if (!project) return;

    reset();            // 👉 이전 상태 제거
    initFromProject(project);

  },[project]);

  /* --------------------------------
     unmount cleanup
  -------------------------------- */

  useEffect(()=>{
    return ()=>reset();
  },[]);

  /* ---------------- step render ---------------- */

  function renderStep(){

    switch(step){

      case 1: return <StepOS />;
      case 2: return <StepBasic />;
      case 3: return <StepVersion />;
      case 4: return <StepUI />;
      case 5: return <StepAdvanced />;
      case 6: return <StepBuild />;
      case 7: return <StepProgress />;
      case 8: return <StepDone />;

      default: return null;

    }

  }

  /* ---------------- footer 조건 ---------------- */

  const hideFooter = step >= 6; // 👉 build 이후는 숨김

  const isFirst = step === 1;

  return(

    <div className="flex-1">

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <StepHeader />

        {/* Card */}
        <div className="bg-white border rounded-xl p-10">

          {renderStep()}

        </div>

        {/* Footer */}
        {!hideFooter && (

          <div className="flex justify-between">

            <button
              onClick={prev}
              disabled={isFirst}
              className="text-sm text-gray-500 disabled:opacity-30"
            >
              이전
            </button>

            <button
              onClick={next}
              disabled={!canNext()}
              className="px-5 py-2 bg-blue-600 text-white rounded-md disabled:opacity-30"
            >
              다음 →
            </button>

          </div>

        )}

      </div>

    </div>

  );

}