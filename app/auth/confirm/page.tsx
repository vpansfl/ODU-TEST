"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

// 인증 메일의 링크를 누르면 도착하는 페이지
// 예) /auth/confirm?token_hash=xxxx&type=email
export default function AuthConfirmPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function confirmEmail() {
      // 주소창의 ?token_hash=...&type=... 값 꺼내기
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;

      if (tokenHash && type) {
        // 메일 속 토큰을 Supabase에 보내 인증하기 → 성공하면 바로 로그인 상태가 됨
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setErrorMessage("이메일 인증에 실패했습니다: " + error.message);
          return;
        }
      } else {
        // 기본 메일 템플릿으로 온 경우: Supabase가 주소의 # 뒤 정보를 읽어 자동으로 로그인시켜 줌
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setErrorMessage("인증 링크가 잘못되었거나 만료되었습니다. 다시 회원가입하거나 로그인해 주세요.");
          return;
        }
      }

      // 인증 완료 → 홈으로 이동
      router.replace("/");
    }

    confirmEmail();
  }, [router]);

  if (errorMessage) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1 className="form-title">인증 실패</h1>
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
      <p className="empty-message">이메일 인증을 확인하는 중…</p>
    </main>
  );
}
