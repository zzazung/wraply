import { QRCodeSVG } from "qrcode.react";

import type { Artifact } from "@/types/artifact";

interface Props{
  artifact:Artifact;
  onClose:()=>void;
}

export default function InstallQR({ artifact,onClose }:Props){

  const installUrl = `${window.location.origin}/install/${artifact.id}`;

  return(

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-card border border-border rounded-lg p-6 w-[320px] text-center space-y-4">

        <div className="font-medium">
          모바일 설치
        </div>

        <QRCodeSVG
          value={installUrl}
          size={180}
        />

        <div className="text-xs text-muted-foreground">
          모바일 기기로 QR 코드를 스캔하세요
        </div>

        <button
          onClick={onClose}
          className="
          w-full
          border
          border-border
          py-2
          rounded-md
          hover:bg-muted
          transition
          "
        >
          닫기
        </button>

      </div>

    </div>

  );

}