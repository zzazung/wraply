export function getBuildStatusLabel(status:string){

  switch(status){

    case "PREPARING":
      return "준비 중";

    case "PATCHING":
      return "패치 중";

    case "BUILDING":
      return "빌드 중";

    case "SIGNING":
      return "서명 중";

    case "UPLOADING":
      return "업로드 중";

    case "FINISHED":
      return "완료";

    case "FAILED":
      return "실패";

    default:
      return status;
  }

}

export function getBuildStatusColor(status:string){

  switch(status){

    case "FINISHED":
      return "text-green-500";

    case "FAILED":
      return "text-red-500";

    case "BUILDING":
    case "SIGNING":
    case "PATCHING":
      return "text-blue-500";

    default:
      return "text-muted-foreground";
  }

}
