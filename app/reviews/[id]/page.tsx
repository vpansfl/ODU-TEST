"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MovieCard from "../../components/MovieCard";
import MovieForm from "../../components/MovieForm";
import { supabase } from "../../../lib/supabase";
import {
  MOVIE_COLUMNS,
  inputToRow,
  rowToMovie,
  type Movie,
  type MovieInput,
} from "../../../lib/movies";

// 리뷰 보기 페이지: /reviews/3 → id가 3인 영화 리뷰 전체 보기
export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  // 수정 폼을 보여줄지 여부
  const [isEditing, setIsEditing] = useState(false);

  // 리뷰 한 개 불러오기 (RLS 덕분에 내 리뷰만 불러와짐)
  async function fetchMovie() {
    const { data, error } = await supabase
      .from("movies")
      .select(MOVIE_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setErrorMessage("리뷰를 불러오지 못했습니다: " + error.message);
    } else {
      setErrorMessage("");
      setMovie(data ? rowToMovie(data) : null);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 페이지가 열릴 때 데이터를 불러오는 용도
    fetchMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id가 바뀔 때만 다시 불러오면 됨
  }, [id]);

  // 리뷰 수정 (성공하면 true 반환)
  async function saveMovie(input: MovieInput) {
    if (!movie) return false;

    const { error } = await supabase.from("movies").update(inputToRow(input)).eq("id", movie.id);

    if (error) {
      setErrorMessage("저장하지 못했습니다: " + error.message);
      return false;
    }

    setIsEditing(false);
    await fetchMovie();
    return true;
  }

  // 리뷰 삭제 → 홈으로 이동
  async function deleteMovie(target: Movie) {
    if (!confirm(`"${target.title}" 기록을 삭제할까요?`)) return;

    const { error } = await supabase.from("movies").delete().eq("id", target.id);

    if (error) {
      setErrorMessage("삭제하지 못했습니다: " + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="review-page">
      <Link className="auth-home-link" href="/">
        ← Movie Log
      </Link>

      {errorMessage && (
        <p className="empty-message" role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="empty-message">리뷰를 불러오는 중…</p>
      ) : !movie ? (
        <p className="empty-message">
          리뷰를 찾을 수 없습니다. 로그인했는지, 내가 쓴 리뷰가 맞는지 확인해 주세요.
        </p>
      ) : isEditing ? (
        <MovieForm movie={movie} onSave={saveMovie} onCancel={() => setIsEditing(false)} />
      ) : (
        <MovieCard
          movie={movie}
          onEdit={() => setIsEditing(true)}
          onDelete={deleteMovie}
          isDetail
        />
      )}
    </main>
  );
}
