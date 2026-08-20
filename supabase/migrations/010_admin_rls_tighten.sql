-- Tighten CMS RLS: only owner role can manage CMS tables
-- Specialists and operations managers retain work portal access only

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'owner'
  );
$$;

-- posts
drop policy if exists "Authenticated manage posts" on public.posts;

create policy "CMS admins manage posts"
  on public.posts for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- post_categories
drop policy if exists "Authenticated manage post categories" on public.post_categories;

create policy "CMS admins manage post categories"
  on public.post_categories for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- post_tags
drop policy if exists "Authenticated manage post tags" on public.post_tags;

create policy "CMS admins manage post tags"
  on public.post_tags for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- media_assets
drop policy if exists "Authenticated insert media assets" on public.media_assets;
drop policy if exists "Authenticated update media assets" on public.media_assets;
drop policy if exists "Authenticated delete media assets" on public.media_assets;

create policy "CMS admins insert media assets"
  on public.media_assets for insert
  to authenticated
  with check (public.is_cms_admin());

create policy "CMS admins update media assets"
  on public.media_assets for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy "CMS admins delete media assets"
  on public.media_assets for delete
  to authenticated
  using (public.is_cms_admin());

-- contact_submissions
drop policy if exists "Authenticated read contact submissions" on public.contact_submissions;
drop policy if exists "Authenticated update contact submissions" on public.contact_submissions;
drop policy if exists "Authenticated delete contact submissions" on public.contact_submissions;

create policy "CMS admins read contact submissions"
  on public.contact_submissions for select
  to authenticated
  using (public.is_cms_admin());

create policy "CMS admins update contact submissions"
  on public.contact_submissions for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy "CMS admins delete contact submissions"
  on public.contact_submissions for delete
  to authenticated
  using (public.is_cms_admin());

-- faqs_store
drop policy if exists "Authenticated manage faqs store" on public.faqs_store;

create policy "CMS admins manage faqs store"
  on public.faqs_store for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- site_analytics_events
drop policy if exists "Authenticated read site analytics" on public.site_analytics_events;

create policy "CMS admins read analytics"
  on public.site_analytics_events for select
  to authenticated
  using (public.is_cms_admin());

-- service_areas_store (legacy CMS store)
drop policy if exists "Authenticated manage service areas store" on public.service_areas_store;

create policy "CMS admins manage service areas store"
  on public.service_areas_store for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());
