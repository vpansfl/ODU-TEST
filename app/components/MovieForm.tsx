import { useState, type FormEvent } from "react";
import Image from "next/image";
import type { Movie, MovieInput } from "../../lib/movies";
import type { MovieDetail } from "../../lib/movieSearch";

type MovieFormProps = {
  movie: Movie | null; // null이면 추가, 값이 있으면 수정
  reviewMovie?: MovieDetail | null; // 검색에서 "리뷰 쓰기"로 열었을 때 미리 채울 영화 정보
  onSave: (input: MovieInput) => Promise<boolean>;
  onCancel: () => void;
};

// 오늘 날짜 "YYYY-MM-DD" (리뷰 쓰기의 감상일 기본값)
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function MovieForm({ movie, reviewMovie, onSave, onCancel }: MovieFormProps) {
  const isEdit = movie !== null;
  const isReview = !isEdit && Boolean(reviewMovie);

  // 저장할 포스터와 개봉일 (수정: 기존 값 그대로 / 리뷰 쓰기: 검색한 영화 정보 / 직접 추가: 없음)
  const posterUrl = movie ? movie.posterUrl : (reviewMovie?.posterUrl ?? null);
  const releaseDate = movie
    ? movie.releaseDate
    : (reviewMovie?.koreaReleaseDate ?? reviewMovie?.releaseDate ?? null);

  // 폼 위쪽에 보여줄 영화 정보 (리뷰 쓰기·리뷰 수정 모두 같은 모양)
  const headerTitle = movie?.title ?? reviewMovie?.title ?? "";
  const headerOriginalTitle =
    reviewMovie && reviewMovie.originalTitle !== reviewMovie.title ? reviewMovie.originalTitle : "";
  const headerSummary = [
    releaseDate ? `${releaseDate} 개봉` : "",
    reviewMovie?.directors.join(", "),
    reviewMovie?.runtime ? `${reviewMovie.runtime}분` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const showHeader = isReview || (isEdit && Boolean(posterUrl || releaseDate));

  // 저장 중에는 버튼을 막아서 두 번 저장되지 않게 하기
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 폼에 입력된 값 꺼내기
    const formData = new FormData(event.currentTarget);
    const input: MovieInput = {
      title: String(formData.get("title")).trim(),
      genre: String(formData.get("genre")).trim(),
      rating: Number(formData.get("rating")),
      watchedDate: String(formData.get("watchedDate")),
      memo: String(formData.get("memo")).trim(),
      posterUrl,
      releaseDate,
    };

    setIsSaving(true);
    const success = await onSave(input);
    // 성공하면 폼이 닫히므로, 실패했을 때만 버튼을 다시 풀어 주기
    if (!success) setIsSaving(false);
  }

  return (
    <form className="movie-form" id="movie-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{isEdit ? "리뷰 수정" : isReview ? "리뷰 쓰기" : "영화 추가"}</h2>

      {/* 영화 정보 (포스터 · 제목 · 개봉일) */}
      {showHeader && (
        <div className="review-movie form-full">
          {posterUrl && (
            <Image
              className="review-movie-poster"
              src={posterUrl}
              alt={`${headerTitle} 포스터`}
              width={342}
              height={513}
              sizes="64px"
            />
          )}
          <div className="review-movie-info">
            <strong className="review-movie-title">{headerTitle}</strong>
            {headerOriginalTitle && (
              <span className="review-movie-meta">{headerOriginalTitle}</span>
            )}
            {headerSummary && <span className="review-movie-meta">{headerSummary}</span>}
          </div>
        </div>
      )}

      <label className="form-label form-full">
        제목
        <input
          className="form-input"
          type="text"
          name="title"
          required
          autoComplete="off"
          placeholder="예: 인터스텔라…"
          defaultValue={movie?.title ?? reviewMovie?.title}
        />
      </label>

      <label className="form-label">
        장르
        <input
          className="form-input"
          type="text"
          name="genre"
          autoComplete="off"
          placeholder="예: SF…"
          defaultValue={movie?.genre ?? reviewMovie?.genres.join(", ")}
        />
      </label>

      <label className="form-label">
        평점
        <select className="form-input" name="rating" defaultValue={movie?.rating ?? 5}>
          <option value={5}>★★★★★ (5)</option>
          <option value={4}>★★★★☆ (4)</option>
          <option value={3}>★★★☆☆ (3)</option>
          <option value={2}>★★☆☆☆ (2)</option>
          <option value={1}>★☆☆☆☆ (1)</option>
        </select>
      </label>

      <label className="form-label">
        감상일
        <input
          className="form-input"
          type="date"
          name="watchedDate"
          required
          defaultValue={movie?.watchedDate ?? (isReview ? getToday() : undefined)}
        />
      </label>

      <label className="form-label form-full">
        {isEdit || isReview ? "리뷰" : "메모"}
        <textarea
          className="form-input form-textarea"
          name="memo"
          autoComplete="off"
          placeholder="영화를 보고 느낀 점을 적어 보세요…"
          defaultValue={movie?.memo}
        />
      </label>

      <div className="form-buttons">
        <button className="button" type="button" onClick={onCancel}>
          취소
        </button>
        <button className="button button-primary" type="submit" disabled={isSaving}>
          {isSaving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
