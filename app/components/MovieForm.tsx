import { useState, type FormEvent } from "react";
import type { Movie, MovieInput } from "../page";

type MovieFormProps = {
  movie: Movie | null; // null이면 추가, 값이 있으면 수정
  onSave: (input: MovieInput) => Promise<boolean>;
  onCancel: () => void;
};

export default function MovieForm({ movie, onSave, onCancel }: MovieFormProps) {
  const isEdit = movie !== null;
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
    };

    setIsSaving(true);
    const success = await onSave(input);
    // 성공하면 폼이 닫히므로, 실패했을 때만 버튼을 다시 풀어 주기
    if (!success) setIsSaving(false);
  }

  return (
    <form className="movie-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{isEdit ? "영화 수정" : "영화 추가"}</h2>

      <label className="form-label form-full">
        제목
        <input
          className="form-input"
          type="text"
          name="title"
          required
          autoComplete="off"
          placeholder="예: 인터스텔라…"
          defaultValue={movie?.title}
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
          defaultValue={movie?.genre}
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
          defaultValue={movie?.watchedDate}
        />
      </label>

      <label className="form-label form-full">
        메모
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
