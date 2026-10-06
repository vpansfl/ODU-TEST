// 영화 기록(movies 테이블) 관련 타입과 변환 함수
// 홈 화면(app/page.tsx)과 리뷰 보기 화면(app/reviews/[id]/page.tsx)에서 함께 사용

// 영화 한 편의 데이터 모양
export type Movie = {
  id: number;
  title: string;
  genre: string;
  rating: number;
  watchedDate: string;
  memo: string;
  posterUrl: string | null; // 포스터 이미지 주소 (검색으로 쓴 리뷰만 있음)
  releaseDate: string | null; // 개봉일 "YYYY-MM-DD" (검색으로 쓴 리뷰만 있음)
};

// 폼에서 입력받는 값 (id는 Supabase가 자동으로 만들어 줌)
export type MovieInput = Omit<Movie, "id">;

// Supabase movies 테이블의 한 줄 모양 (컬럼 이름은 snake_case)
export type MovieRow = {
  id: number;
  title: string;
  genre: string;
  rating: number;
  watched_date: string;
  memo: string;
  poster_url: string | null;
  release_date: string | null;
};

// 조회할 컬럼 목록
export const MOVIE_COLUMNS = "id, title, genre, rating, watched_date, memo, poster_url, release_date";

// 테이블 한 줄 → 화면에서 쓰는 Movie 모양으로 바꾸기
export function rowToMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    rating: row.rating,
    watchedDate: row.watched_date,
    memo: row.memo,
    posterUrl: row.poster_url,
    releaseDate: row.release_date,
  };
}

// 폼 입력값 → 테이블에 저장할 모양으로 바꾸기
export function inputToRow(input: MovieInput) {
  return {
    title: input.title,
    genre: input.genre,
    rating: input.rating,
    watched_date: input.watchedDate,
    memo: input.memo,
    poster_url: input.posterUrl,
    release_date: input.releaseDate,
  };
}
