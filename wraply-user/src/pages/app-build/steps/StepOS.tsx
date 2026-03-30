// src/pages/app-build/steps/StepOS.tsx

import { useAppBuildStore } from "@/stores/appBuildStore";

export default function StepOS(){

  const platform = useAppBuildStore(s=>s.platform);
  const set = useAppBuildStore(s=>s.set);

  return (

    <div className="max-w-md mx-auto space-y-8">

      <h2 className="text-center text-xl font-semibold">
        OS를 선택하세요
      </h2>

      <div className="grid grid-cols-2 gap-4">

        {/* ANDROID */}
        <button
          onClick={()=>set("platform","android")}
          className={`
            h-28 rounded-xl border transition-all

            flex flex-col items-center justify-center gap-2

            ${platform === "android"
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : "bg-white hover:border-gray-400"
            }
          `}
        >
          <span className="text-2xl">🤖</span>
          <span className="text-sm font-medium">
            Android
          </span>
        </button>

        {/* IOS */}
        <button
          onClick={()=>set("platform","ios")}
          className={`
            h-28 rounded-xl border transition-all

            flex flex-col items-center justify-center gap-2

            ${platform === "ios"
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : "bg-white hover:border-gray-400"
            }
          `}
        >
          <span className="text-2xl">🍎</span>
          <span className="text-sm font-medium">
            iOS
          </span>
        </button>

      </div>

    </div>

  );

}