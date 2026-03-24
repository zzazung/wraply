import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, CardContent } from "@/components/ui";

import { useProjects } from "@/hooks/useProjects";
import { useBuild } from "@/hooks/useBuild";

import { formatDate } from "@/utils/formatDate";

function StatusBadge({ status }:{ status:string }){

  const map:any = {
    PREPARING: "bg-gray-200 text-gray-700",
    BUILDING: "bg-blue-100 text-blue-700",
    SIGNING: "bg-purple-100 text-purple-700",
    UPLOADING: "bg-yellow-100 text-yellow-700",
    FINISHED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700"
  };

  return(
    <span className={`text-xs px-2 py-1 rounded ${map[status]}`}>
      {status}
    </span>
  );

}

export default function DashboardPage(){

  const navigate = useNavigate();

  const { projects } = useProjects();
  const { builds, fetchRecentBuilds } = useBuild();

  useEffect(()=>{
    fetchRecentBuilds();
  },[]);

  const running = builds.filter(
    b => b.status !== "FINISHED" && b.status !== "FAILED"
  );

  return(

    <div className="p-8 space-y-10">

      {/* HERO */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground">
            최근 빌드와 프로젝트 상태
          </p>
        </div>

        <Button onClick={()=>navigate("/projects/new")}>
          + New App
        </Button>

      </div>

      {/* Running */}
      {running.length > 0 && (

        <div className="space-y-4">

          <h2 className="text-sm font-medium text-muted-foreground">
            Running
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            {running.map(b=>(
              <Card
                key={b.jobId}
                onClick={()=>navigate(`/builds/${b.jobId}`)}
                className="cursor-pointer hover:shadow-md transition"
              >
                <CardContent className="p-4 space-y-2">

                  <div className="flex justify-between items-center">

                    <div className="font-medium">
                      {b.appName}
                    </div>

                    <StatusBadge status={b.status} />

                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDate(b.createdAt)}
                  </div>

                </CardContent>
              </Card>
            ))}

          </div>

        </div>

      )}

      {/* Recent */}
      <div className="space-y-4">

        <h2 className="text-sm font-medium text-muted-foreground">
          Recent Builds
        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          {builds.slice(0,6).map(b=>(
            <Card
              key={b.jobId}
              onClick={()=>navigate(`/builds/${b.jobId}`)}
              className="cursor-pointer hover:shadow-md transition"
            >
              <CardContent className="p-4 space-y-2">

                <div className="flex justify-between items-center">

                  <div className="font-medium">
                    {b.appName}
                  </div>

                  <StatusBadge status={b.status} />

                </div>

                <div className="text-xs text-muted-foreground">
                  {formatDate(b.createdAt)}
                </div>

              </CardContent>
            </Card>
          ))}

        </div>

      </div>

    </div>

  );

}