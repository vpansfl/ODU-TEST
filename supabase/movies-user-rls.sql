-- 로그인한 사용자가 "자신의 영화만" 보고, 저장하고, 수정하고, 삭제할 수 있게 만드는 SQL
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 한 번 실행하세요.
-- (여러 번 실행해도 안전하도록 작성했습니다.)

-- 1. 영화마다 "누구의 영화인지" 저장할 user_id 컬럼 추가
--    - auth.users(id) 와 연결 (회원이 탈퇴하면 그 사람의 영화도 함께 삭제)
--    - 값을 안 넣으면 현재 로그인한 사용자의 id(auth.uid())가 자동으로 들어감
alter table public.movies
  add column if not exists user_id uuid
  default auth.uid()
  references auth.users (id) on delete cascade;

-- user_id 로 자주 찾으므로 인덱스 추가 (조회 속도 향상)
create index if not exists movies_user_id_idx on public.movies (user_id);

-- 2. 권한 정리: 로그인한 사용자(authenticated)만 movies 테이블 사용
revoke all on public.movies from anon;
grant select, insert, update, delete on public.movies to authenticated;

-- 3. RLS(행 단위 보안) 켜기
alter table public.movies enable row level security;

-- 4. 정책 만들기 (기존에 같은 이름의 정책이 있으면 지우고 다시 만듦)
drop policy if exists "내 영화 조회" on public.movies;
drop policy if exists "내 영화 추가" on public.movies;
drop policy if exists "내 영화 수정" on public.movies;
drop policy if exists "내 영화 삭제" on public.movies;

-- 내 영화만 볼 수 있음
create policy "내 영화 조회" on public.movies
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- user_id 가 내 id 인 영화만 추가할 수 있음
create policy "내 영화 추가" on public.movies
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- 내 영화만 수정할 수 있고, 수정 후에도 내 영화여야 함
create policy "내 영화 수정" on public.movies
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 내 영화만 삭제할 수 있음
create policy "내 영화 삭제" on public.movies
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 참고: 이전에 넣어 둔 샘플 영화들은 user_id 가 비어 있어서 아무에게도 보이지 않습니다.
-- 필요 없다면 아래 줄의 주석(--)을 지우고 실행해서 정리하세요.
-- delete from public.movies where user_id is null;
