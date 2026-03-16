import { Link, useNavigate } from "react-router-dom";
import BuildStatusBadge from "@/components/build/BuildStatusBadge";
import { formatDate } from "@/utils/formatDate";
import type { BuildJob } from "@/types/build";

function normalizeStatus(status:string){

  if(status==="finished") return "success";

  if(
    status==="preparing"||
    status==="patching"||
    status==="building"||
    status==="signing"||
    status==="uploading"
  ){
    return "running";
  }

  return status;

}

export default function BuildHistoryTable({
  builds
}:{
  builds:BuildJob[]
}){

  const navigate = useNavigate();

  if(builds.length===0){

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

            <th className="text-left px-4 py-3">진행률</th>

            <th className="text-left px-4 py-3">생성 시간</th>

          </tr>

        </thead>

        <tbody>

          {builds.map(job=>(

            <tr
              key={job.job_id}
              onClick={()=>openBuild(job.job_id)}
              className="border-t border-border hover:bg-muted/50 transition cursor-pointer"
            >

              <td className="px-4 py-3">

                {/* <Link
                  to={`/builds/${job.job_id}`}
                  onClick={(e)=>e.stopPropagation()}
                  className="text-primary hover:underline"
                > */}

                  {job.job_id}

                {/* </Link> */}

              </td>

              <td className="px-4 py-3">

                <BuildStatusBadge
                  status={normalizeStatus(job.status)}
                />

              </td>

              <td className="px-4 py-3">

                {job.progress}%

              </td>

              <td className="px-4 py-3 text-muted-foreground">

                {formatDate(job.created_at)}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}