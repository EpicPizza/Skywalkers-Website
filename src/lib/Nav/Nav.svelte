<script lang="ts">
    import FullNav from "$lib/Nav/FullNav.svelte";
    import ReducedNav from "$lib/Nav/ReducedNav.svelte";
    import { navmode } from "$lib/stores";
    import Menu from "$lib/Nav/Menu.svelte";
    let width: number;

    $: $navmode = width <= 640 ? false : true; //false - reduced, true - full; used to disable menu on expand
</script>

<svelte:window bind:innerWidth={width}></svelte:window>

<!--Made real Nav absolute so it can have higher z-index than menu, allowing profile menu to appear over main menu.-->
<nav class="w-full h-16 sticky z-10 border-b-[1px] shadow-shadow-light dark:shadow-shadow-dark bg-white border-slate-300 dark:border-zinc-700 shadow-lg dark:bg-zinc-800 dark:shadow-xl top-0">
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