<script lang="ts">
  import { page } from '$app/stores';
  import { store, formatRest } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const programId = $derived($page.params.id ?? '');
  const workoutId = $derived($page.params.wid ?? '');
  const program = $derived(store.getProgram(programId));
  const workout = $derived(store.getWorkout(programId, workoutId));

  let expandedId = $state<string | null>(null);

  function setName(v: string) {
    store.updateWorkout(programId, workoutId, { name: v });
  }

  function addExercise() {
    const ex = store.addExercise(programId, workoutId, 'New Exercise');
    if (ex) expandedId = ex.id;
  }

  function removeExercise(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    store.removeExercise(programId, workoutId, id);
    if (expandedId === id) expandedId = null;
  }

  function update(id: string, patch: Record<string, unknown>) {
    store.updateExercise(programId, workoutId, id, patch);
  }

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  const restPresets = [60, 90, 120, 150, 180, 240];
</script>

<svelte:head>
  <title>{workout?.name ?? 'Workout'} — Edit</title>
</svelte:head>

<div class="page">
  <div class="topbar">
    <a class="back" href={`/programs/${programId}/edit`}>
      <Icon name="back" size={24} color="var(--blue)" />
      <span>{program?.name ?? 'Program'}</span>
    </a>
    <a class="done" href={`/programs/${programId}/edit`}>Done</a>
  </div>

  {#if workout && program}
    <div class="card identity">
      <input
        class="name-input"
        type="text"
        placeholder="Workout name"
        value={workout.name}
        oninput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
      />
    </div>

    <div class="section-header">
      <h2>Exercises</h2>
      <button class="action" onclick={addExercise}>+ Add</button>
    </div>

    {#if workout.exercises.length === 0}
      <div class="card empty">
        <div class="empty-title">No exercises</div>
        <div>Add an exercise to start configuring targets.</div>
      </div>
    {:else}
      <div class="ex-list">
        {#each workout.exercises as ex (ex.id)}
          {@const open = expandedId === ex.id}
          <article class="ex-card" class:open>
            <button class="ex-summary" onclick={() => toggle(ex.id)}>
              <div class="ex-meta">
                <div class="ex-title">{ex.name || 'Untitled'}</div>
                <div class="ex-sub">
                  {ex.targetSets} × {ex.targetRepsMin === ex.targetRepsMax
                    ? ex.targetRepsMin
                    : `${ex.targetRepsMin}–${ex.targetRepsMax}`}
                  {#if ex.workingWeight > 0}· {ex.workingWeight} kg{/if}
                  · rest {formatRest(ex.restSeconds)}
                </div>
              </div>
              <span class="caret" class:open>
                <Icon name="chevron" size={16} color="var(--text-tertiary)" />
              </span>
            </button>

            {#if open}
              <div class="ex-form fade-up">
                <label class="field">
                  <span class="lbl">Name</span>
                  <input
                    class="inp"
                    type="text"
                    value={ex.name}
                    placeholder="Exercise name"
                    oninput={(e) =>
                      update(ex.id, { name: (e.currentTarget as HTMLInputElement).value })}
                  />
                </label>

                <div class="grid-3">
                  <label class="field">
                    <span class="lbl">Sets</span>
                    <input
                      class="inp num"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      value={ex.targetSets}
                      oninput={(e) =>
                        update(ex.id, {
                          targetSets: Math.max(1, parseInt((e.currentTarget as HTMLInputElement).value) || 1)
                        })}
                    />
                  </label>
                  <label class="field">
                    <span class="lbl">Reps min</span>
                    <input
                      class="inp num"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      value={ex.targetRepsMin}
                      oninput={(e) => {
                        const v = Math.max(1, parseInt((e.currentTarget as HTMLInputElement).value) || 1);
                        const patch: Record<string, number> = { targetRepsMin: v };
                        if (v > ex.targetRepsMax) patch.targetRepsMax = v;
                        update(ex.id, patch);
                      }}
                    />
                  </label>
                  <label class="field">
                    <span class="lbl">Reps max</span>
                    <input
                      class="inp num"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      value={ex.targetRepsMax}
                      oninput={(e) => {
                        const v = Math.max(
                          ex.targetRepsMin,
                          parseInt((e.currentTarget as HTMLInputElement).value) || ex.targetRepsMin
                        );
                        update(ex.id, { targetRepsMax: v });
                      }}
                    />
                  </label>
                </div>

                <label class="field">
                  <span class="lbl">Working weight (kg)</span>
                  <input
                    class="inp"
                    type="number"
                    inputmode="decimal"
                    step="0.5"
                    min="0"
                    value={ex.workingWeight || ''}
                    placeholder="0"
                    oninput={(e) => {
                      const v = parseFloat((e.currentTarget as HTMLInputElement).value);
                      update(ex.id, { workingWeight: isNaN(v) ? 0 : v });
                    }}
                  />
                </label>

                <div class="field">
                  <span class="lbl">Rest between sets</span>
                  <div class="rest-row">
                    <input
                      class="inp num rest-input"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="15"
                      value={ex.restSeconds}
                      oninput={(e) => {
                        const v = Math.max(0, parseInt((e.currentTarget as HTMLInputElement).value) || 0);
                        update(ex.id, { restSeconds: v });
                      }}
                    />
                    <span class="rest-unit">sec</span>
                  </div>
                  <div class="presets">
                    {#each restPresets as r}
                      <button
                        class="preset"
                        class:active={ex.restSeconds === r}
                        onclick={() => update(ex.id, { restSeconds: r })}
                      >
                        {formatRest(r)}
                      </button>
                    {/each}
                  </div>
                </div>

                <label class="field">
                  <span class="lbl">Notes</span>
                  <textarea
                    class="inp"
                    rows="2"
                    placeholder="Optional cues, tempo, etc."
                    value={ex.notes ?? ''}
                    oninput={(e) =>
                      update(ex.id, { notes: (e.currentTarget as HTMLTextAreaElement).value })}
                  ></textarea>
                </label>

                <button
                  class="delete-ex"
                  onclick={() => removeExercise(ex.id, ex.name)}
                >
                  <Icon name="trash" size={16} color="var(--red)" />
                  <span>Delete Exercise</span>
                </button>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="card empty">
      <div class="empty-title">Workout not found</div>
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
    max-width: 60%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .back { margin-left: -8px; }
  .done { font-weight: 600; }

  .identity { padding: 12px; margin-top: 8px; }
  .name-input {
    width: 100%;
    background: transparent;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    padding: 4px 0;
  }
  .name-input::placeholder { color: var(--text-tertiary); }

  .ex-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ex-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    overflow: hidden;
  }
  .ex-card.open {
    background: var(--bg-elev-1);
    box-shadow: 0 0 0 1px rgba(10, 132, 255, 0.25) inset;
  }

  .ex-summary {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    text-align: left;
  }
  .ex-summary:active { background: var(--bg-elev-2); }
  .ex-meta { flex: 1; min-width: 0; }
  .ex-title {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ex-sub {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 2px;
    font-feature-settings: 'tnum';
  }
  .caret {
    transition: transform 0.2s ease;
    display: inline-flex;
  }
  .caret.open {
    transform: rotate(90deg);
  }

  .ex-form {
    padding: 4px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 0.5px solid var(--separator);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lbl {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
  }
  .inp {
    background: var(--bg-elev-2);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 16px;
    color: var(--text);
    width: 100%;
    font-family: inherit;
    resize: none;
  }
  .inp.num {
    text-align: center;
    font-weight: 600;
    font-feature-settings: 'tnum';
  }
  .inp:focus {
    background: var(--bg-elev-3);
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.5);
  }
  .inp::placeholder { color: var(--text-tertiary); }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .rest-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rest-input { flex: 0 0 96px; }
  .rest-unit { color: var(--text-secondary); font-size: 14px; }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .preset {
    padding: 6px 12px;
    background: var(--bg-elev-2);
    color: var(--text-secondary);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
  }
  .preset.active {
    background: rgba(10, 132, 255, 0.18);
    color: var(--blue);
  }

  .delete-ex {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    color: var(--red);
    font-size: 15px;
    font-weight: 500;
    border-radius: 10px;
  }
  .delete-ex:active { background: var(--bg-elev-2); }
</style>
