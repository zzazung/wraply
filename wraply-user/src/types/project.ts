export type Platform =
  | "android"
  | "ios";

export interface Project {

  id:string;

  name:string;

  appName:string;

  url:string;

  packageName:string;

  safeName:string;

  scheme:string | null;

  createdAt:string;

  updatedAt:string;

  /* UI용 필드 */

  buildCount?:number;

  lastBuildAt?:number;

}