import { useEffect,useState } from "react";

export default function useBuildLogs(jobId:string){

  const [logs,setLogs] = useState<string[]>([]);

  useEffect(()=>{

    async function stream(){

      const res = await fetch(

        `http://localhost:4000/jobs/${jobId}/log`
      );

      const reader = res.body?.getReader();

      const decoder = new TextDecoder();

      while(true){

        const {done,value} = await reader!.read();

        if(done) break;

        const text = decoder.decode(value);

        setLogs((prev)=>[...prev,...text.split("\n")]);

      }

    }

    stream();

  },[jobId]);

  return logs;

}