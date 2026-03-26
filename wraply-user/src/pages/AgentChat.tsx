// src/pages/AgentChat.tsx

import { useState } from "react";
import { runAgent } from "@/services/agent";
import { useAgentStore } from "@/stores/agent";

/* ---------------- 컴포넌트 ---------------- */

function StepItem({ step }: any){

  return (
    <div className="text-sm flex flex-col gap-1">

      <div className="flex items-center gap-2">

        {step.status === "running" && "🟡"}
        {step.status === "done" && "🟢"}
        {step.status === "fail" && "🔴"}

        <span className="font-medium">{step.step}</span>

      </div>

      {/* streaming */}
      {step.stream && (
        <div className="ml-5 text-gray-600 whitespace-pre-wrap">
          {step.stream}
        </div>
      )}

      {/* final output */}
      {step.status === "done" && step.output && !step.stream && (
        <div className="ml-5 text-gray-700 whitespace-pre-wrap">
          {typeof step.output === "string"
            ? step.output
            : JSON.stringify(step.output, null, 2)}
        </div>
      )}

    </div>
  );

}

function JobView({ jobId }: { jobId: string }) {

  const job = useAgentStore(s => s.jobs[jobId]);

  if (!job) return <div>실행 중...</div>;

  if (!job.steps.length) return <div>실행 중...</div>;

  return (
    <div className="space-y-3">
      {job.steps.map((s:any,idx:number)=>(
        <StepItem key={idx} step={s} />
      ))}
    </div>
  );

}

/* ---------------- 메인 ---------------- */

export default function AgentChat(){

  const [input,setInput] = useState("");
  const [messages,setMessages] = useState<any[]>([]);

  /* store (selector 중요) */

  const jobs = useAgentStore(s => s.jobs);

  const setJob = useAgentStore(s => s.setJob);
  const addEvent = useAgentStore(s => s.addEvent);
  const appendStream = useAgentStore(s => s.appendStream);

  // useEffect(() => {
  //   const unsub = useAgentStore.subscribe((state) => {
  //       console.log("STORE:", JSON.stringify(state.jobs, null, 2));
  //   });
  //   return unsub;
	// }, []);

  /* 실행 */

	async function handleSend(){

		if(!input) return;

		const userMsg = { role:"user", content:input };

		setMessages(prev => [...prev, userMsg]);

		/* 🔥 먼저 jobId를 placeholder로 생성 */
		const tempJobId = "temp-" + Date.now();

		setMessages(prev => [
			...prev,
			{ role:"agent", jobId: tempJobId }
		]);

		/* 🔥 실제 요청 */
		const res = await runAgent({
			goal:input,
			context:{}
		});

		const realJobId = res.context?.jobId;

		if (!realJobId) return;

		/* 🔥 jobId 교체 */
		setMessages(prev =>
			prev.map(m =>
				m.jobId === tempJobId
					? { ...m, jobId: realJobId }
					: m
			)
		);

		setJob(realJobId);

		setInput("");

	}

	// console.log("MESSAGES:", JSON.stringify(messages));

  return (

    <div className="p-6 max-w-xl mx-auto flex flex-col h-[90vh]">

      {/* 메시지 영역 */}

      <div className="flex-1 overflow-y-auto space-y-4">

        {messages.map((m,i)=>{

					// console.log("RENDER MSG:", m);

          if(m.role === "user"){
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-black text-white p-3 rounded max-w-[80%]">
                  {m.content}
                </div>
              </div>
            );
          }

					console.log("JOBID:", m.jobId);

          if (m.role === "agent") {

						return (
							<div key={i} className="flex justify-start">

								<div className="bg-gray-100 p-3 rounded max-w-[80%] w-full">

										<JobView jobId={m.jobId} />

								</div>

							</div>
						);

					}

        })}

      </div>

      {/* 입력 영역 */}

      <div className="flex mt-4 gap-2">

        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="요청을 입력하세요..."
          className="flex-1 border p-2 rounded"
        />

        <button
          onClick={handleSend}
          className="px-4 bg-black text-white rounded"
        >
          Send
        </button>

      </div>

    </div>

  );

}