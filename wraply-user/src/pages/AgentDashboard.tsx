// src/pages/AgentDashboard.tsx

import { useState } from "react";

import { runAgent } from "@/services/agent";
import { useAgentSocket } from "@/hooks/useAgentSocket";
import { useAgentStore } from "@/store/agent";

export default function AgentDashboard(){

  const [loading,setLoading] = useState(false);

  const {
    steps,
    logs,
    setJob,
    reset
  } = useAgentStore();

  /* WebSocket */

  useAgentSocket("YOUR_TOKEN");

  /* 실행 */

  async function handleRun(){

    reset();
    setLoading(true);

    const res = await runAgent({
      goal:"상품 홍보",
      context:{
        product:"여름 반팔 티셔츠"
      }
    });

    setJob(res.jobId);

    setLoading(false);

  }

  return (

    <div className="p-6 space-y-6">

      <h1 className="text-xl font-bold">
        Agent Dashboard
      </h1>

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
          <div key={i} className="p-2 border mb-2">
            <div>{s.step}</div>
            <div className="text-sm text-gray-500">
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