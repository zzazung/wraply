// src/pages/app-build/steps/StepUI.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";
import SplashModal from "../../../components/build/SplashModal";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { useState } from "react";

export default function StepUI(){

  const { splashConfig, startEditing } = useAppBuildStore();

  const [open, setOpen] = useState(false);

  const bgPreview = useObjectUrl(splashConfig.backgroundFile);
  const logoPreview = useObjectUrl(splashConfig.logoFile);

  return(

    <div className="max-w-3xl mx-auto space-y-10">

      {/* 타이틀 */}
      <div className="text-center space-y-2">

        <h1 className="text-2xl font-semibold">
          UX/UI 설정
        </h1>

        <p className="text-sm text-gray-500">
          앱의 주요 화면 요소를 설정하고 브랜딩을 완성해 보세요
        </p>

      </div>

      {/* ---------------- 스플래시 ---------------- */}
      <div className="space-y-4">

        <div className="flex justify-between items-center">

          <h2 className="text-sm font-medium">
            스플래시
          </h2>

          <span className="text-sm text-gray-400">
            디바이스를 클릭하여 스플래시 화면을 설정하세요
          </span>

        </div>

        {/* 디바이스 프리뷰 */}
        <div
          onClick={()=>{
            startEditing();
            setOpen(true);
          }}
          className="
            bg-gray-100 rounded-2xl p-10 flex justify-center
            cursor-pointer hover:bg-gray-200 transition
          "
        >

          <div className="
            relative w-28 h-52 border-4 border-gray-800
            rounded-2xl overflow-hidden
          ">

            {/* background */}
            <div
              className="absolute inset-0"
              style={{
                background: bgPreview
                  ? `url(${bgPreview}) center / cover`
                  : splashConfig.backgroundColor
              }}
            />

            {/* logo */}
            {logoPreview && (
              <div
                className="absolute"
                style={{
                  left:`calc(50% + ${splashConfig.offsetX || 0}px)`,
                  top:`calc(50% + ${splashConfig.offsetY || 0}px)`,
                  transform:"translate(-50%, -50%)"
                }}
              >
                <img
                  src={logoPreview}
                  className="pointer-events-none select-none"
                  style={{
                    width:`${112 * (splashConfig.logoScale || 0.5)}px`
                  }}
                />
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ---------------- 로딩 인디케이터 ---------------- */}
      <div className="space-y-4">

        <div className="flex justify-between items-center">

          <h2 className="text-sm font-medium">
            로딩 인디케이터
          </h2>

          <span className="text-sm text-gray-400">
            디바이스를 클릭하여 설정하세요
          </span>

        </div>

        <div className="bg-gray-100 rounded-2xl p-10 flex justify-center">

          <div className="
            w-28 h-52 border-4 border-gray-800
            rounded-2xl bg-white flex items-center justify-center
          ">

            <div className="
              w-6 h-6 border-2 border-gray-400
              border-t-transparent rounded-full animate-spin
            "/>

          </div>

        </div>

      </div>

      {open && (
        <SplashModal onClose={()=>setOpen(false)} />
      )}

    </div>

  );

}