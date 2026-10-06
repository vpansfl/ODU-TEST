"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

// 1단계: 이메일을 입력하면 비밀번호 재설정 링크를 메일로 보냄
export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // 메일의 링크를 누르면 이동할 페이지 (2단계: 비밀번호 재설정 페이지)
      redirectTo: window.location.origin + "/reset-password",
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage("메일을 보내지 못했습니다: " + error.message);
      return;
    }

    setIsEmailSent(true);
  }

  return (
    <main className="auth-page">
      <Link className="auth-home-link" href="/">
        ← Movie Log
      </Link>

      {isEmailSent ? (
        <div className="auth-form">
          <h1 className="form-title">메일을 확인해 주세요</h1>
          <p className="auth-text">
            입력한 이메일로 비밀번호 재설정 링크를 보냈습니다. 링크를 눌러 새 비밀번호를 정해
            주세요.
          </p>
          <Link className="button" href="/login">
            로그인 화면으로
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1 className="form-title">비밀번호 찾기</h1>
          <p className="auth-text">가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내 드립니다.</p>

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

          {errorMessage && (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button className="button button-primary" type="submit" disabled={isLoading}>
            {isLoading ? "보내는 중…" : "재설정 링크 보내기"}
          </button>

          <div className="auth-links">
            <Link href="/login">로그인으로 돌아가기</Link>
          </div>
        </form>
      )}
    </main>
  );
}
