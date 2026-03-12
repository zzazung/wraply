import { useState } from "react";

import { requestBuild } from "@/services/builds";

export default function BuildRequestModal({
  projectId,
  onClose,
  onCreated
}:{
  projectId:string;
  onClose:()=>void;
  onCreated:(jobId:string)=>void;
}){

  const [platform,setPlatform] = useState("android");

  const [appName,setAppName] = useState("");
  const [packageName,setPackageName] = useState("");
  const [serviceUrl,setServiceUrl] = useState("");
  const [scheme,setScheme] = useState("");

  const [loading,setLoading] = useState(false);

  async function handleBuild(){

    if(!appName || !packageName || !serviceUrl) return;

    try{

      setLoading(true);

      const job = await requestBuild(
        projectId,
        {
          platform,
          appName,
          packageName,
          serviceUrl,
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
            onChange={e=>setPlatform(e.target.value)}
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
            value={serviceUrl}
            onChange={e=>setServiceUrl(e.target.value)}
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