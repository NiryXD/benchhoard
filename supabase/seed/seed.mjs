// Seed ~12 fake candidates for testing the discovery deck.
// Run from the repo root:  node supabase/seed/seed.mjs
// Uses the service key from .env (server-side only; bypasses RLS).
// Idempotent: wipes previous seed_% users first. Fake profiles are scattered
// within ~12km of YOUR profile's location (ltb_dev_scatter_seeds), so onboard
// with location permission granted before seeding.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

const year = new Date().getFullYear();
const bd = (age) => `${year - age}-06-15`;

/** portrait source: randomuser.me static portraits (free) */
const portrait = (gender, n) =>
  `https://randomuser.me/api/portraits/${gender === 'woman' ? 'women' : 'men'}/${n}.jpg`;

const SEEDS = [
  { id: 'seed_01', name: 'Madison', gender: 'woman', age: 26, industry: 'Finance', archetype: 'Finance Bro', title: 'Investment Banking Analyst', employer: 'Big Four-ish', headline: 'Will model our future in Excel', summary: 'Survived two busy seasons. Looking for someone who understands that 9pm dinner is early.', school: "Vanderbilt", degree: "Bachelor's", field: 'Finance', classYear: year - 4, q: 'What are your salary expectations?', a: 'Emotionally? Unlimited PTO.', p: 31 },
  { id: 'seed_02', name: 'Tyler', gender: 'man', age: 29, industry: 'Tech', archetype: 'Tech Bro', title: 'Senior Software Engineer', employer: 'Series B startup', headline: 'Shipping to prod and to DMs', summary: 'I have strong opinions about tabs vs spaces and brunch.', school: 'Georgia Tech', degree: "Master's", field: 'CS', classYear: year - 5, q: 'My toxic trait is checking Slack on vacation. Yours?', a: 'I A/B tested my dating profile. You are seeing variant B.', p: 32 },
  { id: 'seed_03', name: 'Priya', gender: 'woman', age: 28, industry: 'Healthcare / Medicine', archetype: 'Med Student (Unavailable Until 2031)', title: 'Resident, Internal Medicine', employer: 'University Hospital', headline: 'Free every third Sunday', summary: 'Can diagnose your sleep schedule from across the room.', school: 'Emory', degree: 'MD', field: 'Medicine', classYear: year - 2, q: 'Where do you see yourself in five years?', a: 'Attending. Possibly attending your birthday dinner, schedule permitting.', p: 44 },
  { id: 'seed_04', name: 'Marcus', gender: 'man', age: 31, industry: 'Consulting', archetype: 'Consultant (Will Explain Your Own Job To You)', title: 'Engagement Manager', employer: 'MBB-adjacent', headline: 'Let me circle back to you specifically', summary: 'Platinum status on two airlines. Home Tuesday through Thursday.', school: 'UVA', degree: 'MBA', field: 'Strategy', classYear: year - 3, q: 'Describe a conflict and how you resolved it.', a: 'Built a 2x2 matrix. The conflict resolved itself out of respect.', p: 33 },
  { id: 'seed_05', name: 'Sarah', gender: 'woman', age: 25, industry: 'Academia / Research', archetype: 'Neuroscience Girlie', title: 'PhD Candidate', employer: 'R1 Lab', headline: 'My western blots always work (lie)', summary: 'Fluent in grant-speak. My love language is acknowledgments sections.', school: 'UT Knoxville', degree: "Bachelor's", field: 'Neuroscience', classYear: year - 3, q: 'Tell me about a time you went above and beyond on a date.', a: 'Explained dopamine pathways AND paid for the tacos.', p: 47 },
  { id: 'seed_06', name: 'Jake', gender: 'man', age: 27, industry: 'Engineering', archetype: 'Gym Is My Second Office', title: 'Mechanical Engineer', employer: 'Aerospace supplier', headline: 'Tolerances tighter than my schedule', summary: 'I CAD all day and squat all evening. Spreadsheet for both.', school: 'Purdue', degree: "Bachelor's", field: 'Mechanical Engineering', classYear: year - 5, q: 'Why should we hire you?', a: 'Strong core values. Literally.', p: 12 },
  { id: 'seed_07', name: 'Elena', gender: 'woman', age: 30, industry: 'Law', archetype: 'Chronically On Email', title: 'Associate Attorney', employer: 'BigLaw', headline: 'Billable hours, unbillable charm', summary: 'I will read your terms and conditions. All of them.', school: 'Duke', degree: 'JD', field: 'Law', classYear: year - 4, q: 'Do you have any questions for us?', a: 'Yes — is this conversation privileged?', p: 26 },
  { id: 'seed_08', name: 'Dev', gender: 'man', age: 33, industry: 'Tech', archetype: 'Founder Era', title: 'Co-founder & CEO', employer: 'Stealth (it is a to-do app)', headline: 'Pre-seed, post-sleep', summary: 'My runway is 8 months. My optimism is unlimited.', school: 'Self-taught', degree: 'Self-Taught', field: 'Entrepreneurship', classYear: year - 10, q: 'Walk me through your dating resume.', a: 'Two acquisitions, one pivot, currently seeking strategic partnership.', p: 51 },
  { id: 'seed_09', name: 'Grace', gender: 'woman', age: 27, industry: 'Marketing / Media', archetype: 'Spreadsheet Romantic', title: 'Brand Manager', employer: 'CPG', headline: 'KPI: kisses per initiative', summary: 'I have a content calendar for our future anniversaries.', school: 'UNC', degree: "Bachelor's", field: 'Marketing', classYear: year - 5, q: 'What is your greatest weakness?', a: 'I say "let us take this offline" on dates.', p: 65 },
  { id: 'seed_10', name: 'Sam', gender: 'nonbinary', age: 26, industry: 'Arts / Entertainment', archetype: 'Recovering Academic', title: 'UX Designer', employer: 'Agency', headline: 'Left the PhD, kept the citations', summary: 'I will redesign your bookshelf and cite my sources.', school: 'RISD', degree: "Master's", field: 'Design', classYear: year - 2, q: 'My 5am morning routine includes…', a: 'Absolutely nothing. I am a 10am person and thriving.', p: 68 },
  { id: 'seed_11', name: 'Hannah', gender: 'woman', age: 24, industry: 'Education', archetype: 'Government Cheese', title: 'High School Teacher', employer: 'Public school district', headline: 'I have seen everything. Everything.', summary: 'Summers off. Patience of a saint, grading hand of steel.', school: 'UGA', degree: "Bachelor's", field: 'Education', classYear: year - 2, q: 'Describe your ideal off-site.', a: 'Anywhere without a fire drill.', p: 24 },
  { id: 'seed_12', name: 'Chris', gender: 'man', age: 34, industry: 'Construction / Trades', archetype: 'Gym Is My Second Office', title: 'Project Superintendent', employer: 'GC firm', headline: 'I build things that stay built', summary: 'On site at 6am, asleep by 10pm. Looking for my final inspection.', school: 'Trade school', degree: 'Trade Certification', field: 'Construction Mgmt', classYear: year - 12, q: 'What does work-life balance mean to you, romantically?', a: 'Hard hats off at the door.', p: 18 },
];

async function uploadPortrait(seed) {
  const res = await fetch(portrait(seed.gender, seed.p));
  if (!res.ok) throw new Error(`portrait fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const path = `${seed.id}/headshot.jpg`;
  const { error } = await supabase.storage
    .from('photos')
    .upload(path, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

async function main() {
  console.log('Wiping previous seeds…');
  const { error: delErr } = await supabase.from('profiles').delete().like('user_id', 'seed_%');
  if (delErr) throw delErr;

  for (const s of SEEDS) {
    process.stdout.write(`Seeding ${s.id} (${s.name})… `);
    const photoPath = await uploadPortrait(s);

    let { error } = await supabase.from('profiles').insert({
      user_id: s.id,
      first_name: s.name,
      headline: s.headline,
      executive_summary: s.summary,
      current_title: s.title,
      employer: s.employer,
      industry: s.industry,
      archetype: s.archetype,
      open_to_work: 'committed',
      birthdate: bd(s.age),
      gender: s.gender,
      last_active_at: new Date().toISOString(),
    });
    if (error) throw error;

    ({ error } = await supabase.from('education').insert({
      user_id: s.id, school: s.school, degree_level: s.degree, field: s.field, class_year: s.classYear,
    }));
    if (error) throw error;

    ({ error } = await supabase.from('experience').insert({
      user_id: s.id, title: s.title, company: s.employer, industry: s.industry,
      start_year: year - 3, end_year: null, one_liner: 'Exceeds expectations, allegedly.',
    }));
    if (error) throw error;

    ({ error } = await supabase.from('behavioral_answers').insert([
      { user_id: s.id, question: s.q, answer: s.a, position: 0 },
      { user_id: s.id, question: 'Why should we hire you?', answer: 'References available upon request. They are mostly positive.', position: 1 },
      { user_id: s.id, question: 'Do you have any questions for us?', answer: 'What does the benefits package look like? Asking for me.', position: 2 },
    ]));
    if (error) throw error;

    ({ error } = await supabase.from('photos').insert({
      user_id: s.id, slot: 'headshot', storage_path: photoPath, position: 0,
    }));
    if (error) throw error;

    // wide-open prefs so the mutual filter never blocks the tester's side
    ({ error } = await supabase.from('preferences').insert({
      user_id: s.id, age_min: 18, age_max: 99, max_distance_km: 300,
      genders: ['man', 'woman', 'nonbinary'],
    }));
    if (error) throw error;

    console.log('ok');
  }

  console.log('Scattering seeds near your location…');
  const { data: moved, error: scatterErr } = await supabase.rpc('ltb_dev_scatter_seeds');
  if (scatterErr) throw scatterErr;
  if (moved === 0) {
    console.warn('⚠ No real user with a location found — seeds have NO location yet.');
    console.warn('  Onboard in the app with location permission, then rerun: node supabase/seed/seed.mjs');
  } else {
    console.log(`Scattered ${moved} seed profiles within ~12km of you.`);
  }

  console.log('Recomputing desirability/completeness (ltb_nightly)…');
  const { error: nightlyErr } = await supabase.rpc('ltb_nightly');
  if (nightlyErr) throw nightlyErr;

  console.log(`Done: ${SEEDS.length} candidates seeded.`);
}

main().catch((e) => {
  console.error('Seed failed:', e.message ?? e);
  process.exit(1);
});
