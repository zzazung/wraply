import ProjectSwitcher from "@/components/layout/ProjectSwitcher";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function Header(){

  return(

    <header
      className="
        h-14
        border-b
        flex items-center
        px-6
        bg-background
        border-border
      "
    >

      {/* 🔥 좌측: 프로젝트 */}
      <div className="flex items-center gap-3">

        <ProjectSwitcher />

        {/* 구분선 */}
        <div className="w-px h-6 bg-border" />

      </div>

      {/* 🔥 중앙: Breadcrumb */}
      <div className="flex-1 px-4">

        <Breadcrumb />

      </div>

      {/* 🔥 우측: 사용자 */}
      <div className="flex items-center gap-3">

        {/* TODO */}
        {/* <UserMenu /> */}

      </div>

    </header>

  );

}