<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const session = $derived(store.getSession($page.params.id ?? ''));

  const stats = $derived.by(() => {
    if (!session) return { volume: 0, setCount: 0, duration: '' };
    let volume = 0,
      setCount = 0;
    for (const ex of session.exercises) {
      for (const s of ex.sets) {
        if (!s.done) continue;
        volume += s.weight * s.reps;
        setCount++;
      }
    }
    let duration = '';
    if (session.endedAt) {
      const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
      const min = Math.max(1, Math.round(ms / 60000));
      duration = min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`;
    }
    return { volume, setCount, duration };
  });

  const dateLine = $derived.by(() => {
    if (!session) return '';
    const d = new Date(session.startedAt);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  });
</script>

<svelte:head>
  <title>{session?.workoutName ?? 'Session'}</title>
</svelte:head>

<div class="page">
  <a class="back" href={`${base}/history`}>
    <Icon name="back" size={24} color="var(--blue)" />
    <span>History</span>
  </a>

  {#if session}
    <header class="hd-header">
      <div class="hd-date">{dateLine}</div>
      <h1 class="hd-title">{session.workoutName}</h1>
      <div class="hd-prog">{session.programName}</div>
    </header>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value">{stats.duration || '—'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sets</div>
        <div class="stat-value">{stats.setCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Volume</div>
        <div class="stat-value">{(stats.volume / 1000).toFixed(1)}<span class="unit">t</span></div>
      </div>
    </div>

    <div class="section-label">Exercises</div>
    <div class="exercises">
      {#each session.exercises as ex}
        <div class="ex-card">
          <h3 class="ex-name">{ex.name}</h3>
          <div class="set-list">
            {#each ex.sets as set, i}
              {#if set.done}
                <div class="set-row">
                  <span class="set-i">{i + 1}</span>
                  <span class="set-vals">
                    <strong>{set.weight}</strong><span class="u">kg</span>
                    <span class="x">×</span>
                    <strong>{set.reps}</strong>
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="card empty">
      <div class="empty-title">Session not found</div>
    </div>
  {/if}
</div>

<style>
  .back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--blue);
    font-size: 17px;
    margin-bottom: 4px;
    margin-left: -8px;
    padding: 8px 8px 8px 0;
  }

  .hd-header { padding: 8px 4px 16px; }
  .hd-date {
    color: var(--text-secondary);
    font-size: 13px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .hd-title {
    margin: 4px 0 2px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.022em;
  }
  .hd-prog {
    color: var(--text-secondary);
    font-size: 15px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .stat-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 14px 12px;
    text-align: center;
  }
  .stat-label {
    color: var(--text-secondary);
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-feature-settings: 'tnum';
  }
  .stat-value .unit {
    font-size: 14px;
    color: var(--text-secondary);
    margin-left: 2px;
  }

  .exercises { display: flex; flex-direction: column; gap: 12px; }
  .ex-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 14px 16px;
  }
  .ex-name {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
  }
  .set-list { display: flex; flex-direction: column; gap: 4px; }
  .set-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 6px 0;
    border-top: 0.5px solid var(--separator);
    font-size: 16px;
    font-feature-settings: 'tnum';
  }
  .set-row:first-child { border-top: 0; padding-top: 2px; }
  .set-i {
    color: var(--text-secondary);
    font-size: 13px;
    width: 18px;
    font-weight: 600;
  }
  .set-vals strong { font-weight: 600; }
  .u { color: var(--text-secondary); font-size: 13px; margin-left: 2px; margin-right: 4px; }
  .x { color: var(--text-tertiary); margin: 0 4px; }
</style>
