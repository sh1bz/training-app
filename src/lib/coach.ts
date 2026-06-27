// ── AI Coach — lightweight, rule-based ───────────────────────────
// Pure functions, no runes, no network. Takes a session + history and
// returns what to change. The store applies it.

import type { CoachActionId, CoachResult, Session, SessionExercise, LoggedSet } from './types';

const norm = (s: string) => s.trim().toLowerCase();
const round2 = (w: number) => (w <= 0 ? 0 : Math.round(w / 2.5) * 2.5);

// Compact substitution table: each key maps to fresh / home-friendly swaps.
// First entry is the gym variation, second is the no-equipment option.
const SWAPS: Record<string, { vary: string; home: string }> = {
  'barbell bench press': { vary: 'Dumbbell Bench Press', home: 'Push-Ups' },
  'bench press': { vary: 'Dumbbell Bench Press', home: 'Push-Ups' },
  'incline dumbbell press': { vary: 'Incline Smith Press', home: 'Push-Ups' },
  'overhead press': { vary: 'Seated Dumbbell Press', home: 'Pike Push-Ups' },
  'lateral raise': { vary: 'Cable Lateral Raise', home: 'Lateral Raise' },
  'cable tricep pushdown': { vary: 'Skullcrusher', home: 'Diamond Push-Ups' },
  'barbell row': { vary: 'Chest Supported Row', home: 'Dumbbell Row' },
  'pendlay row': { vary: 'Chest Supported Row', home: 'Dumbbell Row' },
  'deadlift': { vary: 'Trap Bar Deadlift', home: 'Single Leg RDL' },
  'romanian deadlift': { vary: 'Single Leg RDL', home: 'Single Leg RDL' },
  'pull-ups': { vary: 'Lat Pulldown', home: 'Inverted Row' },
  'chin-ups': { vary: 'Lat Pulldown', home: 'Inverted Row' },
  'face pulls': { vary: 'Reverse Pec Deck', home: 'Bent-Over Reverse Fly' },
  'bicep curl': { vary: 'Hammer Curl', home: 'Hammer Curl' },
  'back squat': { vary: 'Hack Squat', home: 'Bodyweight Squat' },
  'squat': { vary: 'Hack Squat', home: 'Goblet Squat' },
  'leg press': { vary: 'Hack Squat', home: 'Bodyweight Squat' },
  'walking lunge': { vary: 'Bulgarian Split Squat', home: 'Reverse Lunge' },
  'bulgarian split squat': { vary: 'Walking Lunge', home: 'Reverse Lunge' },
  'standing calf raise': { vary: 'Seated Calf Raise', home: 'Single Leg Calf Raise' }
};

const isCompound = (name: string) =>
  /bench|press|row|squat|deadlift|pull-up|chin-up|lunge|rdl|pulldown/.test(norm(name)) &&
  !/lateral|curl|pushdown|fly|raise|extension/.test(norm(name));

/** Rough wall-clock minutes for a session. */
export function estimateMinutes(ex: SessionExercise[]): number {
  return Math.round(ex.reduce((s, e) => s + e.sets.length * (45 + e.restSeconds), 0) / 60);
}

function resize(sets: LoggedSet[], n: number): LoggedSet[] {
  const done = sets.filter((s) => s.done);
  const last = sets[sets.length - 1] ?? { weight: 0, reps: 0, done: false };
  const out = sets.slice(0, Math.max(n, done.length));
  while (out.length < n) out.push({ weight: last.weight, reps: 0, done: false });
  return out;
}

const reweight = (sets: LoggedSet[], w: number) =>
  sets.map((s) => (s.done ? s : { ...s, weight: w }));

// ── One-tap actions ──────────────────────────────────────────────

function swap(session: Session, pick: (s: { vary: string; home: string }) => string, gate?: (n: string) => boolean): CoachResult['changes'] {
  return session.exercises.flatMap((ex) => {
    const e = SWAPS[norm(ex.name)];
    if (!e || (gate && !gate(ex.name))) return [];
    const to = pick(e);
    return to && norm(to) !== norm(ex.name) ? [{ exercise: ex.name, to }] : [];
  });
}

function applySwaps(session: Session, changes: CoachResult['changes']): SessionExercise[] {
  const map = new Map(changes.map((c) => [norm(c.exercise), c.to!]));
  return session.exercises.map((ex) =>
    map.has(norm(ex.name)) ? { ...ex, name: map.get(norm(ex.name))! } : ex
  );
}

export function applyAction(action: CoachActionId, session: Session, minutes?: number): CoachResult {
  if (action === 'easier') {
    const changes: CoachResult['changes'] = [];
    const exercises = session.exercises.map((ex) => {
      const n = Math.max(2, ex.sets.length - 1);
      const w = ex.sets[0]?.weight ?? 0;
      const nw = w > 0 ? round2(w * 0.9) : 0;
      let sets = resize(ex.sets, n);
      if (nw > 0) sets = reweight(sets, nw);
      const bits = [n < ex.sets.length ? `${ex.sets.length}→${n} sets` : '', nw && nw < w ? `${w}→${nw}kg` : ''].filter(Boolean);
      if (bits.length) changes.push({ exercise: ex.name, detail: bits.join(', ') });
      return { ...ex, sets };
    });
    return { title: 'Made it easier', summary: 'Dropped a set and ~10% load across the board.', changes, exercises };
  }

  if (action === 'harder') {
    const changes: CoachResult['changes'] = [];
    const exercises = session.exercises.map((ex) => {
      if (!isCompound(ex.name)) return ex;
      const n = ex.sets.length + 1;
      const w = ex.sets[0]?.weight ?? 0;
      const nw = w > 0 ? round2(w * 1.05) : 0;
      let sets = resize(ex.sets, n);
      if (nw > 0) sets = reweight(sets, nw);
      changes.push({ exercise: ex.name, detail: [`${ex.sets.length}→${n} sets`, nw > w ? `${w}→${nw}kg` : ''].filter(Boolean).join(', ') });
      return { ...ex, sets };
    });
    return { title: 'Made it harder', summary: 'Added a set and load to your compounds.', changes, exercises };
  }

  if (action === 'shorter') {
    const current = estimateMinutes(session.exercises);
    const target = minutes ?? Math.max(20, Math.round(current * 0.6));
    const changes: CoachResult['changes'] = [];
    let work = session.exercises.map((ex) => ({ ...ex, restSeconds: Math.max(45, ex.restSeconds - 30) }));
    while (estimateMinutes(work) > target && work.length > 3) {
      let idx = -1;
      for (let i = work.length - 1; i >= 0; i--) if (!isCompound(work[i].name)) { idx = i; break; }
      if (idx === -1) idx = work.length - 1;
      changes.push({ exercise: work[idx].name, detail: 'cut to save time' });
      work = work.filter((_, i) => i !== idx);
    }
    let guard = 0;
    while (estimateMinutes(work) > target && guard++ < 20) {
      let bi = -1, max = 2;
      work.forEach((e, i) => { if (e.sets.length > max) { max = e.sets.length; bi = i; } });
      if (bi === -1) break;
      changes.push({ exercise: work[bi].name, detail: `${work[bi].sets.length}→${work[bi].sets.length - 1} sets` });
      work[bi] = { ...work[bi], sets: resize(work[bi].sets, work[bi].sets.length - 1) };
    }
    return { title: 'Shorter session', summary: `Rebuilt around your big lifts to ~${estimateMinutes(work)} min (was ~${current}).`, changes, exercises: work };
  }

  if (action === 'longer') {
    const current = estimateMinutes(session.exercises);
    const changes: CoachResult['changes'] = [];
    const exercises = session.exercises.map((ex) => {
      if (!isCompound(ex.name)) return ex;
      changes.push({ exercise: ex.name, detail: `${ex.sets.length}→${ex.sets.length + 1} sets` });
      return { ...ex, sets: resize(ex.sets, ex.sets.length + 1) };
    });
    return { title: 'Longer session', summary: `Added volume to your compounds — now ~${estimateMinutes(exercises)} min (was ~${current}).`, changes, exercises };
  }

  if (action === 'no-equipment') {
    const changes = swap(session, (s) => s.home);
    return {
      title: 'No-equipment workout',
      summary: changes.length ? `Swapped ${changes.length} lift${changes.length === 1 ? '' : 's'} for bodyweight/dumbbell versions.` : 'Already doable with no equipment.',
      changes,
      exercises: applySwaps(session, changes)
    };
  }

  // gym-busy
  if (action === 'gym-busy') {
    const changes = swap(session, (s) => s.vary, (n) => /barbell|squat|leg press|bench/.test(norm(n)));
    return {
      title: 'Routed around the busy gym',
      summary: changes.length ? `Swapped ${changes.length} crowded-station lift${changes.length === 1 ? '' : 's'} for free alternatives.` : 'Nothing here needs a busy station.',
      changes,
      exercises: applySwaps(session, changes)
    };
  }

  // variations
  const changes = swap(session, (s) => s.vary);
  return {
    title: 'Fresh exercises',
    summary: changes.length ? `Rotated ${changes.length} movement${changes.length === 1 ? '' : 's'} to beat boredom.` : 'Your selection is already fresh.',
    changes,
    exercises: applySwaps(session, changes)
  };
}

// ── Smart progression (memory) ───────────────────────────────────

/** Suggest next working weight for an exercise from completed history. */
export function suggestWeight(name: string, repsMax: number, history: Session[], fallback: number): { weight: number; note: string } {
  const last = history
    .filter((s) => s.endedAt)
    .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
    .flatMap((s) => s.exercises.filter((e) => norm(e.name) === norm(name)))[0];
  if (!last) return { weight: round2(fallback), note: '' };
  const done = last.sets.filter((s) => s.done);
  if (!done.length) return { weight: round2(fallback), note: '' };
  const top = done.reduce((a, b) => Math.max(a, b.weight), 0);
  const working = done.filter((s) => s.weight >= top - 0.01);
  if (working.every((s) => s.reps >= repsMax) && top > 0) {
    const step = isCompound(name) ? 5 : 2.5;
    return { weight: round2(top + step), note: `↑ ${round2(top + step)}kg — you cleared every rep last time` };
  }
  if (working.filter((s) => s.reps < repsMax - 2).length >= 2 && top > 0) {
    return { weight: round2(top * 0.9), note: `↓ deload to ${round2(top * 0.9)}kg — let's rebuild` };
  }
  return { weight: round2(top || fallback), note: '' };
}

/** The logged sets from the most recent completed session of an exercise. */
export function lastSessionSets(name: string, history: Session[]): { weight: number; reps: number }[] {
  const sessions = history
    .filter((s) => s.endedAt)
    .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (norm(ex.name) !== norm(name)) continue;
      const done = ex.sets.filter((x) => x.done);
      if (done.length) return done.map((x) => ({ weight: x.weight, reps: x.reps }));
    }
  }
  return [];
}

// ── Natural-language coaching ────────────────────────────────────

export function interpret(message: string, session: Session): { reply: string; result?: CoachResult } {
  const t = ` ${norm(message)} `;
  const has = (...k: string[]) => k.some((w) => t.includes(w));

  const time = t.match(/(\d{2,3})\s*(?:min|mins|minutes|')/);
  if (time) {
    const m = +time[1];
    if (m >= 10 && m <= 180) return { reply: `Rebuilt to fit ${m} minutes.`, result: applyAction('shorter', session, m) };
  }
  if (has('hurt', 'pain', 'sore', 'ache', 'injur', 'tweak')) {
    return { reply: 'Sorry to hear that — I lightened the load and dropped a set so you can train around it. Stop if it sharpens.', result: applyAction('easier', session) };
  }
  if (has('tired', 'exhaust', 'slept bad', 'sleep bad', 'bad sleep', 'no sleep', 'fatigu', 'drained', 'rough night', 'low energy')) {
    return { reply: 'Rough day — let’s not dig a hole. Lighter and shorter today.', result: applyAction('easier', session) };
  }
  if (has('packed', 'busy', 'crowded', 'full', 'occupied', 'taken')) {
    return { reply: 'Crowded gym — here are versions you can do anywhere.', result: applyAction('gym-busy', session) };
  }
  if (has('strong', 'great', 'easy', 'energ', 'crush', 'fresh', 'feeling good')) {
    return { reply: 'Let’s capitalise — bumped the intensity up.', result: applyAction('harder', session) };
  }
  if (has('no equipment', 'home', 'hotel', 'travel', 'no gym', 'bodyweight')) {
    return { reply: 'No problem — bodyweight and dumbbells only.', result: applyAction('no-equipment', session) };
  }
  if (has('easier', 'lighter', 'too hard', 'less')) return { reply: 'Dialed it back.', result: applyAction('easier', session) };
  if (has('harder', 'heavier', 'tougher', 'more')) return { reply: 'Cranked it up.', result: applyAction('harder', session) };
  if (has('shorter', 'quick', 'rush', 'hurry')) return { reply: 'Compressed it for you.', result: applyAction('shorter', session) };
  if (has('longer', 'extra', 'more time')) return { reply: 'Added some volume.', result: applyAction('longer', session) };
  if (has('why', 'explain', 'reason')) {
    const comp = session.exercises.filter((e) => isCompound(e.name)).map((e) => e.name);
    const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
    return { reply: `Today’s ${session.workoutName} centres on ${comp.slice(0, 3).join(', ') || 'your main lifts'} — heavy compounds first while you’re fresh, accessories after. ${sets} sets, ~${estimateMinutes(session.exercises)} min. Ask me to make it easier, harder, shorter or longer anytime.` };
  }
  return { reply: 'I can adapt this session instantly. Try “shoulder hurts”, “I only have 30 mins”, “slept badly”, or “gym is packed” — or tap a quick action above.' };
}
