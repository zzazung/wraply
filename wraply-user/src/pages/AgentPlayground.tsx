// src/pages/AgentPlayground.tsx

import { useState } from "react";

import { runAgent } from "@/services/agent";
import { useAgentSocket } from "@/hooks/useAgentSocket";
import { useAgentStore } from "@/stores/agent";

export default function AgentPlayground(){

  const [goal,setGoal] = useState("상품 홍보");
  const [product,setProduct] = useState("여름 반팔 티셔츠");
  const [loading,setLoading] = useState(false);

  const {
    steps,
    logs,
    setJob,
    reset
  } = useAgentStore();

const token = localStorage.getItem("wraply_auth"); // 🔥 추가

  /* WebSocket 연결 */
  useAgentSocket();

  /* 실행 */

  async function handleRun(){

    reset();
    setLoading(true);

    const res = await runAgent({
      goal,
      context:{
        product
      }
    });

    setJob(res.jobId);

    setLoading(false);

  }

  return (

    <div className="p-6 space-y-6 max-w-xl">

      <h1 className="text-xl font-bold">
        Agent Playground
      </h1>

      {/* 입력 */}

      <h5>{token}</h5>

      <div className="space-y-2">

        <input
          value={goal}
          onChange={(e)=>setGoal(e.target.value)}
          placeholder="Goal"
          className="w-full border p-2 rounded"
        />

        <input
          value={product}
          onChange={(e)=>setProduct(e.target.value)}
          placeholder="Product"
          className="w-full border p-2 rounded"
        />

      </div>

      {/* 실행 버튼 */}

      <button
        onClick={handleRun}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Running..." : "Run Agent"}
      </button>

      {/* Steps */}

      <div>

        <h2 className="font-semibold mb-2">Steps</h2>

        {steps.map((s,i)=>(
          <div key={i} className="p-2 border mb-2 rounded">
            <div className="font-medium">{s.step}</div>
            <div className="text-xs text-gray-500">
              {s.event}
            </div>
          </div>
        ))}

      </div>

      {/* Logs */}

      <div>

        <h2 className="font-semibold mb-2">Logs</h2>

        {logs.map((l,i)=>(
          <div key={i} className="text-sm text-gray-600">
            [{l.task}] {l.message}
          </div>
        ))}

      </div>

    </div>

  );

}