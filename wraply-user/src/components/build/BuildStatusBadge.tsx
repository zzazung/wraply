interface Props{

  status?:
    | "queued"
    | "preparing"
    | "building"
    | "packaging"
    | "uploading"
    | "finished"
    | "failed"
    | "cancelled";

}

export default function BuildStatusBadge({ status }:Props){

  const map = {

    queued:{
      label:"빌드 대기",
      className:"bg-yellow-500/90 text-white"
    },

    preparing:{
      label:"빌드 준비중",
      className:"bg-indigo-500 text-white"
    },

    building:{
      label:"빌드 진행중",
      className:"bg-blue-500 text-white"
    },

    packaging:{
      label:"패키징",
      className:"bg-purple-500 text-white"
    },

    uploading:{
      label:"업로드 중",
      className:"bg-cyan-500 text-white"
    },

    finished:{
      label:"빌드 완료",
      className:"bg-green-500 text-white"
    },

    failed:{
      label:"빌드 실패",
      className:"bg-red-500 text-white"
    },

    cancelled:{
      label:"빌드 취소",
      className:"bg-gray-500 text-white"
    }

  };

  const item =
    map[status as keyof typeof map] ?? {

      // label:"상태 확인중",
      label:status,
      className:"bg-muted text-muted-foreground"

    };

  return(

    <span
      className="
      inline-flex
      items-center
      text-xs
      px-2.5
      py-1
      rounded-md
      font-medium
      transition
      hover:opacity-90
      "
      style={{}}
    >

      <span
        className={`
        px-2
        py-0.5
        rounded-md
        ${item.className}
        `}
      >

        {item.label}

      </span>

    </span>

  );

}