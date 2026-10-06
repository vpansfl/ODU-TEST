-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 한 번 실행하세요.

create table public.movies (
  id bigint generated always as identity primary key,
  title text not null,
  genre text not null default '',
  rating smallint not null check (rating between 1 and 5),
  watched_date date not null,
  memo text not null default '',
  created_at timestamptz not null default now()
);

-- 브라우저(anon 역할)에서 영화 목록을 읽고 쓸 수 있도록 허용
grant select, insert, update, delete on public.movies to anon;

-- ⚠️ 주의: 아직 로그인/RLS를 구현하지 않았기 때문에
-- 공개 키만 있으면 누구나 이 테이블을 읽고, 수정하고, 삭제할 수 있습니다.
-- 개인 연습용으로만 사용하고, 다음 단계에서 로그인 + RLS를 꼭 추가하세요.
-- (Supabase가 새 테이블에 RLS를 자동으로 켜 두었다면, 지금은 아래 줄로 꺼 두어야 동작합니다.)
alter table public.movies disable row level security;

-- 샘플 데이터 (원하지 않으면 지우고 실행하세요)
insert into public.movies (title, genre, rating, watched_date, memo) values
  ('인터스텔라', 'SF', 5, '2026-09-12', '음악과 영상미가 압도적이었다.'),
  ('기생충', '드라마', 4, '2026-09-20', '다시 보니 새로운 장면들이 보였다.'),
  ('토이 스토리', '애니메이션', 4, '2026-10-01', '어릴 때 생각이 나서 좋았다.');
