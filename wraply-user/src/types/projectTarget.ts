export interface ProjectTarget {

  id: string;

  projectId: string;

  type: string; // "android_build" | "ios_build" | "ai_content"

  config: any;

  createdAt: string;

  updatedAt: string;

}