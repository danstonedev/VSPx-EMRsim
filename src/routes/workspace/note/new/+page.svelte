<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/workspace', { replaceState: true });
  });
</script>

<p>Redirecting to workspace…</p>
