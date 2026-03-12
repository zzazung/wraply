import { Link } from "react-router-dom";

import BuildStatusBadge from "@/components/build/BuildStatusBadge";

import { formatDate } from "@/utils/formatDate";

import type { BuildJob } from "@/types/build";

export default function BuildHistoryTable({

  builds

}:{

  builds:BuildJob[]

}){

  if(builds.length === 0){

    return(

      <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">

        아직 빌드 기록이 없습니다.

      </div>

    );

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
              key={job.id}
              className="border-t border-border hover:bg-muted/50 transition"
            >

              <td className="px-4 py-3">

                <Link
                  to={`/builds/${job.id}`}
                  className="text-primary hover:underline"
                >

                  {job.id}

                </Link>

              </td>

              <td className="px-4 py-3">

                <BuildStatusBadge status={job.status} />

              </td>

              <td className="px-4 py-3">

                {job.progress}%

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