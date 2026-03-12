import { useState } from "react";

import { createProject } from "@/services/projects";

export default function ProjectCreateModal({
  onClose,
  onCreated
}:{
  onClose:()=>void;
  onCreated:()=>void;
}){

  const [name,setName] = useState("");
  const [loading,setLoading] = useState(false);

  async function handleCreate(){

    if(!name.trim()) return;

    try{

      setLoading(true);

      await createProject({
        name:name.trim()
      });

      onCreated();
      onClose();

    }finally{

      setLoading(false);

    }

  }

  return(

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-card border border-border rounded-lg w-[420px] p-6 space-y-5 shadow-lg">

        <h2 className="text-lg font-semibold">
          프로젝트 생성
        </h2>

        <div className="space-y-2">

          <div className="text-sm text-muted-foreground">
            프로젝트 이름
          </div>

          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="예: Demo Apps"
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />

        </div>

        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={onClose}
            className="px-3 py-2 border border-border rounded-md hover:bg-muted transition"
          >
            취소
          </button>

          <button
            disabled={loading}
            onClick={handleCreate}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 active:scale-95 transition"
          >
            {loading ? "생성 중..." : "생성"}
          </button>

        </div>

      </div>

    </div>

  );

}