<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onNavigate } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  import Coach from '$lib/Coach.svelte';

  // Native cross-page morphing via the View Transitions API (progressive —
  // browsers without support just navigate normally).
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  type Tab = {
    href: string;
    label: string;
    icon: 'summary' | 'programs' | 'history';
    match: (path: string) => boolean;
  };

  const tabs: Tab[] = [
    {
      href: `${base}/`,
      label: 'Summary',
      icon: 'summary',
      match: (p) => p === '/' || p.startsWith('/workout')
    },
    {
      href: `${base}/programs`,
      label: 'Programs',
      icon: 'programs',
      match: (p) => p.startsWith('/programs')
    },
    {
      href: `${base}/history`,
      label: 'History',
      icon: 'history',
      match: (p) => p.startsWith('/history')
    }
  ];

  // Match against the path *without* the base prefix so highlighting works
  // under GitHub Pages' /<repo>/ base.
  const relPath = $derived($page.url.pathname.slice(base.length) || '/');

  // Hide the tab bar during an active workout for a full-screen, focused session.
  const showTabs = $derived(!relPath.startsWith('/workout'));

  let { children } = $props();
</script>

<div class="app">
  {@render children()}

  <Coach />

  {#if showTabs}
    <nav class="tab-bar" aria-label="Primary">
      <div class="tab-bar-inner">
        {#each tabs as tab}
          {@const active = tab.match(relPath)}
          <a class="tab" class:active href={tab.href} aria-current={active ? 'page' : undefined}>
            <Icon name={tab.icon} size={24} />
            <span>{tab.label}</span>
          </a>
        {/each}
      </div>
    </nav>
  {/if}
</div>

<style>
  .app {
    min-height: 100dvh;
    background: var(--bg);
  }

  .tab-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px 16px calc(8px + var(--safe-bottom));
    pointer-events: none;
    z-index: 50;
    display: flex;
    justify-content: center;
  }

  .tab-bar-inner {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    background: rgba(28, 28, 30, 0.72);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-radius: 999px;
    border: 0.5px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 18px;
    border-radius: 999px;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 500;
    transition: color 0.15s ease, background 0.15s ease;
    min-width: 76px;
  }

  .tab.active {
    color: var(--blue);
    background: rgba(10, 132, 255, 0.16);
  }

  .tab:active {
    transform: scale(0.96);
  }
</style>
