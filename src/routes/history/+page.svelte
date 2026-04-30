<script lang="ts">
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const completed = $derived(
    store.sessions
      .filter((s) => s.endedAt)
      .slice()
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  );

  const grouped = $derived.by(() => {
    const groups: Record<string, typeof completed> = {};
    for (const s of completed) {
      const d = new Date(s.startedAt);
      const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      (groups[key] ??= []).push(s);
    }
    return Object.entries(groups);
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const sessionStats = (s: (typeof completed)[number]) => {
    let setCount = 0;
    let volume = 0;
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue;
        setCount++;
        volume += set.weight * set.reps;
      }
    }
    return { setCount, volume, exCount: s.exercises.length };
  };

  const duration = (s: (typeof completed)[number]) => {
    if (!s.endedAt) return '';
    const ms = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    const min = Math.max(1, Math.round(ms / 60000));
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };
</script>

<svelte:head>
  <title>History</title>
</svelte:head>

<div class="page">
  <header class="page-title">
    <span>History</span>
  </header>

  {#if completed.length === 0}
    <div class="card empty">
      <div class="empty-title">No history yet</div>
      <div>Finished workouts will show up here.</div>
    </div>
  {:else}
    {#each grouped as [month, sessions]}
      <div class="section-label">{month}</div>
      <div class="list-card">
        {#each sessions as s (s.id)}
          {@const stats = sessionStats(s)}
          <a class="list-row history-row" href={`/history/${s.id}`}>
            <div class="leading date">
              <div class="date-day">{new Date(s.startedAt).getDate()}</div>
              <div class="date-mon">{new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short' })}</div>
            </div>
            <div class="body">
              <div class="title">{s.workoutName}</div>
              <div class="subtitle">
                {formatDate(s.startedAt)} · {duration(s)} · {stats.exCount} ex · {stats.setCount} sets
              </div>
            </div>
            <div class="trailing">
              <span class="vol">{(stats.volume / 1000).toFixed(1)}t</span>
              <Icon name="chevron" size={14} color="var(--text-tertiary)" />
            </div>
          </a>
        {/each}
      </div>
    {/each}
  {/if}
</div>

<style>
  .leading.date {
    flex-direction: column;
    width: 44px;
    height: 44px;
    background: var(--bg-elev-2);
    border-radius: 10px;
    color: var(--text);
    line-height: 1;
  }
  .date-day {
    font-size: 18px;
    font-weight: 700;
    font-feature-settings: 'tnum';
  }
  .date-mon {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-top: 2px;
  }
  .vol {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    font-feature-settings: 'tnum';
  }
</style>
