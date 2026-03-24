import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

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
      className:"bg-yellow-500/90 text-white",
      icon:<Clock className="w-3 h-3" />
    },

    preparing:{
      label:"빌드 준비중",
      className:"bg-indigo-500 text-white",
      icon:<Loader2 className="w-3 h-3 animate-spin" />
    },

    building:{
      label:"빌드 진행중",
      className:"bg-blue-500 text-white",
      icon:<Loader2 className="w-3 h-3 animate-spin" />
    },

    packaging:{
      label:"패키징",
      className:"bg-purple-500 text-white",
      icon:<Loader2 className="w-3 h-3 animate-spin" />
    },

    uploading:{
      label:"업로드 중",
      className:"bg-cyan-500 text-white",
      icon:<Loader2 className="w-3 h-3 animate-spin" />
    },

    finished:{
      label:"빌드 완료",
      className:"bg-green-500 text-white",
      icon:<CheckCircle2 className="w-3 h-3" />
    },

    failed:{
      label:"빌드 실패",
      className:"bg-red-500 text-white",
      icon:<XCircle className="w-3 h-3" />
    },

    cancelled:{
      label:"빌드 취소",
      className:"bg-gray-500 text-white",
      icon:<XCircle className="w-3 h-3" />
    }

  };

  const item =
    map[status as keyof typeof map] ?? {

      label:status,
      className:"bg-muted text-muted-foreground",
      icon:null

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
      gap-1.5
      transition
      hover:opacity-90
      "
    >

      <span
        className={`
        inline-flex
        items-center
        gap-1
        px-2
        py-0.5
        rounded-md
        ${item.className}
        `}
      >

        {item.icon}

        {item.label}

      </span>

    </span>

  );

}