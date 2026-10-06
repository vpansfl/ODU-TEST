"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MovieCard from "./components/MovieCard";
import MovieForm from "./components/MovieForm";
import AuthStatus from "./components/AuthStatus";
import MovieSearch from "./components/MovieSearch";
import type { MovieDetail } from "../lib/movieSearch";
import { supabase } from "../lib/supabase";
import { MOVIE_COLUMNS, inputToRow, rowToMovie, type Movie, type MovieInput } from "../lib/movies";

export default function Home() {
  // Supabase에서 불러온 영화 목록
  const [movies, setMovies] = useState<Movie[]>([]);
  // 처음 목록을 불러오는 중인지 여부
  const [isLoading, setIsLoading] = useState(true);
  // 화면에 보여줄 오류 메시지
  const [errorMessage, setErrorMessage] = useState("");
  // 폼을 보여줄지 여부
  const [isFormOpen, setIsFormOpen] = useState(false);
  // 수정 중인 영화 (추가할 때는 null)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  // 검색에서 "리뷰 쓰기"를 누른 영화 (폼에 미리 채울 정보)
  const [reviewMovie, setReviewMovie] = useState<MovieDetail | null>(null);
  // 검색 영역 초기화용 번호 (로고를 누르면 1 증가)
  const [searchKey, setSearchKey] = useState(0);
  // 로그인한 사용자의 id (undefined: 아직 확인 중, null: 로그아웃 상태)
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  // 영화 목록 조회 (내 영화만, 최근에 본 영화가 위로)
  async function fetchMovies() {
    // 로그아웃 상태면 보여줄 영화가 없음
    if (!userId) {
      setMovies([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("movies")
      .select(MOVIE_COLUMNS)
      .eq("user_id", userId)
      .order("watched_date", { ascending: false });

    if (error) {
      setErrorMessage("영화 목록을 불러오지 못했습니다: " + error.message);
    } else {
      setErrorMessage("");
      setMovies(data.map(rowToMovie));
    }
    setIsLoading(false);
  }

  // 로그인 / 로그아웃될 때마다 현재 사용자 id 기억하기
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // 사용자가 정해지면(또는 바뀌면) 그 사람의 영화 목록 불러오기
  useEffect(() => {
    if (userId === undefined) return; // 아직 로그인 상태 확인 중
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 사용자가 바뀔 때 데이터를 불러오는 용도
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userId가 바뀔 때만 다시 불러오면 됨
  }, [userId]);

  // 영화 추가 또는 수정 (성공하면 true 반환)
  async function saveMovie(input: MovieInput) {
    if (!userId) {
      setErrorMessage("로그인 후 영화를 저장할 수 있습니다.");
      return false;
    }

    const row = inputToRow(input);

    // 새 영화에는 "누구의 영화인지" user_id를 함께 저장
    const { error } = editingMovie
      ? await supabase.from("movies").update(row).eq("id", editingMovie.id)
      : await supabase.from("movies").insert({ ...row, user_id: userId });

    if (error) {
      setErrorMessage("저장하지 못했습니다: " + error.message);
      return false;
    }

    closeForm();
    await fetchMovies();
    return true;
  }

  // 영화 삭제
  async function deleteMovie(movie: Movie) {
    if (!confirm(`"${movie.title}" 기록을 삭제할까요?`)) return;

    const { error } = await supabase.from("movies").delete().eq("id", movie.id);

    if (error) {
      setErrorMessage("삭제하지 못했습니다: " + error.message);
      return;
    }

    // 삭제 중인 영화를 수정하고 있었다면 폼 닫기
    if (editingMovie?.id === movie.id) closeForm();
    await fetchMovies();
  }

  function openAddForm() {
    setEditingMovie(null);
    setReviewMovie(null);
    setIsFormOpen(true);
  }

  function openEditForm(movie: Movie) {
    setEditingMovie(movie);
    setReviewMovie(null);
    setIsFormOpen(true);
    // 카드는 아래쪽에 있으므로, 폼이 그려진 다음 폼 위치로 스크롤
    setTimeout(() => document.getElementById("movie-form")?.scrollIntoView({ block: "start" }), 0);
  }

  // 검색 상세정보의 "리뷰 쓰기" → 그 영화 정보가 채워진 폼 열기
  function openReviewForm(movie: MovieDetail) {
    setEditingMovie(null);
    setReviewMovie(movie);
    setIsFormOpen(true);
    // 폼이 화면에 그려진 다음 폼 위치로 스크롤
    setTimeout(() => document.getElementById("movie-form")?.scrollIntoView({ block: "start" }), 0);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingMovie(null);
    setReviewMovie(null);
  }

  // 로고 클릭 → 홈 처음 상태로 (검색 결과·열린 폼 닫고 맨 위로)
  function goHome() {
    closeForm();
    setErrorMessage("");
    setSearchKey((key) => key + 1); // key가 바뀌면 검색 영역이 새로 그려지며 초기화됨
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="site-label">My Cinema Diary</p>
          <h1 className="site-title">
            <Link className="site-title-link" href="/" onClick={goHome}>
              Movie Log
            </Link>
          </h1>
          <p className="site-subtitle">지금까지 본 영화 {movies.length}편</p>
        </div>
        <div className="header-actions">
          <AuthStatus />
          <button className="button button-primary" onClick={openAddForm}>
            + 영화 추가
          </button>
        </div>
      </header>

      <MovieSearch key={searchKey} onWriteReview={openReviewForm} />

      {errorMessage && (
        <p className="empty-message" role="alert">
          {errorMessage}
        </p>
      )}

      {isFormOpen && (
        <MovieForm
          key={editingMovie ? editingMovie.id : (reviewMovie?.key ?? "new")}
          movie={editingMovie}
          reviewMovie={reviewMovie}
          onSave={saveMovie}
          onCancel={closeForm}
        />
      )}

      {isLoading ? (
        <p className="empty-message">영화 목록을 불러오는 중…</p>
      ) : !userId ? (
        <p className="empty-message">로그인하면 나의 영화 기록을 볼 수 있습니다.</p>
      ) : movies.length === 0 ? (
        <p className="empty-message">아직 기록한 영화가 없습니다. 첫 영화를 추가해 보세요.</p>
      ) : (
        <section className="movie-list">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onEdit={openEditForm}
              onDelete={deleteMovie}
            />
          ))}
        </section>
      )}
    </main>
  );
}
