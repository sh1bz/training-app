<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount, onDestroy } from 'svelte';
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const session = $derived(store.getSession($page.params.id ?? ''));

  let now = $state(Date.now());
  let timer: ReturnType<typeof setInterval> | undefined;
  onMount(() => {
    timer = setInterval(() => (now = Date.now()), 1000);
  });
  onDestroy(() => clearInterval(timer));

  // ── Rest timer state ─────────────────────────────────
  let restEndAt = $state<number | null>(null);
  let restTotal = $state(0);
  let restAlerted = $state(false);

  const restRemaining = $derived(
    restEndAt === null ? 0 : Math.max(0, Math.ceil((restEndAt - now) / 1000))
  );
  const restProgress = $derived(
    restEndAt === null || restTotal === 0
      ? 0
      : Math.min(1, Math.max(0, 1 - restRemaining / restTotal))
  );

  $effect(() => {
    if (restEndAt !== null && restRemaining === 0 && !restAlerted) {
      restAlerted = true;
      try {
        navigator.vibrate?.([200, 80, 200]);
      } catch {}
    }
  });

  function startRest(seconds: number) {
    if (seconds <= 0) return;
    restTotal = seconds;
    restEndAt = Date.now() + seconds * 1000;
    restAlerted = false;
  }

  function bumpRest(delta: number) {
    if (restEndAt === null) return;
    restEndAt = Math.max(Date.now(), restEndAt + delta * 1000);
    restTotal = Math.max(restTotal + delta, 1);
    if (delta > 0) restAlerted = false;
  }

  function skipRest() {
    restEndAt = null;
    restTotal = 0;
    restAlerted = false;
  }

  function fmtRest(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const elapsed = $derived.by(() => {
    if (!session) return '0:00';
    const start = new Date(session.startedAt).getTime();
    const ms = Math.max(0, now - start);
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  });

  const progress = $derived.by(() => {
    if (!session) return { done: 0, total: 0 };
    let done = 0,
      total = 0;
    for (const ex of session.exercises) {
      total += ex.sets.length;
      done += ex.sets.filter((s) => s.done).length;
    }
    return { done, total };
  });

  // ── One-exercise-at-a-time pager ─────────────────────
  let current = $state(0);
  const exCount = $derived(session ? session.exercises.length : 0);
  const currentEx = $derived(session ? session.exercises[current] : undefined);
  const currentDone = $derived(
    !!currentEx && currentEx.sets.length > 0 && currentEx.sets.every((s) => s.done)
  );

  // Keep the index valid if the Coach rebuilds the exercise list.
  $effect(() => {
    if (current > exCount - 1) current = Math.max(0, exCount - 1);
  });

  function goTo(i: number) {
    if (i < 0 || i > exCount - 1) return;
    current = i;
    try {
      navigator.vibrate?.(10);
    } catch {}
  }

  // Swipe between exercises.
  let touchStartX = 0;
  let touchStartY = 0;
  function onTouchStart(e: TouchEvent) {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }
  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      goTo(current + (dx < 0 ? 1 : -1));
    }
  }

  function toggleDone(exIdx: number, setIdx: number) {
    if (!session) return;
    const set = session.exercises[exIdx].sets[setIdx];
    const becomingDone = !set.done;
    store.updateSet(session.id, exIdx, setIdx, { done: becomingDone });
    if (becomingDone) {
      const rest = session.exercises[exIdx]?.restSeconds ?? 0;
      if (rest > 0) startRest(rest);
      try {
        navigator.vibrate?.(20);
      } catch {}
    }
  }

  function updateWeight(exIdx: number, setIdx: number, value: string) {
    if (!session) return;
    const w = parseFloat(value);
    store.updateSet(session.id, exIdx, setIdx, { weight: isNaN(w) ? 0 : w });
  }

  function updateReps(exIdx: number, setIdx: number, value: string) {
    if (!session) return;
    const r = parseInt(value);
    store.updateSet(session.id, exIdx, setIdx, { reps: isNaN(r) ? 0 : r });
  }

  function addSet(exIdx: number) {
    if (!session) return;
    store.addSet(session.id, exIdx);
  }

  function removeSet(exIdx: number, setIdx: number) {
    if (!session) return;
    store.removeSet(session.id, exIdx, setIdx);
  }

  function finish() {
    if (!session) return;
    if (progress.done === 0) {
      if (!confirm('No sets completed. Finish anyway?')) return;
    }
    store.finishWorkout(session.id);
    goto(`${base}/history`);
  }

  function cancel() {
    if (!session) return;
    if (!confirm('Discard this workout?')) return;
    store.cancelWorkout(session.id);
    goto(`${base}/`);
  }
</script>

<svelte:head>
  <title>{session?.workoutName ?? 'Workout'}</title>
</svelte:head>

<div class="page workout-page">
  {#if session}
    <header class="workout-header">
      <button class="header-action" onclick={cancel} aria-label="Discard">
        <Icon name="close" size={22} color="var(--red)" />
      </button>
      <div class="header-center">
        <div class="header-title">{session.workoutName}</div>
        <div class="header-sub">
          <span class="dot"></span>
          {elapsed}
          <span class="sep">·</span>
          {progress.done}/{progress.total} sets
        </div>
      </div>
      <button class="header-action finish" onclick={finish} aria-label="Finish">
        <Icon name="check" size={20} color="var(--green)" />
      </button>
    </header>

    <div class="progress-bar" aria-hidden="true">
      <div
        class="progress-fill"
        style:width={`${progress.total ? (progress.done / progress.total) * 100 : 0}%`}
      ></div>
    </div>

    <div class="dots" aria-label="Exercises">
      {#each session.exercises as ex, i (ex.templateId)}
        {@const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.done)}
        <button
          class="dot-seg"
          class:active={i === current}
          class:done={allDone}
          onclick={() => goTo(i)}
          aria-label={`Exercise ${i + 1}: ${ex.name}`}
          aria-current={i === current ? 'step' : undefined}
        ></button>
      {/each}
    </div>

    {#if currentEx}
      <div
        class="ex-stage"
        role="group"
        aria-label={`${currentEx.name}, exercise ${current + 1} of ${exCount}. Swipe to change.`}
        ontouchstart={onTouchStart}
        ontouchend={onTouchEnd}
      >
        {#if session.coachNotes?.length && current === 0}
          <div class="coach-notes">
            <div class="coach-notes-head">
              <Icon name="sparkles" size={14} color="var(--blue)" />
              <span>Coach</span>
            </div>
            {#each session.coachNotes as note}
              <div class="coach-note">{note}</div>
            {/each}
          </div>
        {/if}

        {#key current}
          <section class="ex-card fade-up">
            <header class="ex-head">
              <div class="ex-count">Exercise {current + 1} of {exCount}</div>
              <h3 class="ex-title">{currentEx.name}</h3>
              <div class="ex-target">
                Target {currentEx.targetRepsMin === currentEx.targetRepsMax
                  ? currentEx.targetRepsMin
                  : `${currentEx.targetRepsMin}–${currentEx.targetRepsMax}`} reps
              </div>
            </header>

            <div class="set-grid head">
              <span>Set</span>
              <span>kg</span>
              <span>Reps</span>
              <span></span>
            </div>

            {#each currentEx.sets as set, setIdx (setIdx)}
              <div class="set-grid row" class:done={set.done}>
                <div class="set-num">{setIdx + 1}</div>
                <input
                  class="num-input"
                  type="number"
                  inputmode="decimal"
                  step="0.5"
                  value={set.weight || ''}
                  placeholder="0"
                  onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                  oninput={(e) => updateWeight(current, setIdx, (e.currentTarget as HTMLInputElement).value)}
                />
                <input
                  class="num-input"
                  type="number"
                  inputmode="numeric"
                  value={set.reps || ''}
                  placeholder="0"
                  onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                  oninput={(e) => updateReps(current, setIdx, (e.currentTarget as HTMLInputElement).value)}
                />
                <button
                  class="check-btn"
                  class:checked={set.done}
                  aria-label={set.done ? 'Mark not done' : 'Mark done'}
                  onclick={() => toggleDone(current, setIdx)}
                  ondblclick={() => removeSet(current, setIdx)}
                >
                  {#if set.done}
                    <Icon name="check" size={16} color="#fff" />
                  {/if}
                </button>
              </div>
            {/each}

            <button class="add-set" onclick={() => addSet(current)}>
              <Icon name="plus" size={16} color="var(--blue)" />
              <span>Add Set</span>
            </button>
          </section>
        {/key}
      </div>
    {/if}
  {:else}
    <div class="card empty">
      <div class="empty-title">Workout not found</div>
    </div>
  {/if}
</div>

{#if session && currentEx}
  <nav class="ex-dock" aria-label="Exercise navigation">
    <button class="dock-btn prev" disabled={current === 0} onclick={() => goTo(current - 1)}>
      <Icon name="back" size={20} color={current === 0 ? 'var(--text-tertiary)' : 'var(--text)'} />
      <span>Prev</span>
    </button>
    <div class="dock-pos">{current + 1} <span class="of">/</span> {exCount}</div>
    {#if current < exCount - 1}
      <button class="dock-btn next" class:ready={currentDone} onclick={() => goTo(current + 1)}>
        <span>Next</span>
        <Icon name="chevron" size={20} color="#fff" />
      </button>
    {:else}
      <button class="dock-btn finish" onclick={finish}>
        <span>Finish</span>
        <Icon name="check" size={18} color="#000" />
      </button>
    {/if}
  </nav>
{/if}

{#if restEndAt !== null}
  <div class="rest-banner" class:done={restRemaining === 0}>
    <div class="rest-progress" style:width={`${restProgress * 100}%`}></div>
    <div class="rest-content">
      <button class="rest-bump" onclick={() => bumpRest(-15)} aria-label="Subtract 15s">
        −15
      </button>
      <div class="rest-center">
        <div class="rest-label">{restRemaining === 0 ? 'Rest done' : 'Rest'}</div>
        <div class="rest-time">{fmtRest(restRemaining)}</div>
      </div>
      <button class="rest-bump" onclick={() => bumpRest(15)} aria-label="Add 15s">
        +15
      </button>
      <button class="rest-skip" onclick={skipRest} aria-label="Skip rest">
        <Icon name="close" size={18} color="var(--text)" />
      </button>
    </div>
  </div>
{/if}

<style>
  .workout-page {
    padding-top: calc(var(--safe-top) + 4px);
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .workout-header {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    gap: 8px;
    padding: 8px 0 12px;
  }
  .header-action {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-elev-1);
    display: grid;
    place-items: center;
  }
  .header-action.finish {
    background: rgba(48, 209, 88, 0.16);
  }
  .header-center {
    text-align: center;
    overflow: hidden;
  }
  .header-title {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .header-sub {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    color: var(--text-secondary);
    font-size: 13px;
    font-feature-settings: 'tnum';
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 1.6s ease-out infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.5); }
    70% { box-shadow: 0 0 0 6px rgba(48, 209, 88, 0); }
    100% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0); }
  }
  .sep { opacity: 0.5; }

  .progress-bar {
    height: 3px;
    background: var(--bg-elev-1);
    border-radius: 999px;
    overflow: hidden;
    margin: 0 0 20px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--blue), var(--green));
    transition: width 0.3s ease;
  }

  .coach-notes {
    background: linear-gradient(135deg, rgba(10, 132, 255, 0.12), rgba(191, 90, 242, 0.1));
    border: 0.5px solid rgba(10, 132, 255, 0.3);
    border-radius: var(--radius-card);
    padding: 12px 14px;
    margin-bottom: 16px;
  }
  .coach-notes-head {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--blue);
    margin-bottom: 6px;
  }
  .coach-note {
    font-size: 14px;
    color: var(--text);
    line-height: 1.35;
  }
  .coach-note + .coach-note {
    margin-top: 3px;
  }

  /* ── Pager: dots ───────────────────────────── */
  .dots {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }
  .dot-seg {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: var(--bg-elev-2);
    transition: background 0.2s ease, transform 0.15s ease;
  }
  .dot-seg.done {
    background: var(--green);
  }
  .dot-seg.active {
    background: var(--blue);
    transform: scaleY(1.6);
  }
  .dot-seg.active.done {
    background: var(--green);
  }

  /* ── Pager: stage ──────────────────────────── */
  .ex-stage {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .ex-count {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--blue);
    margin-bottom: 4px;
  }

  .ex-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 16px;
  }

  .ex-head { margin-bottom: 14px; }
  .ex-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .ex-target {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 2px;
  }

  .set-grid {
    display: grid;
    grid-template-columns: 32px 1fr 1fr 36px;
    align-items: center;
    gap: 10px;
  }
  .set-grid.head {
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0 0 6px;
  }
  .set-grid.row {
    padding: 6px 0;
    transition: background 0.2s ease;
    border-radius: 8px;
  }
  .set-grid.row.done {
    background: rgba(48, 209, 88, 0.08);
  }
  .set-num {
    color: var(--text-secondary);
    font-weight: 600;
    text-align: center;
    font-feature-settings: 'tnum';
  }

  .num-input {
    background: var(--bg-elev-2);
    border-radius: 10px;
    padding: 12px 8px;
    text-align: center;
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
    width: 100%;
    font-feature-settings: 'tnum';
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .num-input::-webkit-outer-spin-button,
  .num-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .num-input::placeholder { color: var(--text-quaternary); }
  .num-input:focus {
    background: var(--bg-elev-3);
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.5);
  }

  .check-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-elev-2);
    display: grid;
    place-items: center;
    transition: background 0.15s ease, transform 0.1s ease;
  }
  .check-btn:active { transform: scale(0.92); }
  .check-btn.checked {
    background: var(--green);
  }

  .add-set {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    color: var(--blue);
    font-size: 15px;
    font-weight: 500;
    border-radius: 8px;
  }
  .add-set:active { background: var(--bg-elev-2); }

  /* ── Pager: bottom nav dock ────────────────── */
  .ex-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    max-width: 640px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 10px 16px calc(10px + var(--safe-bottom));
    background: rgba(18, 18, 20, 0.82);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-top: 0.5px solid rgba(255, 255, 255, 0.08);
  }
  .dock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 48px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    transition: transform 0.08s ease, opacity 0.15s ease;
  }
  .dock-btn:active {
    transform: scale(0.96);
  }
  .dock-btn.prev {
    background: var(--bg-elev-2);
    color: var(--text);
    padding-right: 6px;
  }
  .dock-btn.prev:disabled {
    opacity: 0.4;
  }
  .dock-btn.next {
    background: var(--blue);
    color: #fff;
    padding-left: 14px;
  }
  .dock-btn.next.ready {
    animation: readyPulse 1.6s ease-in-out infinite;
  }
  .dock-btn.finish {
    background: var(--green);
    color: #000;
    padding: 0 16px;
  }
  @keyframes readyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(10, 132, 255, 0); }
    50% { box-shadow: 0 0 0 5px rgba(10, 132, 255, 0.28); }
  }
  .dock-pos {
    min-width: 52px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-secondary);
    font-feature-settings: 'tnum';
  }
  .dock-pos .of {
    color: var(--text-tertiary);
    margin: 0 1px;
  }

  .rest-banner {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + 4px);
    background: rgba(28, 28, 30, 0.92);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 0.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    overflow: hidden;
    z-index: 60;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.25s ease both;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rest-progress {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(10, 132, 255, 0.28), rgba(48, 209, 88, 0.28));
    transition: width 0.6s linear;
    pointer-events: none;
  }
  .rest-banner.done .rest-progress {
    background: rgba(48, 209, 88, 0.32);
    animation: pulseDone 1s ease-out infinite;
  }
  @keyframes pulseDone {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  .rest-content {
    position: relative;
    display: grid;
    grid-template-columns: 56px 1fr 56px 36px;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
  }

  .rest-bump {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    padding: 8px 0;
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    font-feature-settings: 'tnum';
  }
  .rest-bump:active { background: rgba(255, 255, 255, 0.16); }

  .rest-center {
    text-align: center;
    line-height: 1;
  }
  .rest-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .rest-time {
    font-size: 24px;
    font-weight: 700;
    margin-top: 2px;
    font-feature-settings: 'tnum';
    letter-spacing: -0.02em;
  }

  .rest-skip {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    display: grid;
    place-items: center;
  }
  .rest-skip:active { background: rgba(255, 255, 255, 0.16); }
</style>
