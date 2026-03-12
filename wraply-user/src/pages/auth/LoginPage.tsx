import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage(){

  const navigate = useNavigate();

  const [token,setToken] = useState("");
  const [error,setError] = useState("");

  function handleLogin(){

    if(!token.trim()){

      setError("API 토큰을 입력해주세요.");
      return;

    }

    localStorage.setItem(
      "wraply_token",
      token.trim()
    );

    navigate("/");

  }

  function handleKeyDown(
    e:React.KeyboardEvent<HTMLInputElement>
  ){

    if(e.key==="Enter"){

      handleLogin();

    }

  }

  return (

    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-background
      text-foreground
      "
    >

      <div
        className="
        w-[380px]
        border
        border-border
        rounded-lg
        p-6
        bg-card
        space-y-4
        shadow-sm
        "
      >

        <h1 className="text-xl font-semibold">

          Wraply 로그인

        </h1>

        <p className="text-sm text-muted-foreground">

          Wraply API 토큰을 입력하세요.

        </p>

        <input
          value={token}
          onChange={(e)=>{

            setToken(e.target.value);
            setError("");

          }}
          onKeyDown={handleKeyDown}
          placeholder="API 토큰 입력"
          className="
          w-full
          border
          border-border
          rounded-md
          px-3
          py-2
          focus:outline-none
          focus:ring-2
          focus:ring-ring
          "
        />

        {error && (

          <div className="text-sm text-destructive">

            {error}

          </div>

        )}

        <button
          onClick={handleLogin}
          className="
          w-full
          bg-primary
          text-primary-foreground
          px-4
          py-2
          rounded-md
          hover:opacity-90
          active:scale-95
          transition
          "
        >

          로그인

        </button>

      </div>

    </div>

  );

}