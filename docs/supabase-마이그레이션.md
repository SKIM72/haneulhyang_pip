# Supabase 마이그레이션 (한 번만 실행)

Supabase 대시보드 → **SQL Editor** 에서 아래를 실행하세요.
실행 전에도 사이트는 동작하지만, "제품 한눈에"와 "조회수" 기능은 이 작업 후에 켜집니다.

## 1. "제품 한눈에" 정보 컬럼

```sql
alter table public.posts
  add column if not exists content_meta text;
```

- 관리자 에디터의 "제품 한눈에" 입력값(수확 시기·원산지·보관법·주의사항 등)이 JSON 문자열로 저장됩니다.
- 이 컬럼이 없어도 저장은 되지만(해당 항목만 제외), 상세 페이지에 표가 안 나옵니다.

## 2. 제품별 조회수 (QR 스캔 통계)

```sql
create table if not exists public.post_views (
  id         bigint generated always as identity primary key,
  post_id    uuid references public.posts(id) on delete cascade,
  viewed_at  timestamptz not null default now()
);

create index if not exists post_views_post_id_idx on public.post_views (post_id);

alter table public.post_views enable row level security;

-- 방문자(비로그인 포함) 누구나 조회 기록을 남길 수 있음. 읽기는 불가.
drop policy if exists "post_views_insert" on public.post_views;
create policy "post_views_insert"
on public.post_views for insert
to anon, authenticated
with check (true);

-- 승인된 관리자만 집계를 읽을 수 있음.
drop policy if exists "post_views_admin_read" on public.post_views;
create policy "post_views_admin_read"
on public.post_views for select
to authenticated
using (
  (select email from auth.users where id = auth.uid()) = 'eowert72@gmail.com'
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_approved = true)
);
```

- 개인정보(IP·기기정보)는 저장하지 않습니다. `post_id` 와 시각만 남습니다.
- 같은 방문자가 새로고침해도 세션당 1회만 집계됩니다(브라우저 `sessionStorage` 기준).
- 관리자 대시보드의 각 글 옆에 `👁 숫자` 로 표시됩니다.

## 3. (선택) 오래된 조회 로그 자동 정리 — 매월 1회

`pg_cron` 으로 1년 지난 조회 기록을 매달 자동 삭제합니다. SQL Editor 에서 한 번만 실행:

```sql
-- pg_cron 확장 활성화 (한 번만)
create extension if not exists pg_cron;

-- 기존에 같은 이름의 작업이 있으면 먼저 해제 (재실행해도 안전하도록)
select cron.unschedule('purge-old-post-views')
where exists (select 1 from cron.job where jobname = 'purge-old-post-views');

-- 매월 1일 18:00 UTC (= 한국시간 매월 2일 03:00) 실행
select cron.schedule(
  'purge-old-post-views',
  '0 18 1 * *',
  $$ delete from public.post_views where viewed_at < now() - interval '1 year' $$
);
```

확인 / 관리:

```sql
select jobid, jobname, schedule, active from cron.job;              -- 등록된 작업 보기
select cron.unschedule('purge-old-post-views');                     -- 작업 삭제
select * from cron.job_run_details order by start_time desc limit 5; -- 최근 실행 이력
```

> 크론 스케줄은 **UTC** 기준입니다. `분 시 일 월 요일` 순서이며, `0 18 1 * *` = 매월 1일 18:00 UTC.
> Supabase 대시보드 **Integrations → Cron** 에서 GUI 로도 같은 작업을 만들 수 있습니다.
