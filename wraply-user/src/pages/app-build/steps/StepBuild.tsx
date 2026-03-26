import { createJob } from "@/services/builds";
import { useProjectStore } from "@/stores/projectStore";
import { useAppBuildStore } from "@/stores/appBuildStore";
import { useBuildStore } from "@/stores/buildStore";

export default function StepBuild(){

  const project = useProjectStore(s=>s.currentProject);

  const { buildPayload, next } = useAppBuildStore();
  const { setJob } = useBuildStore();

  async function handleBuild(){

    if (!project){
      alert("프로젝트를 선택해주세요");
      return;
    }

    const payload = buildPayload();

    const res = await createJob({
      projectId: project.id,
      ...payload
    });

    setJob(res.jobId);   // 🔥 핵심

    next();              // StepProgress 이동
  }

  return(

    <div className="text-center space-y-6">

      <h1 className="text-xl font-semibold">
        빌드 실행
      </h1>

      <button
        onClick={handleBuild}
        className="bg-blue-500 text-white px-6 py-3 rounded"
      >
        빌드하기
      </button>

    </div>

  );

}