import { useEffect,useState } from "react";

export default function useAuth(){

  const [user,setUser] = useState<any>(null);

  useEffect(()=>{

    const token = localStorage.getItem("wraply_token");

    if(token){

      setUser({
        token
      });

    }

  },[]);

  return { user };

}