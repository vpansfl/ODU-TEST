"use client";

import { useEffect, useState } from "react";
import MovieCard from "./components/MovieCard";
import MovieForm from "./components/MovieForm";
import AuthStatus from "./components/AuthStatus";
import { supabase } from "../lib/supabase";

// 영화 한 편의 데이터 모양
export type Movie = {
  id: number;
  title: string;
  genre: string;
  rating: number;
  watchedDate: string;
  memo: string;
};

// 폼에서 입력받는 값 (id는 Supabase가 자동으로 만들어 줌)
export type MovieInput = Omit<Movie, "id">;

// Supabase movies 테이블의 한 줄 모양 (컬럼 이름은 snake_case)
type MovieRow = {
  id: number;
  title: string;
  genre: string;
  rating: number;
  watched_date: string;
  memo: string;
};

// 테이블 한 줄 → 화면에서 쓰는 Movie 모양으로 바꾸기
function rowToMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    rating: row.rating,
    watchedDate: row.watched_date,
    memo: row.memo,
  };
}

// 폼 입력값 → 테이블에 저장할 모양으로 바꾸기
function inputToRow(input: MovieInput) {
  return {
    title: input.title,
    genre: input.genre,
    rating: input.rating,
    watched_date: input.watchedDate,
    memo: input.memo,
  };
}

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
      .select("id, title, genre, rating, watched_date, memo")
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
    setIsFormOpen(true);
  }

  function openEditForm(movie: Movie) {
    setEditingMovie(movie);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingMovie(null);
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="site-label">My Cinema Diary</p>
          <h1 className="site-title">Movie Log</h1>
          <p className="site-subtitle">지금까지 본 영화 {movies.length}편</p>
        </div>
        <div className="header-actions">
          <AuthStatus />
          <button className="button button-primary" onClick={openAddForm}>
            + 영화 추가
          </button>
        </div>
      </header>

      {errorMessage && (
        <p className="empty-message" role="alert">
          {errorMessage}
        </p>
      )}

      {isFormOpen && (
        <MovieForm
          key={editingMovie ? editingMovie.id : "new"}
          movie={editingMovie}
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
