// src/pages/app-build/steps/StepDone.tsx

export default function StepDone(){

  return(

    <div className="flex items-center justify-center h-full">

      <div className="bg-white p-8 rounded-xl shadow w-[400px] text-center">

        <h2 className="font-semibold mb-4">
          Android 빌드 완료
        </h2>

        <div className="mb-4 text-sm text-blue-600">
          QR 코드를 스캔하면 앱을 설치할 수 있습니다
        </div>

        <div className="w-40 h-40 bg-gray-200 mx-auto mb-6" />

        <div className="flex gap-2">

          <button className="flex-1 border rounded py-2">
            닫기
          </button>

          <button className="flex-1 bg-blue-500 text-white rounded py-2">
            APK 다운로드
          </button>

        </div>

      </div>

    </div>

  );

}