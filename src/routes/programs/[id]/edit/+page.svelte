<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';
  import type { ProgramColor } from '$lib/types';

  const programId = $derived($page.params.id ?? '');
  const program = $derived(store.getProgram(programId));

  const emojis = ['🏋️', '💪', '🦵', '🔥', '⚡', '🎯', '🏃', '🧘', '🤸', '🥊'];
  const colors: ProgramColor[] = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'yellow', 'red'];

  function cycleEmoji() {
    if (!program) return;
    const i = emojis.indexOf(program.emoji);
    store.updateProgram(programId, { emoji: emojis[(i + 1) % emojis.length] });
  }

  function setColor(c: ProgramColor) {
    store.updateProgram(programId, { color: c });
  }

  function setName(v: string) {
    store.updateProgram(programId, { name: v });
  }

  function setDesc(v: string) {
    store.updateProgram(programId, { description: v });
  }

  function setDays(v: string) {
    const n = Math.max(0, Math.min(7, parseInt(v) || 0));
    store.updateProgram(programId, { daysPerWeek: n });
  }

  function addWorkout() {
    const w = store.addWorkout(programId, 'New Workout');
    if (w) goto(`/programs/${programId}/workouts/${w.id}/edit`);
  }

  function removeWorkout(id: string, name: string) {
    if (!confirm(`Delete workout "${name}"?`)) return;
    store.removeWorkout(programId, id);
  }

  function deleteProgram() {
    if (!program) return;
    if (!confirm(`Delete program "${program.name}"? This cannot be undone.`)) return;
    store.deleteProgram(programId);
    goto('/programs');
  }
</script>

<svelte:head>
  <title>{program?.name ?? 'Edit'} — Edit</title>
</svelte:head>

<div class="page">
  <div class="topbar">
    <a class="back" href={`/programs/${programId}`}>
      <Icon name="back" size={24} color="var(--blue)" />
      <span>Back</span>
    </a>
    <a class="done" href={`/programs/${programId}`}>Done</a>
  </div>

  {#if program}
    <h1 class="page-title" style:margin-bottom="12px">Edit Program</h1>

    <div class="card identity">
      <button class="emoji-big" onclick={cycleEmoji} aria-label="Change emoji">
        {program.emoji}
      </button>
      <input
        class="name-input"
        type="text"
        placeholder="Program name"
        value={program.name}
        oninput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
      />
    </div>

    <div class="card">
      <label class="field">
        <span class="field-label">Description</span>
        <textarea
          class="field-input"
          rows="2"
          placeholder="Optional"
          value={program.description}
          oninput={(e) => setDesc((e.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
      </label>
      <div class="divider"></div>
      <label class="field row">
        <span class="field-label">Days per week</span>
        <input
          class="field-input num"
          type="number"
          min="0"
          max="7"
          inputmode="numeric"
          value={program.daysPerWeek || ''}
          placeholder="—"
          oninput={(e) => setDays((e.currentTarget as HTMLInputElement).value)}
        />
      </label>
    </div>

    <div class="section-label">Color</div>
    <div class="card colors">
      {#each colors as c}
        <button
          class="color-dot"
          class:active={program.color === c}
          style:background={`var(--${c})`}
          aria-label={c}
          onclick={() => setColor(c)}
        ></button>
      {/each}
    </div>

    <div class="section-header">
      <h2>Workouts</h2>
      <button class="action" onclick={addWorkout}>+ Add</button>
    </div>

    {#if program.workouts.length === 0}
      <div class="card empty">
        <div class="empty-title">No workouts</div>
        <div>Add your first workout to start configuring.</div>
      </div>
    {:else}
      <div class="list-card">
        {#each program.workouts as w (w.id)}
          <div class="list-row workout-row">
            <a class="workout-link" href={`/programs/${programId}/workouts/${w.id}/edit`}>
              <div class="leading" style:background="var(--bg-elev-2)">
                <Icon name="dumbbell" size={18} color="var(--text-secondary)" />
              </div>
              <div class="body">
                <div class="title">{w.name}</div>
                <div class="subtitle">
                  {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}
                </div>
              </div>
              <Icon name="chevron" size={16} color="var(--text-tertiary)" />
            </a>
            <button
              class="row-delete"
              aria-label={`Delete ${w.name}`}
              onclick={() => removeWorkout(w.id, w.name)}
            >
              <Icon name="trash" size={18} color="var(--red)" />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <div style:height="32px"></div>
    <button class="danger-btn" onclick={deleteProgram}>
      <Icon name="trash" size={18} color="var(--red)" />
      <span>Delete Program</span>
    </button>
  {:else}
    <div class="card empty">
      <div class="empty-title">Program not found</div>
    </div>
  {/if}
</div>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .back, .done {
    color: var(--blue);
    font-size: 17px;
    padding: 8px 4px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .back { margin-left: -8px; }
  .done { font-weight: 600; }

  .identity {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
  }
  .emoji-big {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: var(--bg-elev-2);
    font-size: 30px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .name-input {
    flex: 1;
    background: transparent;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
    padding: 8px 0;
  }
  .name-input::placeholder { color: var(--text-tertiary); }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;
  }
  .field.row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .field-label {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
  }
  .field.row .field-label { font-size: 16px; color: var(--text); }
  .field-input {
    background: transparent;
    font-size: 16px;
    color: var(--text);
    padding: 4px 0;
    width: 100%;
    resize: none;
    font-family: inherit;
  }
  .field-input.num {
    text-align: right;
    width: 60px;
    font-feature-settings: 'tnum';
  }
  .field-input::placeholder { color: var(--text-tertiary); }

  .colors {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .color-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: transform 0.1s ease, border-color 0.15s ease;
  }
  .color-dot.active {
    border-color: var(--text);
    transform: scale(1.1);
  }

  .workout-row {
    padding: 0;
    align-items: stretch;
  }
  .workout-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    flex: 1;
    color: var(--text);
    min-width: 0;
  }
  .workout-link:active { background: var(--bg-elev-2); }
  .row-delete {
    padding: 0 18px;
    border-left: 0.5px solid var(--separator);
  }
  .row-delete:active { background: var(--bg-elev-2); }

  .danger-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-card);
    background: var(--bg-elev-1);
    color: var(--red);
    font-size: 17px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .danger-btn:active { background: var(--bg-elev-2); }
</style>
