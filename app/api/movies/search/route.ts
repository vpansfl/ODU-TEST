import { searchMovies } from "../../../../lib/movieSearch";

// GET /api/movies/search?query=인터스텔라
// 브라우저 → (여기, Next.js 서버) → TMDB / KOBIS
// API 키는 서버에서만 사용하므로 브라우저에 노출되지 않음
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
  }

  try {
    const results = await searchMovies(query);
    return Response.json({ results });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json({ error: "영화를 검색하지 못했습니다: " + message }, { status: 500 });
  }
}
