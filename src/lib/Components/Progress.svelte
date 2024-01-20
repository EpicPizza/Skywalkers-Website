<script lang="ts">
  import type { Tweened } from "svelte/motion";

  export let progress: Tweened<number>;
</script>

<div
  class="w-full rounded-full h-1 mb-[6px] mt-[6px] overflow-hidden bg-border-light dark:bg-border-dark"
>
  <div style="width: {$progress * 100}%;" class="h-full bg-accent-500"></div>
</div>
