import type { ReactNode } from "react";

interface Props{

  children:ReactNode;

  onClose:()=>void;

}

export default function Modal({

  children,

  onClose

}:Props){

  return(

    <div
      className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
      "
      onClick={onClose}
    >

      <div
        className="
        bg-card
        border
        border-border
        rounded-lg
        p-6
        min-w-[420px]
        "
        onClick={(e)=>e.stopPropagation()}
      >

        {children}

      </div>

    </div>

  );

}