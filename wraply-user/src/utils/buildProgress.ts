import type { BuildStatus } from "@/types/build";

export function getBuildProgress(status:BuildStatus){

  const map:Record<BuildStatus,number> = {

    queued:0,
    preparing:10,
    building:40,
    packaging:70,
    uploading:90,
    finished:100,
    failed:100,
    cancelled:100

  };

  return map[status] ?? 0;

}