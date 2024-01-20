<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase";
  import { createDropdownMenu, melt } from "@melt-ui/svelte";
  import { createEventDispatcher, getContext } from "svelte";

  const {
    states: { open },
    elements: { menu, item, trigger, arrow },
  } = createDropdownMenu();

  export let choices: string[];
  export let selected: string;
  export let raw = false;

  const dispatch = createEventDispatcher();

  let className: string = "-translate-y-1";

  export { className as class };
</script>

<button
  on:click|stopPropagation
  class={raw ? "w-fit" : "w-full sm:w-fit"}
  tabindex={-1}
>
  <button use:melt={$trigger} class={raw ? "w-fit" : "w-full sm:w-fit"}>
    <slot />
  </button>
</button>

<div
  use:melt={$menu}
  class="bg-backgroud-light {className} dark:bg-backgroud-dark w-52 p-2 border-[1px] rounded-lg border-border-light dark:border-border-dark shadow-lg"
>
  {#each choices as choice}
    <button
      on:click|stopPropagation={() => {
        dispatch("select", choice);
      }}
      use:melt={$item}
      class="w-full p-2 py-1.5 mb-0.5 bg-black dark:bg-white {choice == selected
        ? 'bg-opacity-5 dark:bg-opacity-5'
        : 'bg-opacity-0 dark:bg-opacity-0'} hover:bg-opacity-10 dark:hover:bg-opacity-10 transition rounded-md"
    >
      <div class="flex items-center justify-between">
        {choice}
        {#if choice == selected}
          <Icon icon="check"></Icon>
        {/if}
      </div>
    </button>
  {/each}
  <div
    use:melt={$arrow}
    class="border-[1px] border-r-transparent border-b-transparent border-l-border-light dark:border-l-border-dark border-t-border-light dark:border-t-border-dark shadow-lg"
  />
</div>
