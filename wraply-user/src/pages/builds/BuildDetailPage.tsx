import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Check, X } from "lucide-react";

import InstallModal from "@/components/common/InstallModal";
import BuildTimeline from "@/components/build/BuildTimeline";

import { getJob, fetchArtifacts } from "@/services/builds";
import { useBuildStore } from "@/stores/buildStore";

export default function BuildDetailPage(){

  const { jobId } = useParams<{ jobId:string }>();

  const build = useBuildStore(s=> jobId ? s.builds[jobId] : undefined);
  const setArtifacts = useBuildStore(s=>s.setArtifacts);

  const artifacts = useBuildStore(s=> jobId ? s.artifacts[jobId] : []);

  const [installId, setInstallId] = useState<string|null>(null);
  const [showResult, setShowResult] = useState(false);

  const status = build?.status?.toLowerCase();
  const isFinished = status === "finished";
  const isFailed = status === "failed";

  useEffect(()=>{

    if (!jobId) return;

    getJob(jobId).then(b=>{
      useBuildStore.getState().updateBuild(b);
    });

  },[jobId]);

  useEffect(()=>{

    if (!isFinished) return;

    fetchArtifacts(jobId!).then(items=>{
      setArtifacts(jobId!, items);
    });

  },[isFinished]);

  useEffect(()=>{

    if (!isFinished && !isFailed) return;

    setShowResult(true);

  },[isFinished, isFailed]);

  useEffect(()=>{

    if (!isFinished) return;
    if (!artifacts || artifacts.length === 0) return;

    const t = setTimeout(()=>{
      setInstallId(artifacts[0].id);
    }, 800);

    return ()=>clearTimeout(t);

  },[isFinished, artifacts]);

  return(

    <div className="p-6">

      {/* 진행 중 */}
      {!isFinished && !isFailed && (
        <BuildTimeline build={build} />
      )}

      {/* 결과 */}
      {(isFinished || isFailed) && showResult && (

        <div className="text-center space-y-8 py-20">

          <div className={`
            w-24 h-24 mx-auto rounded-full flex items-center justify-center
            ${isFinished ? "bg-green-500" : "bg-red-500"}
          `}>
            {isFinished
              ? <Check className="w-12 h-12 text-white stroke-[3]" />
              : <X className="w-12 h-12 text-white stroke-[3]" />
            }
          </div>

          <h1 className="text-4xl font-bold">
            {isFinished ? "앱 빌드 완료" : "빌드 실패"}
          </h1>

          <p className="text-gray-500">
            {isFinished ? "설치를 진행합니다" : "로그를 확인해주세요"}
          </p>

        </div>

      )}

      {/* 설치 */}
      {installId && (
        <InstallModal
          artifactId={installId}
          onClose={()=>setInstallId(null)}
        />
      )}

    </div>

  );

}