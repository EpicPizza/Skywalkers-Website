<script lang="ts">
  import { getContext } from "svelte";
  import Loading from "./Loading.svelte";
  import type { Writable } from "svelte/store";

  let loading = getContext("loading") as Writable<boolean>;
  let localLoading = getContext("localLoading") as Writable<boolean>;

  export let size: string = "32rem";
  export let expand: boolean = false;
  export let brLoader: boolean = false;
  export let disableLoader: boolean = false;

  let page: HTMLElement;
  let top = 0;
</script>

<div
  class="bg-backgroud-light relative max-w-full dark:bg-backgroud-dark border-border-light dark:border-border-dark shadow-sm dark:shadow-lg border-[1px] rounded-2xl max-h-full overflow-auto"
>
  <div
    class="h-full overflow-y-auto p-4"
    bind:this={page}
    on:scroll={() => {
      top = page.scrollTop;
    }}
  >
    {#if $loading}
      <Loading></Loading>
    {:else}
      <div
        style="{!expand
          ? 'max-'
          : 'max-width: 100%; '}width: calc({size} + 2rem); overflow: hidden;"
        class="overflow-hidden p-4"
      >
        <slot {top} />
      </div>
    {/if}
  </div>
  {#if $localLoading && !disableLoader}
    <div class="absolute {brLoader ? 'bottom-8 left-8' : 'top-8 right-8'}">
      <Loading></Loading>
    </div>
  {/if}
</div>
