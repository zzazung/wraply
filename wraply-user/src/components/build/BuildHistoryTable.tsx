import { useNavigate } from "react-router-dom";
import BuildStatusBadge from "@/components/build/BuildStatusBadge";
import { formatDate } from "@/utils/formatDate";
import type { Build } from "@/types/build";

function normalizeStatus(status:string){

  if (status === "FINISHED") return "success";

  if (
    status === "PREPARING" ||
    status === "PATCHING" ||
    status === "BUILDING" ||
    status === "SIGNING" ||
    status === "UPLOADING"
  ){
    return "running";
  }

  return status.toLowerCase();

}

export default function BuildHistoryTable({
  builds
}:{
  builds:Build[]
}){

  const navigate = useNavigate();

  if (builds.length === 0){

    return(
      <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
        아직 빌드 기록이 없습니다.
      </div>
    );

  }

  function openBuild(jobId:string){
    navigate(`/builds/${jobId}`);
  }

  return(

    <div className="bg-card border border-border rounded-lg overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-muted">

          <tr>
            <th className="text-left px-4 py-3">Job</th>
            <th className="text-left px-4 py-3">상태</th>
            <th className="text-left px-4 py-3">생성 시간</th>
          </tr>

        </thead>

        <tbody>

          {builds.map((job)=>(

            <tr
              key={job.jobId}   // 🔥 완전 해결
              onClick={()=>openBuild(job.jobId)}
              className="border-t border-border hover:bg-muted/50 transition cursor-pointer"
            >

              <td className="px-4 py-3 font-mono text-xs">
                {job.jobId}
              </td>

              <td className="px-4 py-3">

                <BuildStatusBadge
                  status={normalizeStatus(job.status)}
                />

              </td>

              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(job.createdAt)}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}