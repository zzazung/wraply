export default function PublicHeader(){

  return(

    <div className="h-14 px-6 flex items-center justify-between border-b bg-background">

      {/* 🔥 좌측: 로고 */}
      <div className="font-semibold text-lg">
        Wraply
      </div>

      {/* 🔥 우측: 사용자 */}
      <div className="text-sm text-muted-foreground">
        jongheon park
      </div>

    </div>

  );

}