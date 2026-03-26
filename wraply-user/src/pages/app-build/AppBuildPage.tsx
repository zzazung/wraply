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

	const init = useAppBuildStore(s=>s.initFromProject);
  const step = useAppBuildStore(s=>s.step);
  const reset = useAppBuildStore(s=>s.reset);

  useEffect(()=>{

    if (project){
      init(project);   // 🔥 프로젝트 값으로 초기화
    }

    return ()=>{
      // 🔥 페이지 나갈 때 초기화
      reset();
    };

  },[]);

  return(

    <div className="p-10">

      <StepHeader />

      {step === 1 && <StepOS />}
      {step === 2 && <StepBasic />}
      {step === 3 && <StepVersion />}
      {step === 4 && <StepUI />}
      {step === 5 && <StepAdvanced />}
      {step === 6 && <StepBuild />}
      {step === 7 && <StepProgress />}
      {step === 8 && <StepDone />}

    </div>

  );

}