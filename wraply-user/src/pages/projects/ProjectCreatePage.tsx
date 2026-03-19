import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Card, CardContent } from "@/components/ui";

import { createProject } from "@/services/projects";
import { createJob } from "@/services/builds";

export default function ProjectCreatePage(){

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<"android" | "ios">("android");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {

    if (!name || !url){
      setError("앱 이름과 URL을 입력해주세요");
      return;
    }

    try{

      setError("");
      setLoading(true);

      // 1️⃣ 프로젝트 생성
      const project = await createProject({
        name,
        packageName: "com.wraply.app" // 🔥 임시 자동값
      });

      // 2️⃣ 빌드 요청
      const job = await createJob({
        projectId: project.id,
        platform,
        packageName: "com.wraply.app",
        appName: name,
        url,
        scheme: null
      });

      // 3️⃣ 빌드 화면 이동
      navigate(`/builds/${job.jobId}`);

    }catch(err:any){

      console.error(err);

      const message =
        err?.response?.data?.error ||
        "앱 생성에 실패했습니다";

      setError(message);

    }finally{
      setLoading(false);
    }

  };

  return(

    <div className="flex items-center justify-center min-h-[80vh] p-6">

      <Card className="w-full max-w-lg shadow-xl">

        <CardContent className="p-8 space-y-8">

          {/* 헤더 */}
          <div className="space-y-2 text-center">

            <h1 className="text-2xl font-semibold">
              앱 만들기
            </h1>

            <p className="text-sm text-muted-foreground">
              URL을 입력하면 바로 앱이 생성됩니다
            </p>

          </div>

          {/* 입력 */}
          <div className="space-y-4">

            <Input
              placeholder="앱 이름 (예: My App)"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              disabled={loading}
            />

            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e)=>setUrl(e.target.value)}
              disabled={loading}
            />

            {/* 플랫폼 선택 */}
            <div className="flex gap-2">

              <Button
                variant={platform === "android" ? "primary" : "outline"}
                onClick={()=>setPlatform("android")}
                disabled={loading}
              >
                Android
              </Button>

              <Button
                variant={platform === "ios" ? "primary" : "outline"}
                onClick={()=>setPlatform("ios")}
                disabled={loading}
              >
                iOS
              </Button>

            </div>

            {/* 에러 */}
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            {/* CTA */}
            <Button
              className="w-full h-11 text-base shadow-md"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "앱 생성 중..." : "앱 만들기"}
            </Button>

          </div>

        </CardContent>

      </Card>

    </div>

  );

}