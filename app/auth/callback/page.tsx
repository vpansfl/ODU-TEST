"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// 카카오 로그인(OAuth)을 마치고 돌아오는 페이지
// 예) /auth/callback#access_token=...&refresh_token=...
export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function finishLogin() {
      // 카카오 동의 화면에서 "취소"하는 등 실패하면 주소에 error 정보가 담겨 옴
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const errorDescription =
        queryParams.get("error_description") ?? hashParams.get("error_description");

      if (errorDescription) {
        setErrorMessage("카카오 로그인에 실패했습니다: " + errorDescription);
        return;
      }

      // Supabase가 주소의 # 뒤에 담긴 인증 결과(토큰)를 읽어 세션(로그인 상태)으로 저장해 줌
      // getSession()은 그 작업이 끝날 때까지 기다렸다가 결과를 알려 줌
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setErrorMessage("카카오 로그인에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      // 로그인 성공 → 홈(내 영화 목록)으로 이동
      router.replace("/");
    }

    finishLogin();
  }, [router]);

  if (errorMessage) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1 className="form-title">로그인 실패</h1>
          <p className="auth-error" role="alert">
            {errorMessage}
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
      <p className="empty-message">카카오 로그인 중…</p>
    </main>
  );
}
