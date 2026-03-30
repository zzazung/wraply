export type BuildForm = {

  step: number;

  platform: "android" | "ios";

  appName: string;
  url: string;

  versionName: string;
  versionCode: number;

  assets: {
    iconFile?: File | null;
    splashFile?: File | null;
    splashLottieFile?: File | null;
  };

  ui: {
    primaryColor?: string;
    splash?: boolean;
  };

};