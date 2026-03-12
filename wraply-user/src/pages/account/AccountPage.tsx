export default function AccountPage(){

  return (

    <div className="space-y-6">

      <header>

        <h1 className="text-2xl font-semibold">

          계정 설정

        </h1>

        <p className="text-muted-foreground text-sm">

          사용자 계정과 API 토큰을 관리합니다.

        </p>

      </header>

      <section
        className="
        bg-card
        border
        border-border
        rounded-lg
        p-6
        space-y-4
        "
      >

        <h2 className="font-semibold">

          사용자 정보

        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>

            <p className="text-muted-foreground">

              사용자 이름

            </p>

            <p className="font-medium">

              관리자

            </p>

          </div>

          <div>

            <p className="text-muted-foreground">

              이메일

            </p>

            <p className="font-medium">

              admin@wraply.app

            </p>

          </div>

        </div>

      </section>

      <section
        className="
        bg-card
        border
        border-border
        rounded-lg
        p-6
        space-y-4
        "
      >

        <h2 className="font-semibold">

          API 토큰

        </h2>

        <p className="text-sm text-muted-foreground">

          Wraply API 호출에 사용하는 토큰입니다.

        </p>

        <div
          className="
          flex
          items-center
          gap-2
          "
        >

          <input
            value="dev-user"
            readOnly
            className="
            flex-1
            border
            border-border
            rounded-md
            px-3
            py-2
            bg-muted
            "
          />

          <button
            className="
            bg-primary
            text-primary-foreground
            px-4
            py-2
            rounded-md
            hover:opacity-90
            active:scale-95
            transition
            "
          >

            복사

          </button>

        </div>

      </section>

    </div>

  );

}