import type { ReactNode } from "react";

interface Props{

  children:ReactNode;

}

function Table({

  children

}:Props){

  return(

    <table
      className="
      w-full
      text-sm
      "
    >

      {children}

    </table>

  );

}

export { Table };