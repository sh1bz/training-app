<script lang="ts">
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const completedSessions = $derived(store.sessions.filter((s) => s.endedAt));
  const lastSession = $derived(completedSessions[0]);

  const weekStart = $derived.by(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const sessionsThisWeek = $derived(
    completedSessions.filter((s) => new Date(s.startedAt) >= weekStart).length
  );

  const totalVolumeThisWeek = $derived.by(() => {
    let v = 0;
    for (const s of completedSessions) {
      if (new Date(s.startedAt) < weekStart) continue;
      for (const ex of s.exercises) {
        for (const set of ex.sets) {
          if (set.done) v += set.weight * set.reps;
        }
      }
    }
    return v;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
</script>

<svelte:head>
  <title>Summary</title>
</svelte:head>

<div class="page">
  <header class="page-title">
    <span>Summary</span>
    <div class="avatar">RS</div>
  </header>

  {#if store.activeSession}
    {@const s = store.activeSession}
    <a class="active-card fade-up" href={`/workout/${s.id}`}>
      <div class="active-pulse"></div>
      <div class="active-body">
        <div class="active-label">Workout in progress</div>
        <div class="active-title">{s.workoutName}</div>
        <div class="active-sub">{s.programName}</div>
      </div>
      <div class="active-cta">
        <Icon name="chevron" size={18} />
      </div>
    </a>
  {/if}

  <div class="section-label">This Week</div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-icon" style:color="var(--orange)">
        <Icon name="flame" size={20} />
      </div>
      <div class="stat-value">{sessionsThisWeek}</div>
      <div class="stat-label">Workouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style:color="var(--blue)">
        <Icon name="dumbbell" size={20} />
      </div>
      <div class="stat-value">{(totalVolumeThisWeek / 1000).toFixed(1)}<span class="unit">t</span></div>
      <div class="stat-label">Volume</div>
    </div>
  </div>

  <div class="section-header">
    <h2>Recent</h2>
    <a class="action" href="/history">See All</a>
  </div>

  {#if lastSession}
    <a class="recent-card" href={`/history/${lastSession.id}`}>
      <div class="recent-meta">
        <div class="recent-date">{formatDate(lastSession.startedAt)}</div>
        <div class="recent-title">{lastSession.workoutName}</div>
        <div class="recent-sub">
          {lastSession.exercises.length} exercises ·
          {lastSession.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0)} sets
        </div>
      </div>
      <Icon name="chevron" size={18} color="var(--text-tertiary)" />
    </a>
  {:else}
    <div class="card empty">
      <div class="empty-title">No workouts yet</div>
      <div>Start a workout from your Programs.</div>
    </div>
  {/if}

  <div class="section-header">
    <h2>Quick Start</h2>
  </div>
  <a class="card quick-start" href="/programs">
    <div class="quick-icon">🏋️</div>
    <div class="quick-body">
      <div class="quick-title">Choose a program</div>
      <div class="quick-sub">Browse and start a workout</div>
    </div>
    <Icon name="chevron" size={18} color="var(--text-tertiary)" />
  </a>
</div>

<style>
  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-card {
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 16px;
  }

  .stat-icon {
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.022em;
    line-height: 1;
  }

  .stat-value .unit {
    font-size: 17px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-left: 2px;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 14px;
    margin-top: 6px;
    font-weight: 500;
  }

  .active-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(10, 132, 255, 0.18), rgba(48, 209, 88, 0.12));
    border: 0.5px solid rgba(10, 132, 255, 0.4);
    border-radius: var(--radius-card);
    margin-bottom: 16px;
    color: var(--text);
  }

  .active-pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.6);
    animation: pulse 1.6s ease-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(48, 209, 88, 0); }
    100% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0); }
  }

  .active-body {
    flex: 1;
    min-width: 0;
  }
  .active-label {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--green);
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .active-title {
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-top: 2px;
  }
  .active-sub {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
  .active-cta {
    color: var(--text-secondary);
  }

  .recent-card {
    display: flex;
    align-items: center;
    background: var(--bg-elev-1);
    border-radius: var(--radius-card);
    padding: 16px;
    color: var(--text);
  }
  .recent-meta { flex: 1; min-width: 0; }
  .recent-date {
    font-size: 13px;
    color: var(--text-secondary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .recent-title {
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-top: 4px;
  }
  .recent-sub {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .quick-start {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--text);
  }
  .quick-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--bg-elev-2);
    display: grid;
    place-items: center;
    font-size: 24px;
    flex-shrink: 0;
  }
  .quick-body { flex: 1; }
  .quick-title { font-size: 17px; font-weight: 600; }
  .quick-sub { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
</style>
