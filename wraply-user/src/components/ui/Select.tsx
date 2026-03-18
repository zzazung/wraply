import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement>{}

function Select({

  className="",

  children,

  ...props

}:Props){

  return(

    <select
      className={`
      w-full
      border
      border-border
      bg-background
      rounded-md
      px-3
      py-2
      text-sm
      outline-none
      transition
      focus:ring-2
      focus:ring-ring
      ${className}
      `}
      {...props}
    >

      {children}

    </select>

  );

}

export { Select };