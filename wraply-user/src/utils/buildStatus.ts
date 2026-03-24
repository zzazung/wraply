/* ----------------------------------
   🔥 상태 정의 (단일 소스)
---------------------------------- */

export const STATUS_ORDER = [
  "preparing",
  "patching",
  "building",
  "signing",
  "uploading",
  "finished",
  "failed"
] as const;

export type BuildStatus = typeof STATUS_ORDER[number];

/* ----------------------------------
   🔤 normalize (소문자 통일)
---------------------------------- */

export function normalizeStatus(status:string):BuildStatus{

  const s = status.toLowerCase();

  if (STATUS_ORDER.includes(s as BuildStatus)){
    return s as BuildStatus;
  }

  return "preparing"; // fallback

}

/* ----------------------------------
   🧠 상태 비교 (역행 방지 핵심)
---------------------------------- */

export function isForwardStatus(prev:string, next:string){

  const p = normalizeStatus(prev);
  const n = normalizeStatus(next);

  const prevIdx = STATUS_ORDER.indexOf(p);
  const nextIdx = STATUS_ORDER.indexOf(n);

  return nextIdx >= prevIdx;

}

/* ----------------------------------
   🏷 label
---------------------------------- */

export function getBuildStatusLabel(status:string){

  const s = normalizeStatus(status);

  switch(s){

    case "preparing":
      return "준비 중";

    case "patching":
      return "패치 중";

    case "building":
      return "빌드 중";

    case "signing":
      return "서명 중";

    case "uploading":
      return "업로드 중";

    case "finished":
      return "완료";

    case "failed":
      return "실패";

    default:
      return s;
  }

}

/* ----------------------------------
   🎨 color
---------------------------------- */

export function getBuildStatusColor(status:string){

  const s = normalizeStatus(status);

  switch(s){

    case "finished":
      return "text-green-500";

    case "failed":
      return "text-red-500";

    case "preparing":
    case "patching":
    case "building":
    case "signing":
    case "uploading":
      return "text-blue-500";

    default:
      return "text-muted-foreground";
  }

}

/* ----------------------------------
   📊 진행 상태 (UI용)
---------------------------------- */

export function getBuildPhase(status:string){

  const s = normalizeStatus(status);

  if (s === "finished") return "done";
  if (s === "failed") return "error";

  return "running";
}