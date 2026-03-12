export type BuildStatus =
  | "pending"
  | "running"
  | "finished"
  | "failed"
  | "cancelled";

export type Platform =
  | "android"
  | "ios";

export interface Build {

  jobId:string;

  platform:Platform;

  status:BuildStatus;

  progress:number;

  createdAt:number;

  updatedAt:number;

  finishedAt:number | null;

  error:string | null;

}

export interface BuildListResponse {

  items:Build[];

}