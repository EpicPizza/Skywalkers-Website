<script lang="ts">
    import FullNav from "$lib/Nav/FullNav.svelte";
    import ReducedNav from "$lib/Nav/ReducedNav.svelte";
    import { navmode } from "$lib/stores";
    import Menu from "$lib/Nav/Menu.svelte";
    import { navigating } from "$app/stores";

    let width: number;

    $: $navmode = width <= 640 ? false : true; //false - reduced, true - full; used to disable menu on expand
</script>

<svelte:window bind:innerWidth={width}></svelte:window>

<!--Made real Nav absolute so it can have higher z-index than menu, allowing profile menu to appear over main menu.-->
<div class="h-16 w-full"></div>
<nav class="w-full h-16 fixed min-w-[300px] z-30 border-b-[1px] shadow-shadow-light dark:shadow-shadow-dark bg-backgroud-light { $navigating ? "strobe" : "normal" } shadow-lg dark:bg-backgroud-dark dark:shadow-lg top-0">
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

<style lang=postcss>
    .strobe {
        @apply after:animate-strobe after:delay-1000 border-b-[1px] border-border-light dark:border-border-dark after:h-[3px] after:w-full after:bg-red-500 after:absolute after:-translate-y-[2px] after:bg-opacity-100;
    }

    .normal {
        @apply after:animate-strobe border-b-[1px] border-border-light dark:border-border-dark after:h-[3px] after:w-full after:bg-red-500 after:absolute after:-translate-y-[2px] after:bg-opacity-0;
    }
</style>