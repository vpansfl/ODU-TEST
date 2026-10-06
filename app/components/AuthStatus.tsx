"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

// 헤더에 보여주는 로그인 상태 (로그인한 이메일 + 로그아웃 / 로그인·회원가입 링크)
export default function AuthStatus() {
  // 로그인한 사용자 (로그아웃 상태면 null)
  const [user, setUser] = useState<User | null>(null);
  // 로그인 상태를 아직 확인 중인지 여부 (깜빡임 방지용)
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 로그인/로그아웃이 일어날 때마다 자동으로 호출됨
    // (처음 구독할 때도 한 번 호출되어 브라우저에 저장된 로그인 정보를 알려 줌)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsChecking(false);
    });

    // 컴포넌트가 사라질 때 구독 해제
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert("로그아웃하지 못했습니다: " + error.message);
  }

  if (isChecking) return null;

  if (user) {
    return (
      <div className="auth-status">
        <span className="auth-email">{user.email}</span>
        <button className="button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="auth-status">
      <Link className="button" href="/login">
        로그인
      </Link>
      <Link className="button" href="/signup">
        회원가입
      </Link>
    </div>
  );
}
