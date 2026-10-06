import { createClient } from "@supabase/supabase-js";

// .env.local 파일에 적어 둔 Supabase 주소와 공개 키
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    ".env.local 파일에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정해 주세요. (.env.example 참고)"
  );
}

// 앱 전체에서 함께 쓰는 Supabase 클라이언트
export const supabase = createClient(supabaseUrl, supabaseKey);
