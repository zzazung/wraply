import { Link, useLocation } from "react-router-dom";

function Item({ to, label }:{ to:string; label:string }){

  const { pathname } = useLocation();
  const active = pathname.startsWith(to);

  return(
    <Link
      to={to}
      className={`
        block px-3 py-2 rounded-lg text-sm
        ${active ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50"}
      `}
    >
      {label}
    </Link>
  );
}

function Section({ title, children }:{
  title:string;
  children:React.ReactNode;
}){

  return(
    <div className="space-y-1">

      <div className="px-2 text-xs text-gray-400 font-medium">
        {title}
      </div>

      <div className="space-y-1">
        {children}
      </div>

    </div>
  );
}

export default function Sidebar(){

  return(

    <div className="w-56 border-r h-full p-4 space-y-6">

      {/* 메인 */}
      <Section title="메인">
        <Item to="/dashboard" label="대시보드" />
      </Section>

      {/* 실행 */}
      <Section title="실행">
        <Item to="/runs" label="실행 기록" />
      </Section>

      {/* AI */}
      <Section title="AI">
        <Item to="/agent" label="Agent Chat" />
      </Section>

    </div>

  );

}