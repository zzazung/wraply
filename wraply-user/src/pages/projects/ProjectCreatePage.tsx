import { useProjects } from "@/hooks/useProjects";
import { useBuild } from "@/hooks/useBuild";

import BuildCard from "@/components/build/BuildCard";
import BuildHistoryTable from "@/components/build/BuildHistoryTable";
import BuildLauncher from "@/components/build/BuildLauncher";
import BuildEmpty from "@/components/build/BuildEmpty";

export default function BuildCenterPage(){

  const builds = useBuild();

  const running = builds.filter(
    (b)=>b.status === "running"
  );

  const queued = builds.filter(
    (b)=>b.status === "queued"
  );

  const history = builds.filter(
    (b)=>b.status === "finished" || b.status === "failed"
  );

  return(

    <div className="space-y-10">

      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-semibold">
          빌드 센터
        </h1>

        <BuildLauncher/>

      </div>

      {/* Running Builds */}

      <section className="space-y-4">

        <h2 className="text-lg font-semibold">
          진행 중 빌드
        </h2>

        {running.length === 0 ? (

          <BuildEmpty label="진행 중인 빌드가 없습니다"/>

        ) : (

          <div className="grid gap-4 md:grid-cols-2">

            {running.map((build)=>(
              <BuildCard
                key={build.jobId}
                build={build}
              />
            ))}

          </div>

        )}

      </section>

      {/* Queue */}

      <section className="space-y-4">

        <h2 className="text-lg font-semibold">
          대기 중 빌드
        </h2>

        {queued.length === 0 ? (

          <BuildEmpty label="대기 중인 빌드가 없습니다"/>

        ) : (

          <div className="grid gap-4 md:grid-cols-2">

            {queued.map((build)=>(
              <BuildCard
                key={build.jobId}
                build={build}
              />
            ))}

          </div>

        )}

      </section>

      {/* History */}

      <section className="space-y-4">

        <h2 className="text-lg font-semibold">
          최근 빌드
        </h2>

        <BuildHistoryTable builds={history}/>

      </section>

    </div>

  );

}