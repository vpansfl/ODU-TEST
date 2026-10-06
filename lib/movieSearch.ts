// TMDB · KOBIS 영화 검색 (서버 전용)
// ⚠️ API 키를 사용하므로 app/api/... 의 서버 코드(route.ts)에서만 불러오세요.
//    클라이언트 컴포넌트에서는 아래 type 만 `import type` 으로 가져다 쓰세요.

// ===== 화면에 보낼 데이터 모양 =====

// 검색 결과 한 줄
export type MovieSearchResult = {
  key: string; // 목록에서 쓸 고유 키
  title: string; // 한국어 제목
  originalTitle: string; // 원제
  posterUrl: string | null; // TMDB 포스터
  koreaReleaseDate: string | null; // 한국 개봉일 (KOBIS 우선, 없으면 TMDB KR) "YYYY-MM-DD"
  releaseDate: string | null; // TMDB 기본 개봉일 (한국 개봉일이 없을 때 참고용)
  genres: string[]; // TMDB 우선, 없으면 KOBIS
  tmdbId: number | null; // 외부 ID
  kobisCode: string | null; // 외부 ID (KOBIS 영화코드)
};

// 선택한 영화의 상세 정보
export type MovieDetail = MovieSearchResult & {
  overview: string; // 줄거리 (TMDB)
  runtime: number | null; // 상영시간(분)
  directors: string[]; // 감독
  watchGrade: string | null; // 관람등급 (KOBIS)
};

// ===== 환경변수 (서버에서만 읽을 수 있음, NEXT_PUBLIC_ 이 아님) =====

function getTmdbKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error(".env.local 에 TMDB_API_KEY 를 설정해 주세요.");
  return key;
}

function getKobisKey() {
  const key = process.env.KOBIS_API_KEY;
  if (!key) throw new Error(".env.local 에 KOBIS_API_KEY 를 설정해 주세요.");
  return key;
}

// ===== TMDB =====

const TMDB_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w342";

type TmdbSearchItem = {
  id: number;
  title: string;
  original_title: string;
  release_date: string; // "YYYY-MM-DD" 또는 ""
  poster_path: string | null;
  genre_ids: number[];
};

type TmdbReleaseDates = {
  results: {
    iso_3166_1: string; // 국가 코드 (예: "KR")
    release_dates: { release_date: string; type: number }[];
  }[];
};

type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  release_dates?: TmdbReleaseDates;
  credits?: { crew: { job: string; name: string }[] };
};

// TMDB 에 GET 요청 보내기
async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(TMDB_URL + path);
  url.searchParams.set("api_key", getTmdbKey());
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB 요청 실패 (${response.status})`);
  return response.json();
}

// 장르 번호 → 이름 표 (한 번 받아 오면 서버가 켜져 있는 동안 재사용)
let tmdbGenreNames: Map<number, string> | null = null;

async function getTmdbGenreNames() {
  if (!tmdbGenreNames) {
    const data = await tmdbGet<{ genres: { id: number; name: string }[] }>("/genre/movie/list", {
      language: "ko-KR",
    });
    tmdbGenreNames = new Map(data.genres.map((genre) => [genre.id, genre.name]));
  }
  return tmdbGenreNames;
}

async function searchTmdb(query: string) {
  const data = await tmdbGet<{ results: TmdbSearchItem[] }>("/search/movie", {
    query,
    language: "ko-KR",
    include_adult: "false",
  });
  return data.results.slice(0, 10); // 상위 10개만 사용
}

// TMDB 개봉일 목록에서 한국(KR) 개봉일 찾기 (극장 개봉 우선)
function findKoreaReleaseDate(releaseDates: TmdbReleaseDates): string | null {
  const korea = releaseDates.results.find((item) => item.iso_3166_1 === "KR");
  if (!korea || korea.release_dates.length === 0) return null;

  // type 3: 극장 개봉, type 2: 제한 개봉
  const theatrical = korea.release_dates.find((date) => date.type === 3 || date.type === 2);
  const date = theatrical ?? korea.release_dates[0];
  return date.release_date.slice(0, 10);
}

async function getTmdbKoreaReleaseDate(tmdbId: number) {
  const data = await tmdbGet<TmdbReleaseDates>(`/movie/${tmdbId}/release_dates`);
  return findKoreaReleaseDate(data);
}

// ===== KOBIS (영화진흥위원회) =====

const KOBIS_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie";

type KobisListItem = {
  movieCd: string;
  movieNm: string; // 한국어 제목
  movieNmEn: string; // 영어 제목
  prdtYear: string; // 제작연도
  openDt: string; // 개봉일 "YYYYMMDD" 또는 ""
  genreAlt: string; // 장르 "드라마,코미디"
};

type KobisMovieInfo = {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  openDt: string;
  showTm: string; // 상영시간(분)
  genres: { genreNm: string }[];
  directors: { peopleNm: string }[];
  audits: { watchGradeNm: string }[];
};

// KOBIS 에 GET 요청 보내기
async function kobisGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(KOBIS_URL + path);
  url.searchParams.set("key", getKobisKey());
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`KOBIS 요청 실패 (${response.status})`);

  const data = await response.json();
  // KOBIS 는 키가 잘못돼도 200 으로 응답하고 faultInfo 에 오류를 담아 보냄
  if (data.faultInfo) throw new Error("KOBIS 오류: " + data.faultInfo.message);
  return data;
}

async function searchKobis(query: string) {
  const data = await kobisGet<{ movieListResult: { movieList: KobisListItem[] } }>(
    "/searchMovieList.json",
    { movieNm: query, itemPerPage: "20" }
  );

  // TMDB 처럼 성인물은 빼고, 여러 영화를 묶어 상영한 기록("Package Screening")도 제외
  return data.movieListResult.movieList.filter(
    (movie) => !movie.genreAlt.includes("성인물") && movie.movieNmEn !== "Package Screening"
  );
}

async function getKobisMovieInfo(kobisCode: string) {
  const data = await kobisGet<{ movieInfoResult: { movieInfo: KobisMovieInfo } }>(
    "/searchMovieInfo.json",
    { movieCd: kobisCode }
  );
  return data.movieInfoResult.movieInfo;
}

// ===== 작은 도우미 함수들 =====

// "20240131" → "2024-01-31" (빈 값이면 null)
function formatKobisDate(date: string): string | null {
  if (date.length !== 8) return null;
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

// "2024-01-31" → 2024
function getYear(date: string | null | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return year ? year : null;
}

// 제목 비교용: 소문자로 바꾸고 띄어쓰기·문장부호 제거
// 예) "스파이더맨: 노 웨이 홈" → "스파이더맨노웨이홈"
function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function splitGenres(genreAlt: string) {
  return genreAlt ? genreAlt.split(",").map((genre) => genre.trim()) : [];
}

// ===== TMDB ↔ KOBIS 매칭 =====

// 두 결과가 같은 영화일 가능성 점수 (0이면 다른 영화)
function getMatchScore(tmdb: TmdbSearchItem, kobis: KobisListItem) {
  // 1) 제목: TMDB 한국어 제목/원제 중 하나가 KOBIS 한국어 제목/영어 제목과 같아야 함
  const tmdbTitles = [tmdb.title, tmdb.original_title].map(normalizeTitle);
  const kobisTitles = [kobis.movieNm, kobis.movieNmEn].map(normalizeTitle).filter(Boolean);
  const isTitleSame = tmdbTitles.some((title) => kobisTitles.includes(title));
  if (!isTitleSame) return 0;

  // 2) 연도: TMDB 개봉연도를 KOBIS 한국 개봉연도·제작연도와 비교해서 더 가까운 쪽 사용
  //    (해외에서 먼저 개봉하고 한국에는 몇 년 늦게 개봉하는 영화가 있기 때문)
  const tmdbYear = getYear(tmdb.release_date);
  const kobisYears = [getYear(kobis.openDt), getYear(kobis.prdtYear)].filter(
    (year): year is number => year !== null
  );
  if (!tmdbYear || kobisYears.length === 0) return 1; // 연도를 모르면 제목만으로 약하게 매칭

  const yearGap = Math.min(...kobisYears.map((year) => Math.abs(tmdbYear - year)));
  if (yearGap === 0) return 3; // 같은 해
  if (yearGap === 1) return 2; // 해외 개봉과 한국 개봉이 1년 차이 나는 경우가 많음
  return 0; // 제목이 같아도 연도가 많이 다르면 다른 영화 (리메이크 등)
}

// ===== 밖에서 쓰는 함수 1: 검색 =====

export async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  // 두 API 를 동시에 검색 (한쪽이 실패해도 다른 쪽 결과는 보여줌)
  const [tmdbResult, kobisResult, genreResult] = await Promise.allSettled([
    searchTmdb(query),
    searchKobis(query),
    getTmdbGenreNames(),
  ]);

  if (tmdbResult.status === "rejected" && kobisResult.status === "rejected") {
    throw tmdbResult.reason;
  }
  if (tmdbResult.status === "rejected") console.error(tmdbResult.reason);
  if (kobisResult.status === "rejected") console.error(kobisResult.reason);

  const tmdbMovies = tmdbResult.status === "fulfilled" ? tmdbResult.value : [];
  const kobisMovies = kobisResult.status === "fulfilled" ? kobisResult.value : [];
  const genreNames = genreResult.status === "fulfilled" ? genreResult.value : new Map();

  const usedKobisCodes = new Set<string>();

  // 1) TMDB 결과마다 가장 잘 맞는 KOBIS 영화 찾기
  const results = await Promise.all(
    tmdbMovies.map(async (tmdb): Promise<MovieSearchResult> => {
      let bestKobis: KobisListItem | null = null;
      let bestScore = 0;
      for (const kobis of kobisMovies) {
        if (usedKobisCodes.has(kobis.movieCd)) continue;
        const score = getMatchScore(tmdb, kobis);
        if (score > bestScore) {
          bestScore = score;
          bestKobis = kobis;
        }
      }
      if (bestKobis) usedKobisCodes.add(bestKobis.movieCd);

      // 한국 개봉일: KOBIS 우선, 없으면 TMDB 의 KR 개봉일
      let koreaReleaseDate = bestKobis ? formatKobisDate(bestKobis.openDt) : null;
      if (!koreaReleaseDate) {
        koreaReleaseDate = await getTmdbKoreaReleaseDate(tmdb.id).catch(() => null);
      }

      // 장르: TMDB 우선, 없으면 KOBIS
      const tmdbGenres = tmdb.genre_ids
        .map((id) => genreNames.get(id))
        .filter((name): name is string => Boolean(name));
      const genres =
        tmdbGenres.length > 0 ? tmdbGenres : bestKobis ? splitGenres(bestKobis.genreAlt) : [];

      return {
        key: `tmdb-${tmdb.id}`,
        title: tmdb.title,
        originalTitle: tmdb.original_title,
        posterUrl: tmdb.poster_path ? TMDB_IMAGE_URL + tmdb.poster_path : null,
        koreaReleaseDate,
        releaseDate: tmdb.release_date || null,
        genres,
        tmdbId: tmdb.id,
        kobisCode: bestKobis?.movieCd ?? null,
      };
    })
  );

  // 2) TMDB 와 매칭되지 않은 KOBIS 영화도 뒤에 붙이기 (TMDB 에 없는 국내 영화 등)
  for (const kobis of kobisMovies) {
    if (usedKobisCodes.has(kobis.movieCd)) continue;
    results.push({
      key: `kobis-${kobis.movieCd}`,
      title: kobis.movieNm,
      originalTitle: kobis.movieNmEn,
      posterUrl: null,
      koreaReleaseDate: formatKobisDate(kobis.openDt),
      releaseDate: null,
      genres: splitGenres(kobis.genreAlt),
      tmdbId: null,
      kobisCode: kobis.movieCd,
    });
  }

  return results;
}

// ===== 밖에서 쓰는 함수 2: 상세 정보 =====

export async function getMovieDetail(
  tmdbId: number | null,
  kobisCode: string | null
): Promise<MovieDetail> {
  const [tmdb, kobis] = await Promise.all([
    tmdbId
      ? tmdbGet<TmdbMovie>(`/movie/${tmdbId}`, {
          language: "ko-KR",
          append_to_response: "release_dates,credits",
        })
      : null,
    kobisCode ? getKobisMovieInfo(kobisCode).catch(() => null) : null,
  ]);

  if (!tmdb && !kobis) throw new Error("영화 정보를 찾지 못했습니다.");

  // 줄거리: TMDB (한국어 줄거리가 없으면 영어 줄거리)
  let overview = tmdb?.overview ?? "";
  if (tmdb && !overview) {
    const english = await tmdbGet<TmdbMovie>(`/movie/${tmdb.id}`, { language: "en-US" }).catch(
      () => null
    );
    overview = english?.overview ?? "";
  }

  // 한국 개봉일: KOBIS 우선, 없으면 TMDB 의 KR 개봉일
  const koreaReleaseDate =
    (kobis && formatKobisDate(kobis.openDt)) ||
    (tmdb?.release_dates && findKoreaReleaseDate(tmdb.release_dates)) ||
    null;

  // 장르: TMDB 우선, 없으면 KOBIS
  const tmdbGenres = tmdb?.genres.map((genre) => genre.name) ?? [];
  const genres =
    tmdbGenres.length > 0 ? tmdbGenres : (kobis?.genres.map((genre) => genre.genreNm) ?? []);

  // 감독: KOBIS 우선(한국어 이름), 없으면 TMDB
  const kobisDirectors = kobis?.directors.map((person) => person.peopleNm) ?? [];
  const tmdbDirectors =
    tmdb?.credits?.crew.filter((person) => person.job === "Director").map((person) => person.name) ??
    [];

  return {
    key: tmdb ? `tmdb-${tmdb.id}` : `kobis-${kobisCode}`,
    title: tmdb?.title || kobis?.movieNm || "",
    originalTitle: tmdb?.original_title || kobis?.movieNmOg || kobis?.movieNmEn || "",
    posterUrl: tmdb?.poster_path ? TMDB_IMAGE_URL + tmdb.poster_path : null,
    koreaReleaseDate,
    releaseDate: tmdb?.release_date || null,
    genres,
    tmdbId: tmdb?.id ?? null,
    kobisCode: kobis?.movieCd ?? kobisCode,
    overview,
    runtime: tmdb?.runtime || Number(kobis?.showTm) || null,
    directors: kobisDirectors.length > 0 ? kobisDirectors : tmdbDirectors,
    watchGrade: kobis?.audits[0]?.watchGradeNm || null,
  };
}
