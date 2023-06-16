<script lang="ts">
    import FullNav from "$lib/Nav/FullNav.svelte";
    import ReducedNav from "$lib/Nav/ReducedNav.svelte";
    import { dialogOpen, navmode } from "$lib/stores";
    import Menu from "$lib/Nav/Menu.svelte";
    import { onMount } from "svelte";
    let width: number;

    $: $navmode = width <= 640 ? false : true; //false - reduced, true - full; used to disable menu on expand

    /*let nav: HTMLElement;

    let offset = 0;

    dialogOpen.subscribe((value) => {
        let count = 0;
        let unsubscribe = setInterval(() => {
            let newOffset = nav ? nav.getBoundingClientRect().y : 0;
            offset -= newOffset;
            if(nav) {
                if(count > 100) {
                    clearInterval(unsubscribe);
                }
                count++;
            }
        }, 10);
    })

    $: console.log("offset", offset);*/
</script>

<svelte:window bind:innerWidth={width}></svelte:window>

<!--Made real Nav absolute so it can have higher z-index than menu, allowing profile menu to appear over main menu.-->
<div class="h-16 w-full"></div>
<nav class="w-full h-16 fixed min-w-[300px] z-30 border-b-[1px] shadow-shadow-light dark:shadow-shadow-dark bg-white border-slate-300 dark:border-zinc-700 shadow-lg dark:bg-zinc-800 dark:shadow-lg top-0">
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