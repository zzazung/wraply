import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Card, CardContent, WraplyLogo } from "@/components/ui";

import { register } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterPage(){

  const navigate = useNavigate();
  const setAuth = useAuthStore((s)=>s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {

    if (!email || !password || !confirm){
      setError("모든 항목을 입력해주세요");
      return;
    }

    if (password !== confirm){
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    try{

      setError("");
      setLoading(true);

      const res = await register({
        email,
        password
      });

      // 🔥 API 응답 구조 맞춤
      setAuth({
        token: res.token,
        user: {
          id: res.userId,
          tenantId: res.tenantId
        }
      });

      navigate("/dashboard");

    }catch(err){
      console.error(err);
      setError("회원가입에 실패했습니다");
    }finally{
      setLoading(false);
    }

  };

  return(

    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* 좌측 Branding */}
      <div className="hidden md:flex flex-col justify-center px-16 bg-gradient-to-br from-primary to-primary/70 text-white">

        <div className="max-w-md space-y-10">

          <div className="flex items-center gap-3">

            <WraplyLogo className="w-10 h-10" />

            <span className="text-xl font-semibold tracking-tight">
              Wraply
            </span>

          </div>

          <div className="space-y-4">

            <h1 className="text-4xl font-semibold leading-tight">
              지금 바로
              <br />
              앱을 만들어보세요
            </h1>

            <p className="text-sm opacity-80 leading-relaxed">
              복잡한 과정 없이 바로 시작할 수 있어요
            </p>

          </div>

        </div>

      </div>

      {/* 우측 Register */}
      <div className="flex items-center justify-center p-8 bg-background">

        <Card className="w-full max-w-md shadow-xl border">

          <CardContent className="p-8 space-y-8">

            <div className="text-center space-y-2">

              <h2 className="text-2xl font-semibold tracking-tight">
                무료로 시작하기
              </h2>

              <p className="text-sm text-muted-foreground">
                몇 초면 계정이 만들어집니다
              </p>

            </div>

            <div className="space-y-4">

              <Input
                placeholder="이메일"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />

              <Input
                type="password"
                placeholder="비밀번호 확인"
                value={confirm}
                onChange={(e)=>setConfirm(e.target.value)}
              />

              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}

              <Button
                className="w-full h-11 text-base shadow-md hover:opacity-90 active:scale-[0.98]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "가입 중..." : "무료로 시작하기"}
              </Button>

            </div>

            <div className="text-center text-sm">

              이미 계정이 있나요?{" "}

              <span
                className="underline cursor-pointer hover:text-primary"
                onClick={()=>navigate("/login")}
              >
                로그인
              </span>

            </div>

          </CardContent>

        </Card>

      </div>

    </div>

  );

}