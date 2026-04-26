<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let status = $state<'idle' | 'ok' | 'error'>('idle');
  let detail = $state('');

  onMount(async () => {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      status = 'ok';
      detail = 'Supabase client initialized.';
    } catch (e) {
      status = 'error';
      detail = e instanceof Error ? e.message : String(e);
    }
  });
</script>

<main>
  <h1>Hello World</h1>
  <p>SvelteKit + Supabase one-pager.</p>
  <p class="status status-{status}">
    {#if status === 'idle'}
      Connecting to Supabase…
    {:else if status === 'ok'}
      ✓ {detail}
    {:else}
      ✗ {detail}
    {/if}
  </p>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 32rem;
    margin: 4rem auto;
    padding: 0 1rem;
    text-align: center;
  }
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  .status {
    margin-top: 2rem;
    font-family: ui-monospace, monospace;
    font-size: 0.9rem;
  }
  .status-ok {
    color: #16a34a;
  }
  .status-error {
    color: #dc2626;
  }
</style>
