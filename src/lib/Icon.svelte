<script lang="ts">
  type Props = {
    name:
      | 'summary'
      | 'programs'
      | 'history'
      | 'plus'
      | 'check'
      | 'chevron'
      | 'play'
      | 'close'
      | 'flame'
      | 'dumbbell'
      | 'clock'
      | 'trash'
      | 'back'
      | 'search';
    size?: number;
    color?: string;
  };
  let { name, size = 22, color = 'currentColor' }: Props = $props();
</script>

{#if name === 'summary'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
{:else if name === 'programs'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
{:else if name === 'history'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
{:else if name === 'plus'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
{:else if name === 'check'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
{:else if name === 'chevron'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
{:else if name === 'back'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 6l-6 6 6 6" />
  </svg>
{:else if name === 'play'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M7 5v14l12-7L7 5z" />
  </svg>
{:else if name === 'close'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
{:else if name === 'flame'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13.5 2c.6 3 2.5 4.5 4 6.5s2.5 4 2.5 6c0 4-3.4 7.5-8 7.5S4 18.5 4 14.5C4 11 6 8.5 8.5 7c.5 1.4 1.5 2.5 2.5 2.5C12 9.5 13 7 13.5 2z" />
  </svg>
{:else if name === 'dumbbell'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
  </svg>
{:else if name === 'clock'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
{:else if name === 'trash'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
{:else if name === 'search'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
{/if}
