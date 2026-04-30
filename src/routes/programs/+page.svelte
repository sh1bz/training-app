<script lang="ts">
  import { goto } from '$app/navigation';
  import { store } from '$lib/store.svelte';
  import Icon from '$lib/Icon.svelte';

  const emojis = ['🏋️', '💪', '🦵', '🔥', '⚡', '🎯', '🏃', '🧘'];
  function pickEmoji(curr: string) {
    const i = emojis.indexOf(curr);
    return emojis[(i + 1) % emojis.length];
  }

  let creating = $state(false);
  let newName = $state('');
  let newDesc = $state('');
  let newEmoji = $state('🏋️');

  function submitNew(e: Event) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = store.createProgram({ name: newName, description: newDesc, emoji: newEmoji });
    newName = '';
    newDesc = '';
    newEmoji = '🏋️';
    creating = false;
    goto(`/programs/${p.id}/edit`);
  }
</script>

<svelte:head>
  <title>Programs</title>
</svelte:head>

<div class="page">
  <header class="page-title">
    <span>Programs</span>
    <button class="add-btn" onclick={() => (creating = true)} aria-label="Add program">
      <Icon name="plus" size={20} color="var(--blue)" />
    </button>
  </header>

  {#if creating}
    <form class="card create-form fade-up" onsubmit={submitNew}>
      <div class="emoji-row">
        <button type="button" class="emoji-btn" onclick={() => (newEmoji = pickEmoji(newEmoji))}>
          {newEmoji}
        </button>
        <input
          class="form-input name-input"
          type="text"
          placeholder="Program name"
          bind:value={newName}
        />
      </div>
      <textarea
        class="form-input desc-input"
        placeholder="Short description"
        rows="2"
        bind:value={newDesc}
      ></textarea>
      <div class="form-actions">
        <button type="button" class="btn-pill-sm" onclick={() => (creating = false)}>
          Cancel
        </button>
        <button type="submit" class="btn-pill-primary" disabled={!newName.trim()}>
          Create
        </button>
      </div>
    </form>
  {/if}

  <div class="section-label">All Programs</div>

  <div class="list-card">
    {#each store.programs as program}
      <a class="list-row" href={`/programs/${program.id}`}>
        <div class="leading" style:background={`color-mix(in srgb, var(--${program.color}) 22%, transparent)`}>
          <span style:font-size="18px">{program.emoji}</span>
        </div>
        <div class="body">
          <div class="title">{program.name}</div>
          <div class="subtitle">
            {program.workouts.length} workout{program.workouts.length === 1 ? '' : 's'}
            {#if program.daysPerWeek}· {program.daysPerWeek}×/week{/if}
          </div>
        </div>
        <Icon name="chevron" size={16} color="var(--text-tertiary)" />
      </a>
    {/each}
  </div>

  {#if store.programs.length === 0}
    <div class="card empty">
      <div class="empty-title">No programs yet</div>
      <div>Tap + to create your first one.</div>
    </div>
  {/if}
</div>

<style>
  .add-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-elev-2);
    display: grid;
    place-items: center;
  }
  .add-btn:active { background: var(--bg-elev-3); }

  .create-form {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .emoji-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .emoji-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--bg-elev-2);
    font-size: 26px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .form-input {
    background: var(--bg-elev-2);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 16px;
    color: var(--text);
    width: 100%;
    resize: none;
    font-family: inherit;
  }
  .form-input::placeholder { color: var(--text-tertiary); }
  .name-input { flex: 1; }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }

  .btn-pill-primary {
    padding: 8px 18px;
    border-radius: 999px;
    background: var(--blue);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
  }
  .btn-pill-primary:disabled {
    opacity: 0.4;
  }
</style>
