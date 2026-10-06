import type { Movie } from "../page";

type MovieCardProps = {
  movie: Movie;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
};

export default function MovieCard({ movie, onEdit, onDelete }: MovieCardProps) {
  // 평점 숫자를 별(★)로 바꾸기
  const stars = "★".repeat(movie.rating) + "☆".repeat(5 - movie.rating);

  // "2026-09-12" → ["2026", "09", "12"]
  const [year, month, day] = movie.watchedDate.split("-");

  // 티켓 번호: 1 → "001"
  const ticketNumber = String(movie.id).padStart(3, "0");

  return (
    <article className="ticket">
      {/* 왼쪽: 영화 정보 */}
      <div className="ticket-main">
        <div className="ticket-top">
          <span className="movie-genre">{movie.genre}</span>
          <span className="movie-rating" role="img" aria-label={`평점 5점 중 ${movie.rating}점`}>
            {stars}
          </span>
        </div>

        <h2 className="movie-title">{movie.title}</h2>
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
