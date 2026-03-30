export type Platform =
  | "android"
  | "ios";

export interface Project {

  id:string;

  tenantId:string;

  name:string;

  safeName:string;

  url?:string;

  createdAt:string;

  updatedAt:string;

  settings:JSON;

}