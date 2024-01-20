<script lang="ts">
  import FullNav from "$lib/Nav/FullNav.svelte";
  import ReducedNav from "$lib/Nav/ReducedNav.svelte";
  import Menu from "$lib/Nav/Menu.svelte";
  import { navigating } from "$app/stores";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  let navmode = getContext("navmode") as Writable<boolean>;

  let width: number;

  $: $navmode = width <= 640 ? false : true; //false - reduced, true - full; used to disable menu on expand

  //{ $navigating ? "strobe" : "normal" }
</script>

<svelte:window bind:innerWidth={width} />

{#if $navigating}
  <div
    id="loading_bar"
    class="h-[3px] z-[100] fixed bg-accent-500 animate-spin"
  ></div>
{/if}

<!--Made real Nav absolute so it can have higher z-index than menu, allowing profile menu to appear over main menu.-->
<nav
  class="w-full fixed select-none p-1 min-w-[300px] z-40 border-b-[1px] shadow-shadow-light dark:shadow-shadow-dark bg-backgroud-light border-border-light dark:border-border-dark shadow-lg dark:bg-backgroud-dark dark:shadow-lg top-0"
>
  <div class="pl-2 pr-2 h-16">
    <div class="hidden sm:contents h-full">
      <div class="w-full h-full flex items-center justify-between">
        <FullNav></FullNav>
      </div>
    </div>
    <div class="relative sm:hidden h-full">
      <div class="h-full">
        <ReducedNav></ReducedNav>
      </div>
    </div>
  </div>
  <Menu></Menu>
</nav>

<style lang="postcss">
  @keyframes load {
    0% {
      width: 25%;
      transform: translate(-25vw, 0px);
    }
    50% {
      width: 75%;
      transform: translate(0vw, 0px);
    }
    100% {
      width: 10%;
      transform: translate(100vw, 0px);
    }
  }

  #loading_bar {
    animation: load 2s linear 0.5s infinite;
  }
</style>
