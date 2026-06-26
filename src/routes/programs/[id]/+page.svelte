<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { store, formatRest } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const program = $derived(store.getProgram($page.params.id ?? ''));

  function start(workoutId: string) {
    if (!program) return;
    const session = store.startWorkout(program.id, workoutId);
    if (session) goto(`${base}/workout/${session.id}`);
  }
</script>

<svelte:head>
  <title>{program?.name ?? 'Program'}</title>
</svelte:head>

<div class="page">
  <div class="topbar">
    <a class="back" href={`${base}/programs`}>
      <Icon name="back" size={24} color="var(--blue)" />
      <span>Programs</span>
    </a>
    {#if program}
      <a class="edit-link" href={`${base}/programs/${program.id}/edit`}>Edit</a>
    {/if}
  </div>

  {#if program}
    <header class="program-header" style:--accent={`var(--${program.color})`}>
      <div class="hero-emoji">{program.emoji}</div>
      <h1 class="hero-title">{program.name}</h1>
      {#if program.description}
        <p class="hero-desc">{program.description}</p>
      {/if}
      <div class="hero-meta">
        <span class="badge">{program.workouts.length} workouts</span>
        {#if program.daysPerWeek}<span class="badge">{program.daysPerWeek}×/week</span>{/if}
      </div>
    </header>

    <div class="section-label">Workouts</div>

    {#if program.workouts.length === 0}
      <div class="card empty">
        <div class="empty-title">No workouts yet</div>
        <div>Add workouts to this program (coming soon).</div>
      </div>
    {:else}
      <div class="workouts">
        {#each program.workouts as workout (workout.id)}
          <article class="workout-card">
            <div class="workout-head">
              <h3 class="workout-name">{workout.name}</h3>
              <button class="play-btn" aria-label={`Start ${workout.name}`} onclick={() => start(workout.id)}>
                <Icon name="play" size={16} color="#fff" />
              </button>
            </div>
            <ul class="ex-list">
              {#each workout.exercises as ex (ex.id)}
                <li class="ex-row">
                  <div class="ex-row-main">
                    <span class="ex-name">{ex.name}</span>
                    <span class="ex-target">
                      {ex.targetSets} × {ex.targetRepsMin === ex.targetRepsMax
                        ? ex.targetRepsMin
                        : `${ex.targetRepsMin}–${ex.targetRepsMax}`}
                    </span>
                  </div>
                  <div class="ex-row-meta">
                    {#if ex.workingWeight > 0}<span>{ex.workingWeight} kg</span>{/if}
                    <span>· rest {formatRest(ex.restSeconds)}</span>
                  </div>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    {/if}
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
  .back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--blue);
    font-size: 17px;
    margin-left: -8px;
    padding: 8px 8px 8px 0;
  }
  .edit-link {
    color: var(--blue);
    font-size: 17px;
    padding: 8px 4px;
  }

  .program-header {
    padding: 12px 4px 24px;
  }
  .hero-emoji {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    display: grid;
    place-items: center;
    font-size: 30px;
    margin-bottom: 16px;
  }
  .hero-title {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.022em;
    margin: 0;
  }
  .hero-desc {
    color: var(--text-secondary);
    font-size: 17px;
    margin: 8px 0 12px;
  }
  .hero-meta {
    display: flex;
    gap: 8px;
  }

  .workouts {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .workout-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 16px;
  }
  .workout-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .workout-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .play-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--blue);
    display: grid;
    place-items: center;
    padding-left: 2px;
    box-shadow: 0 4px 12px rgba(10, 132, 255, 0.35);
  }
  .play-btn:active { transform: scale(0.94); }

  .ex-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .ex-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 0;
    border-top: 0.5px solid var(--separator);
    font-size: 16px;
  }
  .ex-row:first-child { border-top: 0; padding-top: 4px; }
  .ex-row-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .ex-name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ex-target {
    color: var(--text-secondary);
    font-feature-settings: 'tnum';
    font-size: 15px;
    flex-shrink: 0;
  }
  .ex-row-meta {
    display: flex;
    gap: 6px;
    font-size: 13px;
    color: var(--text-tertiary);
    font-feature-settings: 'tnum';
  }
</style>
