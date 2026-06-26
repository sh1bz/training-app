<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import Icon from '$lib/Icon.svelte';
  import Coach from '$lib/Coach.svelte';

  type Tab = {
    href: string;
    label: string;
    icon: 'summary' | 'programs' | 'history';
    match: (path: string) => boolean;
  };

  const tabs: Tab[] = [
    {
      href: '/',
      label: 'Summary',
      icon: 'summary',
      match: (p) => p === '/' || p.startsWith('/workout')
    },
    {
      href: '/programs',
      label: 'Programs',
      icon: 'programs',
      match: (p) => p.startsWith('/programs')
    },
    {
      href: '/history',
      label: 'History',
      icon: 'history',
      match: (p) => p.startsWith('/history')
    }
  ];

  let { children } = $props();
</script>

<div class="app">
  {@render children()}

  <Coach />

  <nav class="tab-bar" aria-label="Primary">
    <div class="tab-bar-inner">
      {#each tabs as tab}
        {@const active = tab.match($page.url.pathname)}
        <a class="tab" class:active href={tab.href} aria-current={active ? 'page' : undefined}>
          <Icon name={tab.icon} size={24} />
          <span>{tab.label}</span>
        </a>
      {/each}
    </div>
  </nav>
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
