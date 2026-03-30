// components/ui/UploadDropzone.tsx

import { useRef, useState } from "react";

export default function UploadDropzone({
  label,
  onChange,
  preview
}){

  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleDrop(e){
    e.preventDefault();
    e.stopPropagation();

    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    onChange(file);
  }

  function handleClick(){
    inputRef.current?.click();
  }

  function handleDragLeave(e){
    // 🔥 자식 요소 때문에 dragleave 튀는 문제 방지
    if (!e.currentTarget.contains(e.relatedTarget)){
      setDragging(false);
    }
  }

  return(

    <div
      onClick={handleClick}
      onDragEnter={()=>setDragging(true)}
      onDragLeave={handleDragLeave}
      onDragOver={(e)=>e.preventDefault()}
      onDrop={handleDrop}
      className={`
        relative h-32 rounded-xl border-2 border-dashed
        flex items-center justify-center
        transition-all cursor-pointer overflow-hidden group

        ${dragging
          ? "border-blue-500 bg-blue-50 scale-[1.03] shadow-lg"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }
      `}
    >

      {/* hidden input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(e)=>{
          const file = e.target.files?.[0];
          if (!file) return;
          onChange(file);
        }}
      />

      {/* preview */}
      {preview ? (

        <>
          <img
            src={preview}
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* dark overlay */}
          <div className="
            absolute inset-0 bg-black/40 opacity-0
            group-hover:opacity-100 transition
          "/>

          {/* action UI */}
          <div className="
            absolute inset-0 flex flex-col items-center justify-center
            opacity-0 group-hover:opacity-100 transition text-white
          ">

            <div className="text-sm font-medium">이미지 변경</div>

            <div className="text-xs opacity-80">
              클릭 또는 드래그
            </div>

          </div>

        </>

      ) : (

        <div className="flex flex-col items-center gap-2 text-gray-400">

          <div className={`
            text-2xl transition
            ${dragging ? "scale-125 text-blue-500" : ""}
          `}>
            ⬆️
          </div>

          <div className="text-sm font-medium">
            {dragging ? "여기에 놓기" : label}
          </div>

          <div className="text-xs text-gray-400">
            PNG, JPG, SVG
          </div>

        </div>

      )}

      {/* drag overlay (핵심) */}
      {dragging && (
        <div className="
          absolute inset-0 border-2 border-blue-500 rounded-xl
          animate-pulse pointer-events-none
        "/>
      )}

    </div>

  );

}