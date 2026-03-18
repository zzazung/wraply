import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement>{}

function Input({

  className="",

  ...props

}:Props){

  return(

    <input
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
    />

  );

}

export { Input };