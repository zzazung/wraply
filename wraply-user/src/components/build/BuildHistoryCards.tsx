import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui";
import BuildStatus from "@/components/build/BuildStatus";

import { formatDate } from "@/utils/formatDate";
import type { Build } from "@/types/build";

export default function BuildHistoryCards({
  builds
}:{ builds:Build[] }){

  const navigate = useNavigate();

  if (builds.length === 0){

    return(
      <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
        아직 빌드 기록이 없습니다.
      </div>
    );

  }

  return(

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

      {builds.map(b=>{

        const isFailed = b.status === "FAILED";

        return(

          <Card
            key={b.jobId}
            onClick={()=>navigate(`/builds/${b.jobId}`)}
            className={`
              cursor-pointer transition
              hover:shadow-lg
              ${isFailed ? "border-red-500" : ""}
            `}
          >

            <CardContent className="p-4 space-y-3">

              {/* Header */}
              <div className="flex justify-between items-center">

                <div className="font-medium truncate">
                  {b.appName}
                </div>

                <BuildStatus status={b.status} />

              </div>

              {/* Job ID */}
              <div className="text-xs font-mono text-muted-foreground truncate">
                {b.jobId}
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground">
                {formatDate(b.createdAt)}
              </div>

              {/* 🔥 실패 UX */}
              {isFailed && b.error && (

                <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {b.error}
                </div>

              )}

            </CardContent>

          </Card>

        );

      })}

    </div>

  );

}