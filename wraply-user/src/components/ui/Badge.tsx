interface Props{

  variant?:
    | "success"
    | "running"
    | "failed"
    | "queued";

  children:React.ReactNode;

}

function Badge({

  variant="queued",

  children

}:Props){

  const map = {

    success:"bg-green-500 text-white",

    running:"bg-blue-500 text-white",

    failed:"bg-red-500 text-white",

    queued:"bg-yellow-500 text-black"

  };

  return(

    <span
      className={`
      text-xs
      px-2
      py-1
      rounded
      ${map[variant]}
      `}
    >

      {children}

    </span>

  );

}

export { Badge };