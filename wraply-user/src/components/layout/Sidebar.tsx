import { Link } from "react-router-dom"

export default function Sidebar() {

  return (

    <aside
      className="
      w-64
      hidden
      md:block
      h-screen
      p-4
      border-r
      bg-sidebar
      text-sidebar-foreground
      border-sidebar-border
      "
    >

      <h1 className="text-lg font-semibold mb-6">
        Wraply
      </h1>

      <nav className="space-y-1">

        <Link
          to="/"
          className="
          block
          p-2
          rounded-md
          hover:bg-sidebar-accent
          hover:text-sidebar-accent-foreground
          "
        >
          대시보드
        </Link>

        <Link
          to="/projects"
          className="
          block
          p-2
          rounded-md
          hover:bg-sidebar-accent
          hover:text-sidebar-accent-foreground
          "
        >
          프로젝트
        </Link>

        <Link
          to="/builds"
          className="
          block
          p-2
          rounded-md
          hover:bg-sidebar-accent
          hover:text-sidebar-accent-foreground
          "
        >
          빌드 센터
        </Link>

      </nav>

    </aside>

  )

}