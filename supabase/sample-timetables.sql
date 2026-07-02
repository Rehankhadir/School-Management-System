-- Sample timetable seed data for public.timetable_entries.
-- Run this in Supabase SQL Editor after remaining-modules.sql.

with plans(class_section, day_name, subjects) as (
  values
    ('6A', 'Monday', array['English','Mathematics','Short Break','Science','Social Studies','Hindi','Computer Science','Sports']),
    ('6A', 'Tuesday', array['Mathematics','Science','Short Break','English','Hindi','Art','Social Studies','Library']),
    ('6A', 'Wednesday', array['Science','English','Short Break','Mathematics','Computer Science','Hindi','Social Studies','Music']),
    ('6A', 'Thursday', array['Social Studies','Hindi','Short Break','Science','English','Mathematics','Computer Science','Sports']),
    ('6A', 'Friday', array['English','Mathematics','Short Break','Science Lab','Social Studies','Hindi','Art','Library']),

    ('7A', 'Monday', array['Mathematics','Science','Short Break','English','Social Studies','Hindi','Computer Science','Sports']),
    ('7A', 'Tuesday', array['English','Mathematics','Short Break','Science Lab','Hindi','Social Studies','Art','Library']),
    ('7A', 'Wednesday', array['Science','Social Studies','Short Break','Mathematics','English','Computer Science','Hindi','Music']),
    ('7A', 'Thursday', array['Hindi','English','Short Break','Science','Mathematics','Social Studies','Computer Science','Sports']),
    ('7A', 'Friday', array['Mathematics','Science','Short Break','English','Social Studies','Art','Hindi','Library']),

    ('8A', 'Monday', array['Science','Mathematics','Short Break','English','Computer Science','Social Studies','Hindi','Sports']),
    ('8A', 'Tuesday', array['Mathematics','English','Short Break','Science Lab','Social Studies','Hindi','Computer Science','Library']),
    ('8A', 'Wednesday', array['English','Science','Short Break','Mathematics','Hindi','Computer Science','Social Studies','Music']),
    ('8A', 'Thursday', array['Social Studies','Mathematics','Short Break','Science','English','Hindi','Art','Sports']),
    ('8A', 'Friday', array['Science','English','Short Break','Mathematics','Computer Science','Social Studies','Hindi','Library']),

    ('9A', 'Monday', array['Mathematics','Physics','Short Break','Chemistry','English','Biology','Computer Science','Sports']),
    ('9A', 'Tuesday', array['English','Mathematics','Short Break','Biology Lab','Physics','Chemistry','Social Studies','Library']),
    ('9A', 'Wednesday', array['Chemistry','English','Short Break','Mathematics','Physics Lab','Biology','Computer Science','Music']),
    ('9A', 'Thursday', array['Physics','Biology','Short Break','Chemistry','Mathematics','English','Social Studies','Sports']),
    ('9A', 'Friday', array['Mathematics','Chemistry','Short Break','English','Biology','Physics','Computer Science','Library']),

    ('10A', 'Monday', array['Mathematics','Physics','Short Break','Chemistry','English','Biology','Computer Science','Sports']),
    ('10A', 'Tuesday', array['Chemistry','English','Short Break','Mathematics','Physics Lab','Biology','Social Studies','Library']),
    ('10A', 'Wednesday', array['Biology','Mathematics','Short Break','Chemistry Lab','English','Physics','Computer Science','Music']),
    ('10A', 'Thursday', array['English','Physics','Short Break','Mathematics','Biology','Chemistry','Social Studies','Sports']),
    ('10A', 'Friday', array['Mathematics','Chemistry','Short Break','English','Physics','Biology','Computer Science','Library'])
),
periods(period, time_slot) as (
  values
    (1, '09:00 AM - 09:45 AM'),
    (2, '09:45 AM - 10:30 AM'),
    (3, '10:30 AM - 10:45 AM'),
    (4, '10:45 AM - 11:30 AM'),
    (5, '11:30 AM - 12:15 PM'),
    (6, '12:15 PM - 01:00 PM'),
    (7, '01:00 PM - 01:45 PM'),
    (8, '01:45 PM - 02:30 PM')
),
teacher_map(subject, teacher) as (
  values
    ('English', 'Nisha Sharma'),
    ('Mathematics', 'Arjun Mehta'),
    ('Science', 'Priya Nair'),
    ('Science Lab', 'Priya Nair'),
    ('Physics', 'Rahul Verma'),
    ('Physics Lab', 'Rahul Verma'),
    ('Chemistry', 'Meera Iyer'),
    ('Chemistry Lab', 'Meera Iyer'),
    ('Biology', 'Sana Khan'),
    ('Biology Lab', 'Sana Khan'),
    ('Hindi', 'Kavita Rao'),
    ('Social Studies', 'Vikram Singh'),
    ('Computer Science', 'Anita Das'),
    ('Art', 'Pooja Menon'),
    ('Music', 'Nisha Sharma'),
    ('Library', 'Library Staff'),
    ('Sports', 'Sports Coach'),
    ('Short Break', '')
)
insert into public.timetable_entries (
  id,
  class,
  section,
  day,
  period,
  time,
  subject,
  teacher,
  is_break,
  updated_by,
  updated_at
)
select
  'tt-' || left(plans.class_section, length(plans.class_section) - 1) || right(plans.class_section, 1) || '-' || lower(plans.day_name) || '-' || item.period,
  left(plans.class_section, length(plans.class_section) - 1),
  right(plans.class_section, 1),
  plans.day_name,
  item.period,
  periods.time_slot,
  item.subject,
  coalesce(teacher_map.teacher, ''),
  item.subject = 'Short Break',
  null,
  now()
from plans
cross join lateral unnest(plans.subjects) with ordinality as item(subject, period)
join periods on periods.period = item.period
left join teacher_map on teacher_map.subject = item.subject
on conflict (class, section, day, period)
do update set
  id = excluded.id,
  time = excluded.time,
  subject = excluded.subject,
  teacher = excluded.teacher,
  is_break = excluded.is_break,
  updated_at = now();

notify pgrst, 'reload schema';
