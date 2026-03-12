import { useEffect,useState } from "react";

import { fetchArtifacts } from "@/services/artifacts";

import ArtifactCard from "@/components/artifact/ArtifactCard";

export default function BuildArtifacts({

  jobId

}:{

  jobId:string

}){

  const [items,setItems] = useState([]);

  useEffect(()=>{

    async function load(){

      const data = await fetchArtifacts(jobId);

      setItems(data);

    }

    load();

  },[jobId]);

  if(items.length === 0){

    return(

      <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">

        생성된 아티팩트가 없습니다.

      </div>

    );

  }

  return(

    <div className="bg-card border border-border rounded-lg p-6 space-y-4">

      <h2 className="text-sm font-medium">

        빌드 결과

      </h2>

      {items.map((artifact:any)=>(

        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
        />

      ))}

    </div>

  );

}