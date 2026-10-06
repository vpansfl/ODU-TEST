-- 영화 기록에 포스터와 개봉일을 저장할 컬럼 추가
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 한 번 실행하세요.
-- (여러 번 실행해도 안전합니다. RLS 정책은 그대로 적용됩니다.)

alter table public.movies
  add column if not exists poster_url text,   -- TMDB 포스터 이미지 주소
  add column if not exists release_date date; -- 개봉일 (한국 개봉일 우선)

-- 기존 기록은 두 값이 비어 있는 상태(null)로 남습니다.
