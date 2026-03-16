import { useState,useEffect } from "react";

import { requestBuild,fetchProjectBuilds,getJob } from "@/services/builds";

import type { BuildJob } from "@/types/build";

export default function BuildRequestModal({
  projectId,
  onClose,
  onCreated
}:{
  projectId:string;
  onClose:()=>void;
  onCreated:(jobId:string)=>void;
}){

  const [platform,setPlatform] = useState<"android"|"ios">("android");

  const [appName,setAppName] = useState("");
  const [packageName,setPackageName] = useState("");
  const [url,setUrl] = useState("");
  const [scheme,setScheme] = useState("");

  const [loading,setLoading] = useState(false);

  /* 마지막 빌드 이력 자동완성 */

  useEffect(()=>{

    async function loadLastBuild(){

      try{

        const builds = await fetchProjectBuilds(projectId);

        if(!builds || builds.length === 0) return;

        const lastJob = builds[0] as BuildJob;

        const jobDetail = await getJob(lastJob.job_id);
        console.log(jobDetail);

        if(jobDetail.app_name){

          setAppName(jobDetail.app_name);

        }

        if(jobDetail.package_name){

          setPackageName(jobDetail.package_name);

        }

        if(jobDetail.url){

          setUrl(jobDetail.url);

        }

        if(jobDetail.scheme){

          setScheme(jobDetail.scheme);

        }

        if(jobDetail.platform){

          setPlatform(jobDetail.platform);

        }

      }catch{

        /* ignore */

      }

    }

    loadLastBuild();

  },[projectId]);

  async function handleBuild(){

    if(!appName || !packageName || !url) return;

    if(platform==="ios" && !scheme) return;

    try{

      setLoading(true);

      const job = await requestBuild(
        projectId,
        {
          platform,
          appName,
          packageName,
          url,
          scheme:platform==="ios"?scheme:null
        }
      );

      onCreated(job.jobId);
      onClose();

    }finally{

      setLoading(false);

    }

  }

  return(

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-card border border-border rounded-lg w-[460px] p-6 space-y-5 shadow-lg">

        <h2 className="text-lg font-semibold">
          새 빌드 요청
        </h2>

        <div className="space-y-3">

          <select
            value={platform}
            onChange={e=>setPlatform(e.target.value as "android"|"ios")}
            className="w-full border border-border rounded-md px-3 py-2"
          >
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>

          <input
            value={appName}
            onChange={e=>setAppName(e.target.value)}
            placeholder="앱 이름"
            className="w-full border border-border rounded-md px-3 py-2"
          />

          <input
            value={packageName}
            onChange={e=>setPackageName(e.target.value)}
            placeholder="패키지 명"
            className="w-full border border-border rounded-md px-3 py-2"
          />

          <input
            value={url}
            onChange={e=>setUrl(e.target.value)}
            placeholder="서비스 URL"
            className="w-full border border-border rounded-md px-3 py-2"
          />

          {platform==="ios" && (

            <input
              value={scheme}
              onChange={e=>setScheme(e.target.value)}
              placeholder="iOS Scheme"
              className="w-full border border-border rounded-md px-3 py-2"
            />

          )}

        </div>

        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={onClose}
            className="border border-border px-3 py-2 rounded-md hover:bg-muted transition"
          >
            취소
          </button>

          <button
            disabled={loading}
            onClick={handleBuild}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 active:scale-95 transition"
          >
            {loading ? "빌드 요청 중..." : "빌드 시작"}
          </button>

        </div>

      </div>

    </div>

  );

}