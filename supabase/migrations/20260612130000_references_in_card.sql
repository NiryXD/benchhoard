-- Add approved reference letters to the profile card payload so they render
-- on the Resume ("References available upon request" — except we show them).

create or replace function ltb_profile_card(uid text) returns jsonb
  language sql stable security definer
  set search_path = public, extensions
  as $$
    select jsonb_build_object(
      'userId', p.user_id,
      'firstName', p.first_name,
      'age', ltb_age(p.birthdate),
      'headline', p.headline,
      'executiveSummary', p.executive_summary,
      'currentTitle', p.current_title,
      'employer', p.employer,
      'industry', p.industry,
      'archetype', p.archetype,
      'openToWork', p.open_to_work,
      'outOfOffice', p.out_of_office,
      'photos', coalesce((
        select jsonb_agg(jsonb_build_object('id', ph.id, 'slot', ph.slot, 'path', ph.storage_path) order by ph.position)
        from photos ph where ph.user_id = p.user_id), '[]'::jsonb),
      'answers', coalesce((
        select jsonb_agg(jsonb_build_object('id', ba.id, 'question', ba.question, 'answer', ba.answer) order by ba.position)
        from behavioral_answers ba where ba.user_id = p.user_id), '[]'::jsonb),
      'experience', coalesce((
        select jsonb_agg(jsonb_build_object('id', ex.id, 'title', ex.title, 'company', ex.company,
          'industry', ex.industry, 'startYear', ex.start_year, 'endYear', ex.end_year, 'oneLiner', ex.one_liner)
          order by ex.position)
        from experience ex where ex.user_id = p.user_id), '[]'::jsonb),
      'education', coalesce((
        select jsonb_agg(jsonb_build_object('id', ed.id, 'school', ed.school, 'degreeLevel', ed.degree_level,
          'field', ed.field, 'classYear', ed.class_year) order by ed.position)
        from education ed where ed.user_id = p.user_id), '[]'::jsonb),
      'references', coalesce((
        select jsonb_agg(jsonb_build_object('id', r.id, 'authorName', r.author_name,
          'relationship', r.relationship, 'body', r.body) order by r.created_at)
        from reference_letters r where r.user_id = p.user_id and r.is_approved), '[]'::jsonb)
    )
    from profiles p where p.user_id = uid
  $$;
