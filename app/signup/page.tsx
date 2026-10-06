"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  // 가입 후 "메일함을 확인하세요" 안내를 보여줄지 여부
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const passwordConfirm = String(formData.get("passwordConfirm"));

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 인증 메일의 링크를 누르면 돌아올 주소 (app/auth/confirm/page.tsx)
        emailRedirectTo: window.location.origin + "/auth/confirm",
      },
    });

    if (error) {
      setErrorMessage("회원가입하지 못했습니다: " + error.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      // Supabase에서 이메일 인증을 꺼 둔 경우 → 바로 로그인됨
      router.push("/");
    } else {
      // 이메일 인증이 켜져 있는 경우 → 메일함 확인 안내
      setIsEmailSent(true);
    }
  }

  // 카카오로 회원가입: 처음 카카오로 로그인하면 Supabase가 자동으로 회원을 만들어 줌
  // (로그인 페이지의 카카오 로그인과 같은 방식, 끝나면 /auth/callback 으로 돌아옴)
  async function handleKakaoSignup() {
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
      setErrorMessage("카카오 회원가입을 시작하지 못했습니다: " + error.message);
      setIsLoading(false);
    }
  }

  if (isEmailSent) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1 className="form-title">메일을 확인해 주세요</h1>
          <p className="auth-text">
            가입한 이메일로 인증 링크를 보냈습니다. 링크를 누르면 가입이 완료됩니다.
          </p>
          <Link className="button button-primary" href="/login">
            로그인 화면으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Link className="auth-home-link" href="/">
        ← Movie Log
      </Link>

      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="form-title">회원가입</h1>

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
          비밀번호 (6자 이상)
          <input
            className="form-input"
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <label className="form-label">
          비밀번호 확인
          <input
            className="form-input"
            type="password"
            name="passwordConfirm"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="button button-primary" type="submit" disabled={isLoading}>
          {isLoading ? "가입 중…" : "회원가입"}
        </button>

        <p className="auth-divider">또는</p>

        <button
          className="button button-kakao"
          type="button"
          onClick={handleKakaoSignup}
          disabled={isLoading}
        >
          카카오로 회원가입
        </button>

        <div className="auth-links">
          <span>이미 계정이 있나요?</span>
          <Link href="/login">로그인</Link>
        </div>
      </form>
    </main>
  );
}
