import Image from "next/image";
import Link from "next/link";
import type { Movie } from "../../lib/movies";

type MovieCardProps = {
  movie: Movie;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  // true: 리뷰 보기 페이지 (리뷰 전체 표시)
  // false: 목록 (긴 글은 …으로 줄이고, 누르면 리뷰 보기 페이지로 이동)
  isDetail?: boolean;
};

export default function MovieCard({ movie, onEdit, onDelete, isDetail = false }: MovieCardProps) {
  // 평점 숫자를 별(★)로 바꾸기
  const stars = "★".repeat(movie.rating) + "☆".repeat(5 - movie.rating);

  // "2026-09-12" → ["2026", "09", "12"]
  const [year, month, day] = movie.watchedDate.split("-");

  // 티켓 번호: 1 → "001"
  const ticketNumber = String(movie.id).padStart(3, "0");

  return (
    <article className={isDetail ? "ticket ticket-detail" : "ticket"}>
      {/* 맨 왼쪽: 포스터 (검색으로 쓴 리뷰만 있음) */}
      {movie.posterUrl && (
        <Image
          className="ticket-poster"
          src={movie.posterUrl}
          alt={`${movie.title} 포스터`}
          width={342}
          height={513}
          sizes={isDetail ? "200px" : "110px"}
        />
      )}

      {/* 가운데: 영화 정보 */}
      <div className="ticket-main">
        <div className="ticket-top">
          <span className="movie-genre">{movie.genre}</span>
          <span className="movie-rating" role="img" aria-label={`평점 5점 중 ${movie.rating}점`}>
            {stars}
          </span>
        </div>

        {isDetail ? (
          <h1 className="movie-title">{movie.title}</h1>
        ) : (
          <h2 className="movie-title">
            {/* 제목 링크가 카드 전체를 덮어서, 카드 어디를 눌러도 리뷰 보기로 이동 */}
            <Link className="ticket-link" href={`/reviews/${movie.id}`}>
              {movie.title}
            </Link>
          </h2>
        )}
        {movie.releaseDate && <p className="movie-release">{movie.releaseDate} 개봉</p>}
        <p className="movie-memo">{movie.memo}</p>

        <div className="card-buttons">
          <button
            className="button button-small"
            onClick={() => onEdit(movie)}
            aria-label={`${movie.title} 수정`}
          >
            수정
          </button>
          <button
            className="button button-small button-danger"
            onClick={() => onDelete(movie)}
            aria-label={`${movie.title} 삭제`}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 오른쪽: 티켓 끝부분 (감상일) */}
      <div className="ticket-stub">
        <span className="stub-label">Admit One</span>
        <span className="stub-month">{Number(month)}월</span>
        <span className="stub-day">{day}</span>
        <span className="stub-year">{year}</span>
        <span className="stub-number">No.{ticketNumber}</span>
      </div>
    </article>
  );
}
