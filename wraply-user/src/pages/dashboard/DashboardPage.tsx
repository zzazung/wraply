import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkflowStore } from "@/stores/workflowStore";
import { fetchWorkflow } from "@/services/workflows";

import WorkflowTimeline from "@/components/workflow/WorkflowTimeline";

export default function DashboardPage(){

  const project = useProjectStore(s=>s.currentProject);

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const steps = useWorkflowStore(s=>s.steps);
  const setSteps = useWorkflowStore(s=>s.setSteps);

  useEffect(()=>{

    if(!project) return;

    fetchWorkflow(project.workflowId)
      .then(res=>{
        setWorkflow(res.workflow);
        setSteps(res.steps);
      })
      .finally(()=>setLoading(false));

  },[project]);

  if(!project){
    return <div className="p-10">프로젝트 선택 필요</div>;
  }

  if(loading){
    return <div className="p-10">로딩중...</div>;
  }

  return(

    <div className="p-8 max-w-4xl mx-auto space-y-8">

      <div>

        <h1 className="text-2xl font-semibold">
          {project.name}
        </h1>

        <div className="text-sm text-gray-500 mt-1">
          Workflow 상태: {workflow?.status}
        </div>

      </div>

      <WorkflowTimeline steps={steps} />

    </div>

  );

}