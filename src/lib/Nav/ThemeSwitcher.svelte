<script lang="ts">
  import Tooltip from "$lib/Builders/Tooltip.svelte";
  import type { createMode } from "$lib/stores";
  import { getContext, onDestroy } from "svelte";
  import type { Writable } from "svelte/store";

  let mode = getContext("mode") as ReturnType<typeof createMode>;

  let system: boolean;

  const unsubscribe = mode.subscribeSystem((value) => {
    system = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  let navmode = getContext("navmode") as Writable<boolean>;
</script>

<div
  class="box-content border-[1px] dark:border-border-dark border-border-light p-[4px] dark:text-text-dark text-text-light bg-backgroud-light dark:bg-backgroud-dark rounded-full max-w-fit flex flex-row gap-[4px]"
>
  <div
    class="flex flex-row gap-[4px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-full"
  >
    <Tooltip text="Light" bottom={$navmode}>
      <button
        on:click={() => {
          mode.set("light");
        }}
        class="box-border border-none rounded-full w-8 h-8 bg-black dark:bg-white {$mode ==
        'dark'
          ? 'bg-opacity-0 dark:bg-opacity-0'
          : 'bg-opacity-10 dark:bg-opacity-10'} flex items-center justify-around"
        ><span class="material-symbols-outlined">light_mode</span></button
      >
    </Tooltip>
    <Tooltip text="Dark" bottom={$navmode}>
      <button
        on:click={() => {
          mode.set("dark");
        }}
        class="box-border border-none rounded-full w-8 h-8 bg-black dark:bg-white {$mode ==
        'light'
          ? 'bg-opacity-0 dark:bg-opacity-0'
          : 'bg-opacity-10 dark:bg-opacity-10'} flex items-center justify-around"
        ><span class="material-symbols-outlined">dark_mode</span></button
      >
    </Tooltip>
  </div>
  <Tooltip text="System" bottom={$navmode}>
    <button
      on:click={() => {
        mode.reset();
      }}
      class="box-border border-none rounded-full w-8 h-8 bg-black dark:bg-white {system
        ? 'bg-opacity-20 dark:bg-opacity-20'
        : 'bg-opacity-10 dark:bg-opacity-10'} flex items-center justify-around"
      ><span class="material-symbols-outlined">settings_brightness</span
      ></button
    >
  </Tooltip>
</div>
