import type { LogEvent } from "./log";

export interface StatusEvent {

  type:"status";

  jobId:string;

  status:string;

  progress:number;

}

export type WebSocketEvent =
  | LogEvent
  | StatusEvent;