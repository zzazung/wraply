import { Link, useLocation } from "react-router-dom";

function Item({ to, label }:{ to:string; label:string }){

  const { pathname } = useLocation();
  const active = pathname.startsWith(to);

  return(
    <Link
      to={to}
      className={`
        block px-4 py-2 rounded-lg text-sm
        ${active ? "bg-gray-100 font-medium" : "text-gray-600"}
      `}
    >
      {label}
    </Link>
  );
}

export default function Sidebar(){

  return(

    <div className="w-56 border-r h-full p-4 space-y-2">

      <Item to="/dashboard" label="대시보드" />

      {/* 🔥 앱 빌드 (Wizard) */}
      <Item to="/app-build" label="앱 빌드" />

      {/* 기존 */}
      <Item to="/build" label="빌드 센터" />
      <Item to="/build-history" label="빌드 이력" />

      <Item to="/agent" label="Agent Chat" />

    </div>

  );

}