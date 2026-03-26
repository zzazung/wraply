// src/components/AgentTemplateList.tsx

export function AgentTemplateList({ templates }){

  const { setJob } = useAgentStore();

  async function runTemplate(t){

    const res = await runAgent({
      goal:t.goal,
      context:t.context
    });

    setJob(res.jobId);

  }

  return (

    <div>

      {templates.map(t=>(
        <div key={t.id} className="border p-3 mb-2">

          <div className="font-bold">{t.name}</div>

          <button
            onClick={()=>runTemplate(t)}
            className="mt-2 px-2 py-1 bg-black text-white"
          >
            실행
          </button>

        </div>
      ))}

    </div>

  );

}