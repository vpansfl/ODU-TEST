"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

// 2단계: 메일의 링크를 눌러 들어오는 페이지에서 새 비밀번호로 바꾸기
export default function ResetPasswordPage() {
  // "checking": 링크 확인 중 / "ready": 새 비밀번호 입력 가능 / "invalid": 링크가 잘못됨
  const [linkStatus, setLinkStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 메일 링크 주소에 담긴 정보를 Supabase가 자동으로 읽어서 임시 로그인 상태로 만들어 줌.
    // 로그인 상태(session)가 생겼다면 새 비밀번호를 입력할 수 있음.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLinkStatus(session ? "ready" : "invalid");
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const passwordConfirm = String(formData.get("passwordConfirm"));

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (error) {
      setErrorMessage("비밀번호를 바꾸지 못했습니다: " + error.message);
      return;
    }

    setIsDone(true);
  }

  if (linkStatus === "checking") {
    return (
      <main className="auth-page">
        <p className="empty-message">링크를 확인하는 중…</p>
      </main>
    );
  }

  if (isDone) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1 className="form-title">비밀번호 변경 완료</h1>
          <p className="auth-text">새 비밀번호로 변경되었습니다.</p>
          <Link className="button button-primary" href="/">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1 className="form-title">링크가 만료되었어요</h1>
          <p className="auth-text">
            비밀번호 재설정 링크가 잘못되었거나 만료되었습니다. 다시 요청해 주세요.
          </p>
          <Link className="button button-primary" href="/forgot-password">
            재설정 링크 다시 받기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="form-title">새 비밀번호 설정</h1>

        <label className="form-label">
          새 비밀번호 (6자 이상)
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
          새 비밀번호 확인
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
          {isLoading ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}
