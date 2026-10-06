import { getMovieDetail } from "../../../../lib/movieSearch";

// GET /api/movies/detail?tmdbId=157336&kobisCode=20141022
// 둘 중 하나만 있어도 됨
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tmdbId = Number(params.get("tmdbId")) || null;
  const kobisCode = params.get("kobisCode") || null;

  if (!tmdbId && !kobisCode) {
    return Response.json({ error: "tmdbId 또는 kobisCode 가 필요합니다." }, { status: 400 });
  }

  try {
    const movie = await getMovieDetail(tmdbId, kobisCode);
    return Response.json({ movie });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json({ error: "상세 정보를 불러오지 못했습니다: " + message }, { status: 500 });
  }
}
