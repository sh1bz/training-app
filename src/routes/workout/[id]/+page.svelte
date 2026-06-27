<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { store } from '$lib/store.svelte';
  import { lastSessionSets } from '$lib/coach';
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
  let dir = $state(1); // slide direction: 1 = forward, -1 = back
  const exCount = $derived(session ? session.exercises.length : 0);
  const currentEx = $derived(session ? session.exercises[current] : undefined);
  const currentDone = $derived(
    !!currentEx && currentEx.sets.length > 0 && currentEx.sets.every((s) => s.done)
  );

  let finishing = $state(false);
  const totalVolume = $derived.by(() => {
    if (!session) return 0;
    let v = 0;
    for (const ex of session.exercises)
      for (const s of ex.sets) if (s.done) v += s.weight * s.reps;
    return v;
  });

  // ── Guided, one-set-at-a-time logging ────────────────
  const prevSets = $derived(currentEx ? lastSessionSets(currentEx.name, store.sessions) : []);
  const activeIdx = $derived(currentEx ? currentEx.sets.findIndex((s) => !s.done) : -1);
  const allSetsDone = $derived(!!currentEx && currentEx.sets.length > 0 && activeIdx === -1);
  const activeSet = $derived(currentEx && activeIdx >= 0 ? currentEx.sets[activeIdx] : undefined);
  const remaining = $derived(currentEx && activeIdx >= 0 ? currentEx.sets.length - 1 - activeIdx : 0);

  function suggestedReps(i: number): number {
    if (!currentEx) return 0;
    return prevSets[i]?.reps ?? currentEx.targetRepsMax;
  }

  function prevLabel(i: number): string {
    const p = prevSets[i] ?? prevSets[prevSets.length - 1];
    if (!p) return 'First time — set your baseline';
    return p.weight ? `Last time · ${p.weight} kg × ${p.reps}` : `Last time · ${p.reps} reps`;
  }

  // Pre-fill the active set's reps with the suggested target so a matching set is one tap.
  $effect(() => {
    if (!session || !currentEx || activeIdx < 0) return;
    if (currentEx.sets[activeIdx].reps === 0) {
      const sug = suggestedReps(activeIdx);
      if (sug > 0) store.updateSet(session.id, current, activeIdx, { reps: sug });
    }
  });

  function bumpWeight(i: number, d: number) {
    if (!session || !currentEx) return;
    const w = Math.max(0, Math.round(((currentEx.sets[i].weight ?? 0) + d) * 2) / 2);
    store.updateSet(session.id, current, i, { weight: w });
  }
  function bumpReps(i: number, d: number) {
    if (!session || !currentEx) return;
    const r = Math.max(0, (currentEx.sets[i].reps ?? 0) + d);
    store.updateSet(session.id, current, i, { reps: r });
  }

  function completeSet() {
    if (!session || !currentEx || activeIdx < 0) return;
    const set = currentEx.sets[activeIdx];
    const reps = set.reps || suggestedReps(activeIdx);
    store.updateSet(session.id, current, activeIdx, { reps, done: true });
    const rest = currentEx.restSeconds ?? 0;
    if (rest > 0) startRest(rest);
    try {
      navigator.vibrate?.(25);
    } catch {}
  }

  function undoSet(i: number) {
    if (!session) return;
    store.updateSet(session.id, current, i, { done: false });
  }

  // Keep the index valid if the Coach rebuilds the exercise list.
  $effect(() => {
    if (current > exCount - 1) current = Math.max(0, exCount - 1);
  });

  function goTo(i: number) {
    if (i < 0 || i > exCount - 1) return;
    dir = i > current ? 1 : -1;
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

  function finish() {
    if (!session) return;
    if (progress.done === 0) {
      if (!confirm('No sets completed. Finish anyway?')) return;
    }
    finishing = true;
    try {
      navigator.vibrate?.([30, 40, 80]);
    } catch {}
    store.finishWorkout(session.id);
    setTimeout(() => goto(`${base}/history`), 1500);
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
          <section
            class="ex-card"
            in:fly={{ x: dir * 56, duration: 300, easing: cubicOut, opacity: 0 }}
          >
            <header class="ex-head">
              <div class="ex-count">Exercise {current + 1} of {exCount}</div>
              <h3 class="ex-title">{currentEx.name}</h3>
              <div class="ex-target">
                Target {currentEx.targetRepsMin === currentEx.targetRepsMax
                  ? currentEx.targetRepsMin
                  : `${currentEx.targetRepsMin}–${currentEx.targetRepsMax}`} reps · {currentEx.sets
                  .length} sets
              </div>
            </header>

            {#if currentEx.sets.some((s) => s.done)}
              <ul class="done-list">
                {#each currentEx.sets as s, i (i)}
                  {#if s.done}
                    <li>
                      <button class="done-row" onclick={() => undoSet(i)} aria-label={`Undo set ${i + 1}`}>
                        <span class="dl-check"><Icon name="check" size={13} color="#000" /></span>
                        <span class="dl-set">Set {i + 1}</span>
                        <span class="dl-val">{s.weight ? `${s.weight} kg` : 'BW'} × {s.reps}</span>
                      </button>
                    </li>
                  {/if}
                {/each}
              </ul>
            {/if}

            {#if !allSetsDone && activeSet}
              <div class="set-focus">
                <div class="sf-head">
                  <div class="sf-set">
                    Set {activeIdx + 1} <span class="sf-of">/ {currentEx.sets.length}</span>
                  </div>
                  <div class="sf-last">{prevLabel(activeIdx)}</div>
                </div>

                <div class="sf-controls">
                  <div class="stepper">
                    <button class="step-btn" onclick={() => bumpWeight(activeIdx, -2.5)} aria-label="Less weight">−</button>
                    <label class="step-field">
                      <input
                        class="big-num"
                        type="number"
                        inputmode="decimal"
                        step="0.5"
                        value={activeSet.weight || ''}
                        placeholder="0"
                        onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                        oninput={(e) => updateWeight(current, activeIdx, (e.currentTarget as HTMLInputElement).value)}
                      />
                      <span class="step-unit">kg</span>
                    </label>
                    <button class="step-btn" onclick={() => bumpWeight(activeIdx, 2.5)} aria-label="More weight">+</button>
                  </div>

                  <div class="stepper">
                    <button class="step-btn" onclick={() => bumpReps(activeIdx, -1)} aria-label="Fewer reps">−</button>
                    <label class="step-field">
                      <input
                        class="big-num"
                        type="number"
                        inputmode="numeric"
                        value={activeSet.reps || ''}
                        placeholder="0"
                        onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                        oninput={(e) => updateReps(current, activeIdx, (e.currentTarget as HTMLInputElement).value)}
                      />
                      <span class="step-unit">reps</span>
                    </label>
                    <button class="step-btn" onclick={() => bumpReps(activeIdx, 1)} aria-label="More reps">+</button>
                  </div>
                </div>

                <button class="complete-set" onclick={completeSet}>
                  <Icon name="check" size={20} color="#000" />
                  <span>Complete Set {activeIdx + 1}</span>
                </button>
                <div class="sf-remaining">
                  {remaining > 0
                    ? `${remaining} more ${remaining === 1 ? 'set' : 'sets'} to go`
                    : 'Last set — finish strong'}
                </div>
              </div>

              <button class="add-set" onclick={() => addSet(current)}>
                <Icon name="plus" size={16} color="var(--blue)" />
                <span>Add a set</span>
              </button>
            {:else}
              <div class="ex-complete">
                <div class="exc-ring"><Icon name="check" size={34} color="var(--green)" /></div>
                <div class="exc-title">{currentEx.name} complete</div>
                <div class="exc-sub">
                  {current < exCount - 1
                    ? 'Swipe or tap Next for your next exercise'
                    : 'Tap Finish to wrap up 💪'}
                </div>
              </div>
            {/if}
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

{#if finishing}
  <div class="celebrate" role="alertdialog" aria-label="Workout complete">
    <div class="celebrate-inner">
      <svg class="cel-check" viewBox="0 0 52 52" aria-hidden="true">
        <circle class="cel-ring" cx="26" cy="26" r="24" />
        <path class="cel-tick" d="M14 27 l8 8 l16 -18" />
      </svg>
      <div class="cel-title">Workout Complete</div>
      <div class="cel-stats">{progress.done} sets · {(totalVolume / 1000).toFixed(1)} t lifted</div>
    </div>
  </div>
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
    padding: 18px 16px;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
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

  /* ── Completed sets ────────────────────────── */
  .done-list {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .done-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    background: rgba(48, 209, 88, 0.1);
    color: var(--text);
    text-align: left;
    animation: rowIn 0.35s ease both;
  }
  .done-row:active { background: rgba(48, 209, 88, 0.2); }
  .dl-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--green);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .dl-set {
    font-weight: 600;
    font-size: 14px;
  }
  .dl-val {
    margin-left: auto;
    font-feature-settings: 'tnum';
    font-weight: 600;
    font-size: 15px;
  }

  /* ── Active set focus ──────────────────────── */
  .set-focus {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    padding: 8px 0;
  }
  .sf-head {
    text-align: center;
  }
  .sf-set {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.01em;
    font-feature-settings: 'tnum';
  }
  .sf-of {
    color: var(--text-tertiary);
    font-weight: 600;
  }
  .sf-last {
    margin-top: 4px;
    font-size: 14px;
    color: var(--text-secondary);
    font-feature-settings: 'tnum';
  }

  .sf-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .stepper {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    align-items: center;
    gap: 10px;
  }
  .step-btn {
    height: 56px;
    border-radius: 14px;
    background: var(--bg-elev-2);
    color: var(--text);
    font-size: 28px;
    line-height: 1;
    display: grid;
    place-items: center;
    transition: transform 0.08s ease, background 0.15s ease;
  }
  .step-btn:active { transform: scale(0.92); background: var(--bg-elev-3); }
  .step-field {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    background: var(--bg-elev-2);
    border-radius: 14px;
    height: 56px;
    padding: 0 8px;
  }
  .step-field:focus-within {
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.6);
  }
  .big-num {
    width: 100%;
    text-align: center;
    font-size: 30px;
    font-weight: 800;
    color: var(--text);
    font-feature-settings: 'tnum';
    -moz-appearance: textfield;
    appearance: textfield;
    background: transparent;
  }
  .big-num::-webkit-outer-spin-button,
  .big-num::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .big-num::placeholder { color: var(--text-quaternary); }
  .step-unit {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .complete-set {
    width: 100%;
    height: 58px;
    border-radius: 16px;
    background: var(--green);
    color: #000;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(48, 209, 88, 0.3);
    transition: transform 0.08s ease, opacity 0.15s ease;
  }
  .complete-set:active { transform: scale(0.98); opacity: 0.9; }
  .sf-remaining {
    text-align: center;
    font-size: 13px;
    color: var(--text-tertiary);
    margin-top: -8px;
  }

  /* ── Exercise complete state ───────────────── */
  .ex-complete {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 10px;
    padding: 24px 0;
    animation: celPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .exc-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(48, 209, 88, 0.14);
    border: 2px solid rgba(48, 209, 88, 0.5);
  }
  .exc-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .exc-sub {
    font-size: 14px;
    color: var(--text-secondary);
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

  /* ── Finish celebration ────────────────────── */
  .celebrate {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    padding: 24px;
    background: radial-gradient(circle at center, rgba(10, 132, 255, 0.18), rgba(0, 0, 0, 0.94) 70%);
    animation: celIn 0.35s ease both;
  }
  @keyframes celIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .celebrate-inner {
    text-align: center;
    animation: celPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes celPop {
    from { opacity: 0; transform: scale(0.82) translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  .cel-check {
    width: 108px;
    height: 108px;
    margin-bottom: 22px;
  }
  .cel-ring {
    fill: none;
    stroke: var(--green);
    stroke-width: 3;
    stroke-dasharray: 151;
    stroke-dashoffset: 151;
    animation: drawRing 0.6s ease forwards 0.12s;
  }
  .cel-tick {
    fill: none;
    stroke: var(--green);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
    animation: drawTick 0.34s cubic-bezier(0.65, 0, 0.35, 1) forwards 0.58s;
    filter: drop-shadow(0 0 8px rgba(48, 209, 88, 0.6));
  }
  @keyframes drawRing { to { stroke-dashoffset: 0; } }
  @keyframes drawTick { to { stroke-dashoffset: 0; } }
  .cel-title {
    font-size: 27px;
    font-weight: 800;
    letter-spacing: -0.02em;
    animation: fadeUp 0.45s ease both 0.72s;
  }
  .cel-stats {
    margin-top: 6px;
    color: var(--text-secondary);
    font-size: 16px;
    font-feature-settings: 'tnum';
    animation: fadeUp 0.45s ease both 0.86s;
  }
</style>
