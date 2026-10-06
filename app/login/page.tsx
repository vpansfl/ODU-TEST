"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  // 요청 중에는 버튼을 막아서 두 번 누르지 않게 하기
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.message === "Email not confirmed") {
        setErrorMessage("이메일 인증이 아직 완료되지 않았습니다. 메일함을 확인해 주세요.");
      } else {
        setErrorMessage("로그인하지 못했습니다: " + error.message);
      }
      setIsLoading(false);
      return;
    }

    // 로그인 성공 → 홈으로 이동
    router.push("/");
  }

  // 카카오 로그인: 카카오 로그인 화면으로 이동했다가 /auth/callback 으로 돌아옴
  async function handleKakaoLogin() {
    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });

    // 성공하면 페이지가 카카오로 넘어가므로, 실패했을 때만 처리
    if (error) {
      setErrorMessage("카카오 로그인을 시작하지 못했습니다: " + error.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-home-link" href="/">
        ← Movie Log
      </Link>

      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="form-title">로그인</h1>

        <label className="form-label">
          이메일
          <input
            className="form-input"
            type="email"
            name="email"
            required
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
          />
        </label>

        <label className="form-label">
          비밀번호
          <input
            className="form-input"
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="button button-primary" type="submit" disabled={isLoading}>
          {isLoading ? "로그인 중…" : "로그인"}
        </button>

        <p className="auth-divider">또는</p>

        <button
          className="button button-kakao"
          type="button"
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          카카오로 로그인
        </button>

        <div className="auth-links">
          <Link href="/forgot-password">비밀번호를 잊으셨나요?</Link>
          <Link href="/signup">회원가입</Link>
        </div>
      </form>
    </main>
  );
}
