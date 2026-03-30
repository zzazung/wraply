export type BuildStatus =
  | "PREPARING"
  | "PATCHING"
  | "BUILDING"
  | "SIGNING"
  | "UPLOADING"
  | "FINISHED"
  | "FAILED";

export type Platform =
  | "android"
  | "ios";

export interface Build {

  jobId:string;

  projectId:string;

  platform:Platform;

  appName:string;

  packageName:string;   // ✅ 추가
  url:string;           // ✅ 추가

  versionName:string;   // ✅ 추가
  versionCode:string;   // ✅ 추가

  ui:any;               // (추후 타입화)
  assets:any;
  features:any;

  status:BuildStatus;

  progress?:number;

  createdAt:string;
  updatedAt?:string;

  finishedAt?:string | null;

  error?:string | null;

}