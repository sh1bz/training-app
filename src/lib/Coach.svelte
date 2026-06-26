<script lang="ts">
  import { store } from '$lib/store.svelte';
  import { applyAction, interpret } from '$lib/coach';
  import type { CoachActionId, CoachResult } from '$lib/types';
  import Icon from '$lib/Icon.svelte';

  // Only useful with a live session to reshape.
  const session = $derived(store.activeSession);

  let open = $state(false);
  let input = $state('');
  let reply = $state('');
  let result = $state<CoachResult | null>(null);

  const actions: { id: CoachActionId; label: string; emoji: string }[] = [
    { id: 'easier', label: 'Easier', emoji: '🪶' },
    { id: 'harder', label: 'Harder', emoji: '🔥' },
    { id: 'shorter', label: 'Shorter', emoji: '⏱️' },
    { id: 'longer', label: 'Longer', emoji: '➕' },
    { id: 'no-equipment', label: 'No Equipment', emoji: '🏠' },
    { id: 'gym-busy', label: 'Gym Busy', emoji: '👥' },
    { id: 'variations', label: 'Change Exercises', emoji: '🔄' }
  ];

  function reset() {
    reply = '';
    result = null;
  }

  function tap(id: CoachActionId) {
    if (!session) return;
    const r = applyAction(id, session);
    result = r;
    reply = r.summary;
  }

  function ask() {
    if (!session || !input.trim()) return;
    const r = interpret(input, session);
    reply = r.reply;
    result = r.result ?? null;
    input = '';
  }

  function apply() {
    if (!session || !result) return;
    store.applyCoachResult(session.id, result);
    try {
      navigator.vibrate?.(20);
    } catch {}
    close();
  }

  function close() {
    open = false;
    reset();
    input = '';
  }
</script>

{#if session}
  <button class="fab" onclick={() => (open = true)} aria-label="AI Coach">
    <Icon name="sparkles" size={22} color="#fff" />
    <span>Coach</span>
  </button>
{/if}

{#if open && session}
  <div
    class="scrim"
    role="button"
    tabindex="-1"
    aria-label="Close coach"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
  ></div>

  <div class="sheet" role="dialog" aria-label="AI Coach">
    <div class="grabber"></div>
    <header class="sheet-head">
      <div class="title"><Icon name="sparkles" size={18} color="var(--blue)" /> Coach</div>
      <div class="sub">{session.workoutName}</div>
    </header>

    <div class="chips">
      {#each actions as a}
        <button class="chip" onclick={() => tap(a.id)}>
          <span>{a.emoji}</span>{a.label}
        </button>
      {/each}
    </div>

    <div class="ask">
      <input
        class="ask-input"
        placeholder="Ask anything — “shoulder hurts”, “30 mins”…"
        bind:value={input}
        onkeydown={(e) => e.key === 'Enter' && ask()}
      />
      <button class="send" onclick={ask} aria-label="Send">
        <Icon name="chevron" size={18} color="#fff" />
      </button>
    </div>

    {#if reply}
      <div class="reply fade-up">{reply}</div>
    {/if}

    {#if result}
      {#if result.changes.length}
        <ul class="changes fade-up">
          {#each result.changes as c}
            <li>
              <span class="ex">{c.exercise}</span>
              <span class="arrow">{c.to ? `→ ${c.to}` : c.detail}</span>
            </li>
          {/each}
        </ul>
      {/if}
      <button class="apply fade-up" onclick={apply}>Apply to workout</button>
    {/if}
  </div>
{/if}

<style>
  .fab {
    position: fixed;
    right: 16px;
    bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + 4px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 18px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(10, 132, 255, 0.4);
    z-index: 70;
  }
  .fab:active {
    transform: scale(0.95);
  }

  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 80;
    animation: fade 0.2s ease;
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 90;
    background: var(--bg-elev-1);
    border-radius: 22px 22px 0 0;
    padding: 8px 16px calc(20px + var(--safe-bottom));
    max-width: 640px;
    margin: 0 auto;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.6);
    animation: slideUp 0.26s cubic-bezier(0.32, 0.72, 0, 1) both;
    max-height: 85dvh;
    overflow-y: auto;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .grabber {
    width: 36px;
    height: 5px;
    border-radius: 999px;
    background: var(--bg-elev-3);
    margin: 4px auto 12px;
  }

  .sheet-head {
    margin-bottom: 14px;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .sub {
    color: var(--text-secondary);
    font-size: 14px;
    margin-top: 2px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 999px;
    background: var(--bg-elev-2);
    color: var(--text);
    font-size: 15px;
    font-weight: 500;
  }
  .chip:active {
    background: var(--bg-elev-3);
    transform: scale(0.96);
  }

  .ask {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .ask-input {
    flex: 1;
    padding: 13px 16px;
    background: var(--bg-elev-2);
    border-radius: 999px;
    font-size: 16px;
    color: var(--text);
    caret-color: var(--blue);
  }
  .ask-input::placeholder {
    color: var(--text-tertiary);
  }
  .send {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--blue);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .send:active {
    transform: scale(0.94);
  }

  .reply {
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--bg-elev-2);
    border-radius: 14px;
    font-size: 15px;
    line-height: 1.4;
    color: var(--text);
  }

  .changes {
    list-style: none;
    margin: 12px 0 0;
    padding: 4px 0;
  }
  .changes li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 4px;
    border-top: 0.5px solid var(--separator);
    font-size: 15px;
  }
  .changes li:first-child {
    border-top: 0;
  }
  .ex {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .arrow {
    color: var(--blue);
    flex-shrink: 0;
    font-feature-settings: 'tnum';
  }

  .apply {
    margin-top: 16px;
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    background: var(--blue);
    color: #fff;
    font-size: 17px;
    font-weight: 700;
  }
  .apply:active {
    opacity: 0.85;
    transform: scale(0.99);
  }
</style>
