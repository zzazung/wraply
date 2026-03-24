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

  appName:string;

  platform:Platform;

  status:BuildStatus;

  progress?:number;

  createdAt:string;

  updatedAt?:string;

  finishedAt?:string | null;

  error?:string | null;

}