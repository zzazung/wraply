// src/components/build/SplashModal.tsx

import { useRef, useEffect, useState } from "react";
import { useAppBuildStore } from "@/stores/appBuildStore";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import UploadDropzone from "@/components/ui/UploadDropzone";

export default function SplashModal({ onClose }){

  const {
		editingSplashConfig,
		setEditingSplashConfig,
		commitEditing,
		cancelEditing
	} = useAppBuildStore();

  const bgPreview = useObjectUrl(editingSplashConfig.backgroundFile);
  const logoPreview = useObjectUrl(editingSplashConfig.logoFile);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(176);

	const imgRef = useRef<HTMLImageElement | null>(null);

	useEffect(()=>{
		if (!containerRef.current) return;
		setContainerWidth(containerRef.current.offsetWidth);
	},[]);

  function update(key,value){
    setEditingSplashConfig(prev => ({ ...prev, [key]:value }));
  }

  /* ---------------- drag & resize ---------------- */

  const drag = useRef(false);
  const resize = useRef(false);
  const resizeDir = useRef(null);
  const start = useRef({ x:0, y:0 });

  function onDragStart(e){
    e.stopPropagation();
    drag.current = true;
    resize.current = false;
    start.current = { x:e.clientX, y:e.clientY };
  }

  function onResizeStart(e,dir){
    e.stopPropagation();
    resize.current = true;
    drag.current = false;
    resizeDir.current = dir;
    start.current = { x:e.clientX, y:e.clientY };
  }

  function onMove(e){

    if (resize.current){
      const dx = e.clientX - start.current.x;

      let scale = editingSplashConfig.logoScale || 0.5;

			const delta = dx / containerWidth;

      if (["br","tr"].includes(resizeDir.current)){
        scale += dx / delta;
      }else{
        scale -= dx / delta;
      }

      scale = Math.max(0.2, Math.min(1, scale));

      update("logoScale", scale);

      start.current = { x:e.clientX, y:e.clientY };

			return;
		}

    if (drag.current && !resize.current){
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;

      update("offsetX",(editingSplashConfig.offsetX || 0) + dx);
      update("offsetY",(editingSplashConfig.offsetY || 0) + dy);

      start.current = { x:e.clientX, y:e.clientY };
    }
  }

  function onUp(){
    drag.current = false;
    resize.current = false;
  }

  /* ---------------- align ---------------- */

	function align(type){
		if (!imgRef.current) return;

		const W = containerWidth;
		const H = containerRef.current?.offsetHeight || 360;

		const scale = editingSplashConfig.logoScale || 0.5;

		const bezel = 6 * 2 / scale; // border 양쪽
		const contentWidth = W - bezel;
		const contentHeight = H - bezel;

		const logoW = contentWidth * scale;
		const logoH = logoW; // 현재 구조는 width 기준

		const halfW = contentWidth / 2;
		const halfH = contentHeight / 2;

		const offsetXMap = {
			l: -halfW + logoW/2,
			c: 0,
			r: halfW - logoW/2
		};

		const offsetYMap = {
			t: -halfH + logoH/2,
			c: 0,
			b: halfH - logoH/2
		};

		const [v,h] = type.split("");

		update("offsetX", offsetXMap[h]);
		update("offsetY", offsetYMap[v]);
	}

  /* ---------------- active align ---------------- */

  function getAlignKey(){

    const x = editingSplashConfig.offsetX || 0;
    const y = editingSplashConfig.offsetY || 0;

    const threshold = 20;

    const nx = x < -threshold ? -1 : x > threshold ? 1 : 0;
    const ny = y < -threshold ? -1 : y > threshold ? 1 : 0;

    const map = {
      "-1,-1":"tl",
      "0,-1":"tc",
      "1,-1":"tr",
      "-1,0":"cl",
      "0,0":"cc",
      "1,0":"cr",
      "-1,1":"bl",
      "0,1":"bc",
      "1,1":"br"
    };

    return map[`${nx},${ny}`];
  }

  const active = getAlignKey();

  /* ---------------- render ---------------- */

  return(

    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseMove={onMove}
      onMouseUp={onUp}
    >

      <div className="bg-white rounded-2xl w-[920px] p-6 space-y-6">

        {/* header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">스플래시 설정</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-6">

          {/* 좌측 */}
          <div className="space-y-6">

            {/* 배경 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">배경 이미지</div>
              <UploadDropzone
                label="배경 이미지"
                preview={bgPreview}
                onChange={(file)=>update("backgroundFile",file)}
              />
            </div>

            {/* 색상 */}
            <div>
              <div className="text-sm font-medium mb-2">배경 색상</div>
              <div className="flex gap-2">
                <input type="color"
                  value={editingSplashConfig.backgroundColor}
                  onChange={e=>{
                    update("backgroundColor",e.target.value);
                    update("backgroundFile",null);
                  }}
                />
                <input className="border px-2 rounded w-full"
                  value={editingSplashConfig.backgroundColor}
                  onChange={e=>update("backgroundColor",e.target.value)}
                />
              </div>
            </div>

            {/* 로고 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">로고 이미지</div>
              <UploadDropzone
                label="로고 이미지"
                preview={logoPreview}
                onChange={(file)=>update("logoFile",file)}
              />
            </div>

            {/* 정렬 */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">정렬</div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <div className="grid grid-cols-3 gap-2">

                  {[
                    {k:"tl",icon:"↖"},
                    {k:"tc",icon:"↑"},
                    {k:"tr",icon:"↗"},
                    {k:"cl",icon:"←"},
                    {k:"cc",icon:"●"},
                    {k:"cr",icon:"→"},
                    {k:"bl",icon:"↙"},
                    {k:"bc",icon:"↓"},
                    {k:"br",icon:"↘"}
                  ].map(({k,icon})=>{

                    const isActive = k === active;

                    return(
                      <button
                        key={k}
                        onClick={()=>align(k)}
                        className={`
                          h-11 rounded-lg border
                          flex items-center justify-center
                          text-base font-medium
                          transition

                          ${isActive
                            ? "bg-blue-100 border-blue-500 text-blue-600"
                            : "bg-white hover:bg-blue-50 hover:border-blue-400"
                          }

                          active:scale-95
                        `}
                      >
                        {icon}
                      </button>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* slider */}
            <div className="space-y-2">
              <div className="text-sm font-medium">영역 크기</div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.01}
                value={editingSplashConfig.logoScale || 0.5}
                onChange={e=>update("logoScale",Number(e.target.value))}
                className="w-full"
              />
            </div>

          </div>

          {/* preview */}
          <div className="bg-gray-100 rounded-xl flex items-center justify-center">

            <div
							ref={containerRef}
							className="relative w-44 h-[360px] rounded-[28px] border-[6px] border-gray-800 overflow-hidden"
						>

              {/* guide */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed"/>
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed"/>
              </div>

              {/* bg */}
              <div
                className="absolute inset-0"
                style={{
                  background: bgPreview
                    ? `url(${bgPreview}) center / cover`
                    : editingSplashConfig.backgroundColor
                }}
              />

              {/* logo */}
              {logoPreview && (
                <div
                  className="absolute"
                  style={{
                    left:`calc(50% + ${editingSplashConfig.offsetX||0}px)`,
                    top:`calc(50% + ${editingSplashConfig.offsetY||0}px)`,
                    transform:"translate(-50%, -50%)"
                  }}
                >
                  <div
										className="relative"
										style={{
											width:`${containerWidth * (editingSplashConfig.logoScale || 0.5)}px`
										}}
									>

                    <img
											ref={imgRef}
                      src={logoPreview}
                      onMouseDown={onDragStart}
                      className="cursor-move select-none w-full h-full"
                    />

                    {/* handles */}
                    {["tl","tr","bl","br"].map(p=>(
                      <div key={p}
                        onMouseDown={(e)=>onResizeStart(e,p)}
                        className={`
                          absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize
                          ${p==="tl" && "top-0 left-0 -translate-x-1/2 -translate-y-1/2"}
                          ${p==="tr" && "top-0 right-0 translate-x-1/2 -translate-y-1/2"}
                          ${p==="bl" && "bottom-0 left-0 -translate-x-1/2 translate-y-1/2"}
                          ${p==="br" && "bottom-0 right-0 translate-x-1/2 translate-y-1/2"}
                        `}
                      />
                    ))}

                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

				{/* footer */}
				<div className="flex justify-end gap-2 pt-4 border-t">

					{/* 취소 */}
					<button
						onClick={()=>{
							cancelEditing();
							onClose();
						}}
						className="
							px-4 py-2 rounded border
							bg-white hover:bg-gray-50
						"
					>
						취소
					</button>

					{/* 저장 */}
					<button
						onClick={()=>{
							commitEditing();
							onClose();
						}}
						className="
							px-4 py-2 rounded
							bg-blue-600 text-white
							hover:bg-blue-700
						"
					>
						저장
					</button>

				</div>

      </div>

    </div>
  );
}