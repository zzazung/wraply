export interface Artifact {

  id:string;

  jobId:string;

  platform:"android" | "ios";

  size:number;

  downloadUrl:string;

  createdAt:number;

}

export interface ArtifactListResponse {

  items:Artifact[];

}