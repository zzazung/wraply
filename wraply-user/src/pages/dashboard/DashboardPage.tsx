import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import EmptyProjects from "@/components/projects/EmptyProjects";
import { Button, Card, CardContent } from "@/components/ui";

import { useProjects } from "@/hooks/useProjects";
import { useBuild } from "@/hooks/useBuild";
import { useWebSocket } from "@/hooks/useWebSocket";

import { formatDate } from "@/utils/formatDate";
import {
  getBuildStatusLabel,
  getBuildStatusColor
} from "@/utils/buildStatus";

export default function DashboardPage(){

  const navigate = useNavigate();

  const { projects } = useProjects();
  const { builds, fetchRecentBuilds } = useBuild();

  useWebSocket();

  useEffect(()=>{
    fetchRecentBuilds();
  },[]);

  const runningBuilds = builds.filter(
    b => b.status !== "FINISHED" && b.status !== "FAILED"
  );

  if (!projects || projects.length === 0) {

    return <EmptyProjects />;

  }
  else {

    return(

      <div className="p-8 space-y-10">

        {/* HERO */}
        <div className="flex flex-col items-center text-center space-y-4">

          <h1 className="text-3xl font-semibold">
            웹을 앱으로 만들어보세요
          </h1>

          <p className="text-muted-foreground">
            URL 하나로 Android / iOS 앱을 생성합니다
          </p>

          <Button
            className="mt-4 px-6 py-3 text-base"
            onClick={()=>navigate("/projects")}
          >
            새 앱 만들기
          </Button>

        </div>

        {/* 진행 중 빌드 */}
        {runningBuilds.length > 0 && (

          <div className="space-y-4">

            <h2 className="text-lg font-semibold">
              진행 중
            </h2>

            <div className="grid gap-4">

              {runningBuilds.map(b => (

                <Card
                  key={b.jobId}
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={()=>navigate(`/builds/${b.jobId}`)}
                >

                  <CardContent className="flex items-center justify-between">

                    <div>
                      <div className="font-medium">
                        {b.appName}
                      </div>

                      <div className={`text-sm ${getBuildStatusColor(b.status)}`}>
                        ● {getBuildStatusLabel(b.status)}
                      </div>
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

        {/* 최근 작업 */}
        <div className="space-y-4">

          <h2 className="text-lg font-semibold">
            최근 작업
          </h2>

          <div className="grid gap-4">

            {builds.slice(0,5).map(b => (

              <Card
                key={b.jobId}
                className="cursor-pointer hover:shadow-md transition"
                onClick={()=>navigate(`/builds/${b.jobId}`)}
              >

                <CardContent className="flex items-center justify-between">

                  <div>
                    <div className="font-medium">
                      {b.appName}
                    </div>

                    <div className={`text-sm ${getBuildStatusColor(b.status)}`}>
                      {getBuildStatusLabel(b.status)}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDate(b.createdAt)}
                  </div>

                </CardContent>

              </Card>

            ))}

          </div>

        </div>

        {/* 프로젝트 */}
        <div className="space-y-4">

          <h2 className="text-lg font-semibold">
            프로젝트
          </h2>

          <div className="grid gap-4">

            {projects.slice(0,5).map(p => (

              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition"
                onClick={()=>navigate(`/projects/${p.id}`)}
              >

                <CardContent className="flex items-center justify-between">

                  <div className="font-medium">
                    {p.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </div>

                </CardContent>

              </Card>

            ))}

          </div>

        </div>

      </div>

    );

  }

}