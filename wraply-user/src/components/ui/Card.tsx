import type { ReactNode } from "react";

interface Props{

  children:ReactNode;

  className?:string;

}

export default function Card({

  children,

  className=""

}:Props){

  return(

    <div
      className={`
      bg-card
      border
      border-border
      rounded-lg
      p-6
      transition
      hover:border-primary/40
      ${className}
      `}
    >

      {children}

    </div>

  );

}