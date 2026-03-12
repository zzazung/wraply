import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import type { Artifact } from "@/types/artifact";

import { fetchArtifact } from "@/services/artifacts";

import { formatFileSize } from "@/utils/formatDate";

export default function InstallPage(){

  const { artifactId } = useParams();

  const [artifact,setArtifact] = useState<Artifact | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);

  useEffect(()=>{

    if(!artifactId) return;

    let cancelled = false;

    async function load(){

      try{

        const data = await fetchArtifact(artifactId);

        if(!cancelled) setArtifact(data);

      }catch(e){

        console.error("artifact fetch error",e);

        if(!cancelled) setError("설치 정보를 불러오지 못했습니다.");

      }finally{

        if(!cancelled) setLoading(false);

      }

    }

    load();

    return ()=>{

      cancelled = true;

    };

  },[artifactId]);

  if(loading){

    return(

      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">

        설치 정보를 불러오는 중입니다...

      </div>

    );

  }

  if(error){

    return(

      <div className="flex items-center justify-center min-h-screen text-red-500 text-sm">

        {error}

      </div>

    );

  }

  if(!artifact){

    return(

      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">

        설치 파일을 찾을 수 없습니다.

      </div>

    );

  }

  function handleInstall(){

    window.location.href = artifact.downloadUrl;

  }

  return(

    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">

      <div className="max-w-sm w-full bg-card border border-border rounded-lg p-6 text-center space-y-6">

        <div className="text-lg font-semibold">
          앱 설치
        </div>

        <div className="text-sm text-muted-foreground">
          {artifact.platform === "android" ? "Android APK" : "iOS 앱"}
        </div>

        <button
          onClick={handleInstall}
          className="w-full bg-primary text-primary-foreground py-3 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
        >
          설치하기
        </button>

        <div className="text-xs text-muted-foreground">
          파일 크기 {formatFileSize(artifact.size)}
        </div>

        <div className="text-left text-xs text-muted-foreground space-y-1">

          <div className="font-medium text-foreground">
            설치 안내
          </div>

          <div>
            1. 다운로드 버튼을 눌러 APK 파일을 받습니다.
          </div>

          <div>
            2. 보안 경고가 나오면 "알 수 없는 앱 허용"을 선택합니다.
          </div>

          <div>
            3. 설치를 진행합니다.
          </div>

        </div>

      </div>

    </div>

  );

}