// src/components/ProjectSwitcher.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProjectStore } from "@/stores/projectStore";
import { fetchProjects } from "@/services/projects";

export default function ProjectSwitcher(){

  const navigate = useNavigate();

  const current = useProjectStore(s=>s.currentProject);
  const setProject = useProjectStore(s=>s.setCurrentProject);

  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(()=>{
    fetchProjects().then(setProjects);
  },[]);

  function handleSelect(p:any){
    setProject(p);
    setOpen(false);

    // 🔥 핵심: 현재 페이지 유지하면서 context만 변경
    navigate("/dashboard");
  }

  return(

    <div className="relative">

      {/* 버튼 */}
      <button
        onClick={()=>setOpen(v=>!v)}
        className="
          flex items-center gap-2
          px-3 py-2
          rounded-lg
          hover:bg-gray-100
        "
      >
        <span className="font-semibold">
          {current?.name || "프로젝트 선택"}
        </span>

        <span className="text-xs text-gray-400">
          ▼
        </span>
      </button>

      {/* 드롭다운 */}
      {open && (

        <div className="
          absolute top-full left-0 mt-2
          w-64
          bg-white
          border
          rounded-xl
          shadow-lg
          z-50
        ">

          <div className="p-2 max-h-80 overflow-auto">

            {projects.map(p=>(
              <div
                key={p.id}
                onClick={()=>handleSelect(p)}
                className={`
                  px-3 py-2 rounded-md cursor-pointer
                  hover:bg-gray-100
                  ${current?.id === p.id ? "bg-blue-50 text-blue-600" : ""}
                `}
              >
                {p.name}
              </div>
            ))}

          </div>

        </div>

      )}

    </div>

  );

}