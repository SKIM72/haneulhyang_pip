/**
 * sitemap.xml 생성 스크립트
 * - 정적 페이지 + Supabase 에 발행(published)된 제품 상세 페이지를 모아 sitemap 을 만든다.
 * - GitHub Actions 에서 빌드 시 + 하루 1회 스케줄로 실행되어 최신 상태를 유지한다.
 * - anon 키만 사용하므로(공개 데이터 조회) 별도 비밀값이 필요 없다.
 */
import { writeFile } from "node:fs/promises";

const SITE = "https://haneulhyang.shop";
const SUPABASE_URL = "https://eyoahkbqfxcisvmkvikp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5b2Foa2JxZnhjaXN2bWt2aWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDAzODUsImV4cCI6MjA5NTAxNjM4NX0.-JgH5ACzfq-d96VXEZlXovXx0w_uR3gJiwonaushah8";

const staticPages = [
  { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
  { loc: `${SITE}/list.html`, priority: "0.7", changefreq: "weekly" },
];

async function fetchPosts() {
  const url = `${SUPABASE_URL}/rest/v1/posts?select=id,created_at,updated_at&status=eq.published&order=created_at.desc`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`Supabase 응답 오류(${res.status}). 정적 페이지만 포함합니다.`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("게시글 조회 실패. 정적 페이지만 포함합니다.", err.message);
    return [];
  }
}

function urlEntry({ loc, lastmod, priority, changefreq }) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

const posts = await fetchPosts();

const entries = [
  ...staticPages.map(urlEntry),
  ...posts.map((p) =>
    urlEntry({
      loc: `${SITE}/detail.html?id=${p.id}`,
      lastmod: new Date(p.updated_at || p.created_at).toISOString(),
      priority: "0.8",
      changefreq: "monthly",
    })
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

await writeFile(new URL("../sitemap.xml", import.meta.url), xml, "utf8");
console.log(`sitemap.xml 생성 완료 — 정적 ${staticPages.length}개 + 게시글 ${posts.length}개`);
