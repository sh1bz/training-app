<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
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
    goto('/history');
  }

  function cancel() {
    if (!session) return;
    if (!confirm('Discard this workout?')) return;
    store.cancelWorkout(session.id);
    goto('/');
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

    <div class="exercises">
      {#each session.exercises as ex, exIdx (ex.templateId)}
        <section class="ex-card">
          <header class="ex-head">
            <div>
              <h3 class="ex-title">{ex.name}</h3>
              <div class="ex-target">
                Target {ex.targetRepsMin === ex.targetRepsMax
                  ? ex.targetRepsMin
                  : `${ex.targetRepsMin}–${ex.targetRepsMax}`} reps
              </div>
            </div>
          </header>

          <div class="set-grid head">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span></span>
          </div>

          {#each ex.sets as set, setIdx (setIdx)}
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
                oninput={(e) => updateWeight(exIdx, setIdx, (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="num-input"
                type="number"
                inputmode="numeric"
                value={set.reps || ''}
                placeholder="0"
                onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                oninput={(e) => updateReps(exIdx, setIdx, (e.currentTarget as HTMLInputElement).value)}
              />
              <button
                class="check-btn"
                class:checked={set.done}
                aria-label={set.done ? 'Mark not done' : 'Mark done'}
                onclick={() => toggleDone(exIdx, setIdx)}
                ondblclick={() => removeSet(exIdx, setIdx)}
              >
                {#if set.done}
                  <Icon name="check" size={16} color="#fff" />
                {/if}
              </button>
            </div>
          {/each}

          <button class="add-set" onclick={() => addSet(exIdx)}>
            <Icon name="plus" size={16} color="var(--blue)" />
            <span>Add Set</span>
          </button>
        </section>
      {/each}
    </div>

    <button class="finish-cta" onclick={finish}>Finish Workout</button>
  {:else}
    <div class="card empty">
      <div class="empty-title">Workout not found</div>
    </div>
  {/if}
</div>

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

  .exercises {
    display: flex;
    flex-direction: column;
    gap: 14px;
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

  .finish-cta {
    margin-top: 24px;
    width: 100%;
    padding: 16px;
    border-radius: 14px;
    background: var(--green);
    color: #000;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .finish-cta:active { opacity: 0.85; transform: scale(0.99); }

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
