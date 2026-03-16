import Breadcrumb from "./Breadcrumb";

interface Crumb{
  label:string;
  href?:string;
}

export default function PageHeader({
  title,
  breadcrumbs
}:{
  title:string;
  breadcrumbs?:Crumb[];
}){

  return(

    <div className="space-y-3">

      {breadcrumbs && (

        <Breadcrumb items={breadcrumbs} />

      )}

      <h1 className="text-xl font-semibold">

        {title}

      </h1>

    </div>

  );

}