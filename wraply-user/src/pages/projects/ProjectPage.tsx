// src/pages/ProjectPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProjects } from "@/services/projects";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";

import { Plus, Globe } from "lucide-react";

import ProjectCreateModal from "@/components/projects/ProjectCreateModal";

export default function ProjectPage(){

  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const setCurrentProject = useProjectStore(s=>s.setCurrentProject);
  const clearCurrentProject = useProjectStore(s=>s.clearCurrentProject);
  const recent = useProjectStore(s=>s.recentProject);

  const user = useAuthStore(s=>s.user);

  /* ---------------- init ---------------- */

  useEffect(()=>{

    // 🔥 recent 없을 때만 초기화 (UX 개선)
    if (!recent){
      clearCurrentProject();
    }

    fetchProjects()
      .then(data=>{
        setProjects(data || []);
      })
      .catch(err=>{
        console.error("projects load fail:", err);
        setProjects([]);
      })
      .finally(()=>{
        setLoading(false);
      });

  },[]);

  /* ---------------- select ---------------- */

  function handleSelect(p:any){

    setCurrentProject(p);

    // 🔥 race condition 방지
    setTimeout(()=>{
      navigate("/dashboard");
    },0);

  }

  /* ---------------- recent safe ---------------- */

  const recentProject =
    projects.find(p=>p.id === recent?.id);

  /* ---------------- render ---------------- */

  if (loading){
    return (
      <div className="p-10 text-center text-gray-500">
        프로젝트 불러오는 중...
      </div>
    );
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

            {/* 🔥 최근 프로젝트 (safe) */}
            {recentProject && (
              <div className="mt-6 bg-white/20 rounded-xl p-4">

                <div className="text-sm opacity-80 mb-2">
                  최근 프로젝트
                </div>

                <button
                  onClick={()=>{
                    setCurrentProject(recentProject);
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
                  {recentProject.name} 바로가기
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

            {/* 프로젝트 생성 */}
            <div
              onClick={()=>setOpen(true)}
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
                프로젝트 생성
              </div>

              <div className="text-sm text-gray-500 mb-4 px-4">
                서비스를 등록하고 다양한 타겟으로 확장하세요
              </div>

              <button className="
                bg-blue-500
                text-white
                px-4 py-2
                rounded-md
                text-sm
                hover:bg-blue-600
              ">
                시작하기
              </button>

            </div>

            {/* 프로젝트 리스트 */}
            {projects.map(p=>{

              const settings =
                typeof p.settings === "string"
                  ? JSON.parse(p.settings)
                  : p.settings;

              const url =
                p.url || settings?.url || "서비스 URL 없음";

              return(

                <div
                  key={p.id}
                  onClick={()=>handleSelect(p)}
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
                      <Globe className="w-5 h-5 text-gray-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {p.name}
                      </div>

                      <div className="text-xs text-gray-400 truncate">
                        {url}
                      </div>
                    </div>

                  </div>

                  <div className="text-sm text-blue-500 font-medium">
                    열기 →
                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </div>

      {open && (
        <ProjectCreateModal
          onClose={()=>setOpen(false)}
          onCreated={()=>{
            fetchProjects().then(setProjects); // 🔥 목록 갱신
          }}
        />
      )}

    </div>

  );

}