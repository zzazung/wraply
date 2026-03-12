import { useEffect,useRef,useState } from "react";

interface Props{
  jobId:string;
}

const MAX_LOG_LINES = 1000;

export default function BuildLogViewer({ jobId }:Props){

  const [logs,setLogs] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{

    let cancelled = false;

    async function start(){

      try{

        const res = await fetch(`/jobs/${jobId}/log`);

        if(!res.ok) throw new Error("log request failed");

        if(!res.body){
          setLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while(true){

          const {done,value} = await reader.read();

          if(done) break;

          buffer += decoder.decode(value,{ stream:true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          if(cancelled) break;

          setLogs(prev=>{

            const next = [...prev,...lines];

            if(next.length > MAX_LOG_LINES){
              return next.slice(-MAX_LOG_LINES);
            }

            return next;

          });

        }

      }catch(e){

        console.error("빌드 로그 스트림 오류",e);

      }finally{

        if(!cancelled) setLoading(false);

      }

    }

    start();

    return ()=>{

      cancelled = true;

    };

  },[jobId]);

  useEffect(()=>{

    const el = containerRef.current;

    if(!el) return;

    el.scrollTop = el.scrollHeight;

  },[logs]);

  return(

    <div className="bg-card border border-border rounded-lg">

      <div className="px-4 py-3 border-b border-border text-sm font-medium">
        빌드 로그
      </div>

      <div
        ref={containerRef}
        className="h-[420px] overflow-y-auto font-mono text-xs p-4 space-y-1 bg-black text-green-400"
      >

        {loading && logs.length===0 && (
          <div className="text-muted-foreground">
            로그를 불러오는 중입니다...
          </div>
        )}

        {!loading && logs.length===0 && (
          <div className="text-muted-foreground">
            로그가 없습니다.
          </div>
        )}

        {logs.map((line,i)=>(
          <div key={i}>{line}</div>
        ))}

      </div>

    </div>

  );

}