import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProjectBuilds } from "@/services/builds";

import PageHeader from "@/components/layout/PageHeader";
import BuildStatusBadge from "@/components/build/BuildStatusBadge";
import Spinner from "@/components/ui/Spinner";

import type { Build } from "@/types/build";

import { getBuildProgress } from "@/utils/buildProgress";
import { formatDate } from "@/utils/formatDate";

export default function BuildCenterPage(){

  const navigate = useNavigate();

  const [items,setItems] = useState<Build[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    async function load(){

      try{

        const data = await fetchProjectBuilds();

        setItems(data);

      }
      finally{

        setLoading(false);

      }

    }

    load();

  },[]);

  if(loading){

    return(

      <div className="flex items-center justify-center h-[320px]">

        <Spinner />

      </div>

    );

  }

  return(

    <div className="space-y-6">

      <Header />

      <BuildTable
        builds={items}
        onOpen={(jobId)=>navigate(`/builds/${jobId}`)}
      />

    </div>

  );

}

function Header(){

  return(

    <div className="flex justify-between items-center">

      <div>

        {/* <h1 className="text-2xl font-semibold">

          빌드 센터

        </h1> */}

        <PageHeader
          title="빌드 센터"
          breadcrumbs={[
            { label:"빌드 센터" }
          ]}
        />

        <div className="text-sm text-muted-foreground">

          모든 프로젝트의 빌드 상태를 확인할 수 있습니다.

        </div>

      </div>

    </div>

  );

}

function BuildTable({

  builds,
  onOpen

}:{

  builds:Build[];
  onOpen:(jobId:string)=>void;

}){

  if(builds.length===0){

    return(

      <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">

        아직 생성된 빌드가 없습니다.

      </div>

    );

  }

  return(

    <div className="bg-card border border-border rounded-lg overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-muted/40 text-muted-foreground">

          <tr>

            <th className="text-left px-4 py-3">

              Job ID

            </th>

            <th className="text-left px-4 py-3">

              플랫폼

            </th>

            <th className="text-left px-4 py-3">

              상태

            </th>

            <th className="text-left px-4 py-3">

              진행률

            </th>

            <th className="text-left px-4 py-3">

              생성 시간

            </th>

            <th className="text-right px-4 py-3">

              액션

            </th>

          </tr>

        </thead>

        <tbody>

          {builds.map(build=>(

            <Row
              key={build.jobId}
              build={build}
              onOpen={onOpen}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}

function Row({

  build,
  onOpen

}:{

  build:Build;
  onOpen:(jobId:string)=>void;

}){

  const progress = getBuildProgress(build.status);

  return(

    <tr
      className="
      border-t
      border-border
      hover:bg-muted/40
      transition
      "
    >

      <td className="px-4 py-3 font-mono text-xs">

        {build.jobId}

      </td>

      <td className="px-4 py-3">

        {build.platform==="android" ? "Android" : "iOS"}

      </td>

      <td className="px-4 py-3">

        <BuildStatusBadge status={build.status} />

      </td>

      <td className="px-4 py-3 w-[220px]">

        <ProgressBar value={progress} />

      </td>

      <td className="px-4 py-3 text-muted-foreground">

        {formatDate(build.createdAt)}

      </td>

      <td className="px-4 py-3 text-right">

        <button
          onClick={()=>onOpen(build.jobId)}
          className="
          text-primary
          hover:underline
          active:opacity-70
          "
        >

          상세 보기

        </button>

      </td>

    </tr>

  );

}

function ProgressBar({ value }:{ value:number }){

  return(

    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">

      <div
        className="
        h-full
        bg-primary
        transition-all
        duration-500
        "
        style={{ width:`${value}%` }}
      />

    </div>

  );

}