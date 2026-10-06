"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import type { MovieDetail, MovieSearchResult } from "../../lib/movieSearch";

// 개봉일 표시: 한국 개봉일 우선, 없으면 TMDB 기본 개봉일
function formatReleaseDate(movie: MovieSearchResult) {
  if (movie.koreaReleaseDate) return `${movie.koreaReleaseDate} 개봉`;
  if (movie.releaseDate) return `${movie.releaseDate} 개봉 (해외)`;
  return "개봉일 정보 없음";
}

// 포스터 (없으면 빈 자리)
function Poster({ movie, sizes }: { movie: MovieSearchResult; sizes: string }) {
  if (!movie.posterUrl) {
    return <div className="search-poster search-poster-empty">No Poster</div>;
  }
  return (
    <Image
      className="search-poster"
      src={movie.posterUrl}
      alt={`${movie.title} 포스터`}
      width={342}
      height={513}
      sizes={sizes}
    />
  );
}

type MovieSearchProps = {
  // 상세정보의 "리뷰 쓰기"를 눌렀을 때 (선택한 영화 정보를 넘겨줌)
  onWriteReview: (movie: MovieDetail) => void;
};

export default function MovieSearch({ onWriteReview }: MovieSearchProps) {
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // 검색을 한 번이라도 했는지 (결과 없음 안내용)
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 선택한 영화
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 1. 검색: 브라우저 → Next.js 서버(/api/movies/search) → TMDB / KOBIS
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("query")).trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMessage("");
    closeDetail();

    const response = await fetch("/api/movies/search?query=" + encodeURIComponent(query));
    const data = await response.json();

    if (response.ok) {
      setResults(data.results);
    } else {
      setResults([]);
      setErrorMessage(data.error);
    }
    setHasSearched(true);
    setIsSearching(false);
  }

  // 2. 영화 선택: 상세 정보 불러오기
  async function selectMovie(movie: MovieSearchResult) {
    setSelectedKey(movie.key);
    setDetail(null);
    setIsLoadingDetail(true);
    setErrorMessage("");

    const params = new URLSearchParams();
    if (movie.tmdbId) params.set("tmdbId", String(movie.tmdbId));
    if (movie.kobisCode) params.set("kobisCode", movie.kobisCode);

    const response = await fetch("/api/movies/detail?" + params.toString());
    const data = await response.json();

    if (response.ok) {
      setDetail(data.movie);
    } else {
      setErrorMessage(data.error);
      setSelectedKey(null);
    }
    setIsLoadingDetail(false);
  }

  function closeDetail() {
    setSelectedKey(null);
    setDetail(null);
  }

  return (
    <section className="movie-search">
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="form-input"
          type="search"
          name="query"
          required
          autoComplete="off"
          aria-label="영화 제목 검색"
          placeholder="영화 제목으로 검색…"
        />
        <button className="button button-primary" type="submit" disabled={isSearching}>
          {isSearching ? "검색 중…" : "검색"}
        </button>
      </form>

      {errorMessage && (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}

      {/* 선택한 영화 상세 정보 */}
      {selectedKey && (
        <article className="search-detail" aria-live="polite">
          {isLoadingDetail || !detail ? (
            <p className="search-detail-loading">상세 정보를 불러오는 중…</p>
          ) : (
            <>
              <Poster movie={detail} sizes="180px" />

              <div className="search-detail-info">
                <h2 className="search-detail-title">{detail.title}</h2>
                {detail.originalTitle && detail.originalTitle !== detail.title && (
                  <p className="search-detail-original">{detail.originalTitle}</p>
                )}

                <dl className="search-detail-meta">
                  <dt>개봉일</dt>
                  <dd>{formatReleaseDate(detail)}</dd>
                  <dt>장르</dt>
                  <dd>{detail.genres.join(", ") || "-"}</dd>
                  <dt>감독</dt>
                  <dd>{detail.directors.join(", ") || "-"}</dd>
                  <dt>상영시간</dt>
                  <dd>{detail.runtime ? `${detail.runtime}분` : "-"}</dd>
                  <dt>관람등급</dt>
                  <dd>{detail.watchGrade ?? "-"}</dd>
                </dl>

                <p className="search-detail-overview">
                  {detail.overview || "줄거리 정보가 없습니다."}
                </p>

                <p className="search-detail-ids">
                  TMDB {detail.tmdbId ?? "-"} · KOBIS {detail.kobisCode ?? "-"}
                </p>

                <div className="search-detail-buttons">
                  <button className="button" type="button" onClick={closeDetail}>
                    닫기
                  </button>
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => onWriteReview(detail)}
                  >
                    리뷰 쓰기
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      )}

      {/* 검색 결과 목록 */}
      {hasSearched && !isSearching && results.length === 0 && !errorMessage && (
        <p className="empty-message">검색 결과가 없습니다.</p>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((movie) => (
            <li key={movie.key}>
              <button
                className={
                  movie.key === selectedKey ? "search-result search-result-selected" : "search-result"
                }
                type="button"
                onClick={() => selectMovie(movie)}
                aria-pressed={movie.key === selectedKey}
              >
                <Poster movie={movie} sizes="160px" />
                <span className="search-result-title">{movie.title}</span>
                <span className="search-result-meta">{formatReleaseDate(movie)}</span>
                <span className="search-result-meta">{movie.genres.join(", ") || "장르 정보 없음"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
