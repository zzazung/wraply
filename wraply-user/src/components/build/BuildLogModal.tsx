import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function BuildLogModal({
  open,
  onClose,
  logs
}:{
  open:boolean;
  onClose:()=>void;
  logs:string[];
}){

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    if(!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  },[logs]);

  if (!open) return null;

  return(

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="w-[900px] max-w-full bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* header */}
        <div className="flex justify-between items-center px-5 py-4 border-b">

          <div className="font-semibold text-sm">
            빌드 로그
          </div>

          <button onClick={onClose}>
            <X size={18} />
          </button>

        </div>

        {/* logs */}
        <div
          ref={ref}
          className="h-[450px] overflow-auto bg-black text-green-400 text-xs font-mono p-4 space-y-1"
        >
          {logs.map((log,i)=>{

            const isError = log.toLowerCase().includes("error");

            return(
              <div
                key={i}
                className={isError ? "text-red-400" : ""}
              >
                {log}
              </div>
            );

          })}
        </div>

      </div>

    </div>

  );

}