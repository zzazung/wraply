import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

import { fetchArtifact } from "@/services/artifacts";

interface Props{
  artifactId:string;
  onClose:()=>void;
}

export default function InstallModal({ artifactId, onClose }:Props){

  const [artifact,setArtifact] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);

  const ua = navigator.userAgent;

  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isMobile = isIOS || isAndroid;

  /* body scroll lock */
  useEffect(()=>{
    document.body.style.overflow = "hidden";
    return ()=>{ document.body.style.overflow = ""; };
  },[]);

  /* ESC close */
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  },[onClose]);

  /* fetch */
  useEffect(()=>{

    const controller = new AbortController();

    async function load(){

      try{
        const data = await fetchArtifact(artifactId, {
          signal: controller.signal
        });
        setArtifact(data);
      }catch(err:any){
        if (err.name !== "AbortError"){
          setError("설치 정보를 불러오지 못했습니다");
        }
      }finally{
        setLoading(false);
      }

    }

    load();

    return ()=>controller.abort();

  },[artifactId]);

  function install(){

    if (!artifact) return;

    if (isIOS && !isSafari){
      return;
    }

    if (isIOS && artifact.installUrl){
      window.location.href = artifact.installUrl;
      return;
    }

    if (isAndroid && artifact.downloadUrl){
      window.location.href = artifact.downloadUrl;
      return;
    }

    window.open(artifact.downloadUrl);

  }

  const installUrl =
    artifact?.installUrl ||
    `${window.location.origin}/install/${artifactId}`;

  /* loading */
  if (loading){
    return(
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-card p-4 rounded">로딩 중...</div>
      </div>
    );
  }

  /* error */
  if (error){
    return(
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-card p-4 rounded space-y-3">
          <div className="text-sm text-red-500 text-center">{error}</div>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  if (!artifact) return null;

  return(

    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >

      <div
        className="bg-card border border-border rounded-xl p-6 w-[360px] space-y-4"
        onClick={(e)=>e.stopPropagation()}
      >

        {/* header */}
        <div className="text-center space-y-1">
          <div className="font-semibold">앱 설치</div>
          <div className="text-xs text-muted-foreground">
            {artifact.name}
          </div>
        </div>

        {/* 모바일 */}
        {isMobile && (
          <Button className="w-full" onClick={install}>
            {isIOS ? "iPhone에 설치" : "앱 설치"}
          </Button>
        )}

        {/* iOS 안내 */}
        {isIOS && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            Safari에서 열어주세요. 설치 후
            설정 → 일반 → VPN 및 기기 관리 → 신뢰
          </div>
        )}

        {/* Android 안내 */}
        {isAndroid && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            설치가 안되면 "알 수 없는 앱 허용"을 켜주세요
          </div>
        )}

        {/* desktop → QR */}
        {!isMobile && (
          <div className="flex flex-col items-center space-y-3">
            <QRCodeSVG value={installUrl} size={180} />
            <div className="text-xs text-muted-foreground text-center">
              모바일에서 QR을 스캔하세요
            </div>
          </div>
        )}

        {/* download */}
        <Button
          variant="outline"
          className="w-full"
          onClick={()=>window.open(artifact.downloadUrl)}
        >
          파일 다운로드
        </Button>

        {/* close */}
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground w-full"
        >
          닫기
        </button>

      </div>

    </div>

  );

}