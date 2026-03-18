import type { SVGProps } from "react";

function WraplyLogo({
  className = "w-10 h-10",
  ...props
}: SVGProps<SVGSVGElement>){

  return(

    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >

      <defs>

        <linearGradient id="wraplyGradient" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

      </defs>

      {/* 왼쪽 */}
      <path
        d="M4 16 L18 48 L26 40 L14 12 Z"
        fill="url(#wraplyGradient)"
      />

      {/* 가운데 */}
      <path
        d="M18 48 L32 20 L46 48 L36 44 L32 32 L26 40 Z"
        fill="url(#wraplyGradient)"
      />

      {/* 오른쪽 */}
      <path
        d="M46 48 L60 16 L50 12 L38 40 Z"
        fill="url(#wraplyGradient)"
      />

    </svg>

  );

}

export { WraplyLogo };