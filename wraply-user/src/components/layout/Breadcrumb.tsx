import { Link } from "react-router-dom";

interface Item{
  label:string;
  href?:string;
}

export default function Breadcrumb({
  items = []
}:{
  items:Item[];
}){

  if(!items.length) return null;

  return(

    <div className="text-sm text-muted-foreground">

      <div className="flex items-center gap-2">

        <Link
          to="/dashboard"
          className="hover:text-foreground transition"
        >
          홈
        </Link>

        {items.map((item,index)=>{

          const isLast = index === items.length - 1;

          return(

            <span
              key={index}
              className="flex items-center gap-2"
            >

              <span>/</span>

              {isLast || !item.href ? (

                <span className="text-foreground">

                  {item.label}

                </span>

              ) : (

                <Link
                  to={item.href}
                  className="hover:text-foreground transition"
                >

                  {item.label}

                </Link>

              )}

            </span>

          );

        })}

      </div>

    </div>

  );

}