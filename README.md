# 하늘향 제품 소개 페이지

정적 HTML + [Supabase](https://supabase.com) (DB / 인증 / 이미지 스토리지) 기반.
제품에 붙인 QR을 스캔하면 해당 제품의 **생산·가공 과정**과 **활용법**을 볼 수 있고,
하단 관리자 페이지에서 블로그처럼 글을 쓰고 QR을 발급합니다.

## 구조

```
index.html          홈 (브랜드 소개 + 최근 성장 일지 3개)
list.html           전체 게시글 (검색·정렬)
detail.html         QR 스캔 시 도착하는 제품 상세 (?id=<uuid>)
offline.html        오프라인 안내 (PWA)
404.html            잘못된 주소 안내
admin/login.html    관리자 로그인·가입
admin/dashboard.html 글 목록 / QR 발급 / 계정 승인
admin/editor.html   글 작성·수정 빌더

assets/tailwind.css  ← 빌드 산출물 (직접 수정 금지)
assets/app.js        공통 스크립트 (Supabase 클라이언트, 유틸, 다크모드)
src/input.css        Tailwind 소스 + 색상 토큰(라이트/다크)
tailwind.config.js   디자인 토큰
scripts/generate-sitemap.mjs  sitemap.xml 생성
```

## 개발 / 빌드

```bash
npm install          # 최초 1회
npm run watch:css    # 개발 중: 클래스 바꾸면 자동 재빌드
npm run build        # 배포 전: CSS + sitemap 한 번에
```

로컬 미리보기:

```bash
npx serve .          # 또는  python3 -m http.server
```

## 배포

`main` 브랜치에 push → GitHub Pages 자동 반영.

`.github/workflows/build.yml` 이 push 시 `assets/tailwind.css` 를 다시 빌드하고
매일 새벽 `sitemap.xml` 을 갱신해 자동 커밋합니다. **GitHub Pages 설정은 그대로 두면 됩니다.**

> HTML/JS에서 Tailwind 클래스를 새로 썼다면, push 후 Actions가 CSS를 다시 빌드할 때까지
> 잠깐(≈1분) 스타일이 빠질 수 있습니다. 급하면 `npm run build:css` 후 함께 커밋하세요.

## 보안

**중요:** anon 키는 공개돼도 되지만, 실제 접근 제어는 Supabase RLS 정책이 담당합니다.
반드시 [`docs/보안-점검.md`](docs/보안-점검.md) 를 따라 정책을 확인/적용하세요.

## 알려진 한계

- **카카오톡 등 링크 미리보기**: `detail.html` 은 브라우저에서 JS로 그려지므로,
  JS를 실행하지 않는 메신저 미리보기에는 개별 제품의 제목·사진이 안 뜨고 기본값만 보입니다.
  (구글 검색은 JS를 실행하므로 색인에는 반영됩니다.)
  제품별 미리보기까지 필요하면 "빌드 시 제품별 정적 페이지 생성" 작업이 추가로 필요합니다.
