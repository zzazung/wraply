export default function InstallGuide({ platform }){

  if(platform === "android"){

    return (

      <div className="text-sm text-muted-foreground space-y-1">

        <p>설치 방법</p>

        <p>1. 다운로드 버튼을 누릅니다.</p>

        <p>2. APK 파일을 실행합니다.</p>

        <p>3. 설치를 허용합니다.</p>

      </div>

    )

  }

  return (

    <div className="text-sm text-muted-foreground space-y-1">

      <p>설치 방법</p>

      <p>1. Safari에서 페이지를 열어주세요.</p>

      <p>2. 설치 버튼을 누릅니다.</p>

      <p>3. 설정 → 일반 → 기기 관리에서 신뢰합니다.</p>

    </div>

  )

}