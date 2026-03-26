import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProjects } from "@/services/projects";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";

import { Plus, Smartphone } from "lucide-react";

export default function ProjectPage(){

  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);

  const setCurrentProject = useProjectStore(s=>s.setCurrentProject);
  const clearCurrentProject = useProjectStore(s=>s.clearCurrentProject);
  const recent = useProjectStore(s=>s.recentProject);

  const user = useAuthStore(s=>s.user);

  useEffect(()=>{
    clearCurrentProject();   // 🔥 뒤로가기 시 reset
    fetchProjects().then(setProjects);
  },[]);

  function handleSelect(p:any){
    setCurrentProject(p);
    navigate("/dashboard");
  }

  return(

    <div>

      <div className="px-8 pt-10 pb-16">

        <div className="w-full max-w-screen-2xl mx-auto space-y-10">

          {/* 🔥 HERO */}
          <div className="
            bg-blue-500
            text-white
            rounded-2xl
            p-8
          ">

            <div className="text-xl font-semibold">
              고객님 안녕하세요.
            </div>

            <div className="text-sm opacity-90 mt-1">
              {user?.name} | {user?.email}
            </div>

            {/* 🔥 최근 프로젝트 */}
            {recent && (
              <div className="mt-6 bg-white/20 rounded-xl p-4">

                <div className="text-sm opacity-80 mb-2">
                  최근 프로젝트
                </div>

                <button
                  onClick={()=>{
                    setCurrentProject(recent);
                    navigate("/dashboard");
                  }}
                  className="
                    bg-white
                    text-blue-500
                    px-4 py-2
                    rounded-md
                    text-sm
                    hover:bg-gray-100
                  "
                >
                  {recent.name} 바로가기
                </button>

              </div>
            )}

          </div>

          {/* 🔥 GRID */}
          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            gap-8
          ">

            {/* 앱 등록 */}
            <div
              onClick={()=>navigate("/projects/new")}
              className="
                border-2 border-dashed border-gray-300
                rounded-2xl
                h-56
                p-6
                flex flex-col items-center justify-center
                text-center
                cursor-pointer
                bg-white
                hover:bg-gray-50
                hover:shadow-md
                transition-all
              "
            >

              <div className="
                w-12 h-12
                rounded-xl
                bg-blue-50
                flex items-center justify-center
                mb-3
              ">
                <Plus className="w-6 h-6 text-blue-500" />
              </div>

              <div className="text-lg font-semibold mb-1">
                앱 등록
              </div>

              <div className="text-sm text-gray-500 mb-4 px-4">
                앱을 등록하고 서비스를 사용해보세요
              </div>

              <button className="
                bg-blue-500
                text-white
                px-4 py-2
                rounded-md
                text-sm
                hover:bg-blue-600
              ">
                앱 등록하기
              </button>

            </div>

            {/* 프로젝트 */}
            {projects.map(p=>(
              <div
                key={p.id}
                onClick={()=>handleSelect(p)}   // 🔥 카드 전체 클릭
                className="
                  border border-gray-200
                  rounded-2xl
                  p-6
                  h-56
                  flex flex-col justify-between gap-4
                  bg-white
                  cursor-pointer
                  hover:shadow-xl
                  hover:-translate-y-1
                  hover:scale-[1.02]
                  hover:border-blue-500
                  transition-all
                "
              >

                <div className="flex items-center gap-3">

                  <div className="
                    w-11 h-11
                    rounded-xl
                    bg-gray-100
                    flex items-center justify-center
                  ">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {p.name}
                    </div>

                    <div className="text-xs text-gray-400 truncate">
                      {p.bundleId}
                    </div>
                  </div>

                </div>

                <div className="text-sm text-blue-500 font-medium">
                  선택 →
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>

  );

}